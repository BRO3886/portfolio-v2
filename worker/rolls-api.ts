import type { IngestMessage } from './rolls-ingest';

export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
const CAPTION_MAX = 280;
const ALT_MAX = 420;
const FILENAME_MAX = 255;
const TITLE_MAX = 120;
const SLUG = /^[a-z0-9-]{1,64}$/;
const ROLL_DATE = /^\d{4}-\d{2}(-\d{2})?$/;
const PHOTO_ID = /^[0-9a-f]{16}$/;

class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

const reply = (status: number, body: unknown) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

// SQLite's length() counts code points, so limits are checked the same way.
const chars = (s: string) => [...s].length;

async function authorized(request: Request, token: string): Promise<boolean> {
  const header = request.headers.get('Authorization') ?? '';
  const given = header.startsWith('Bearer ') ? header.slice(7) : '';
  // Hashing first gives both sides the same length, which timingSafeEqual requires.
  const encoder = new TextEncoder();
  const [a, b] = await Promise.all([crypto.subtle.digest('SHA-256', encoder.encode(given)), crypto.subtle.digest('SHA-256', encoder.encode(token))]);
  return crypto.subtle.timingSafeEqual(a, b) && given.length > 0;
}

// Header values are bytes, so the Shortcut and the script percent-encode them as UTF-8.
function textHeader(request: Request, name: string, max: number): string | null {
  const raw = request.headers.get(name);
  if (raw === null || raw === '') return null;
  let value: string;
  try {
    value = decodeURIComponent(raw);
  } catch {
    throw new HttpError(400, `${name} is not valid percent-encoded UTF-8`);
  }
  if (chars(value) > max) throw new HttpError(400, `${name} is longer than ${max} characters`);
  return value;
}

async function readJson(request: Request): Promise<Record<string, unknown>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new HttpError(400, 'body is not JSON');
  }
  if (typeof body !== 'object' || body === null || Array.isArray(body)) throw new HttpError(400, 'body must be a JSON object');
  return body as Record<string, unknown>;
}

function onlyKeys(body: Record<string, unknown>, allowed: string[]) {
  const unknown = Object.keys(body).filter((k) => !allowed.includes(k));
  if (unknown.length) throw new HttpError(400, `unknown field ${unknown.join(', ')}`);
}

function optionalText(body: Record<string, unknown>, key: string, max: number, nullable: boolean): string | null | undefined {
  const v = body[key];
  if (v === undefined) return undefined;
  if (v === null && nullable) return null;
  if (typeof v !== 'string' || v.length === 0 || chars(v) > max) throw new HttpError(400, `${key} must be ${nullable ? 'null or ' : ''}a string of 1 to ${max} characters`);
  return v;
}

function optionalBool(body: Record<string, unknown>, key: string): number | undefined {
  const v = body[key];
  if (v === undefined) return undefined;
  if (typeof v !== 'boolean') throw new HttpError(400, `${key} must be true or false`);
  return v ? 1 : 0;
}

async function listRolls(env: Env) {
  const { results } = await env.DB.prepare(
    `SELECT r.slug, r.title, COUNT(p.id) AS photos
     FROM rolls r LEFT JOIN photos p ON p.roll = r.slug
     GROUP BY r.slug ORDER BY r.created_at DESC, r.slug`,
  ).all();
  return reply(200, { rolls: results });
}

async function putRoll(request: Request, env: Env, slug: string) {
  if (!SLUG.test(slug)) throw new HttpError(400, 'slug must be 1 to 64 characters of a-z, 0-9 and -');
  const body = await readJson(request);
  onlyKeys(body, ['title', 'camera', 'film', 'date', 'ignoreExif']);
  const title = optionalText(body, 'title', TITLE_MAX, false);
  const camera = optionalText(body, 'camera', TITLE_MAX, true);
  const film = optionalText(body, 'film', TITLE_MAX, true);
  const date = body.date;
  if (date !== undefined && date !== null && (typeof date !== 'string' || !ROLL_DATE.test(date))) throw new HttpError(400, 'date must be null, YYYY-MM or YYYY-MM-DD');
  const ignoreExif = optionalBool(body, 'ignoreExif');

  const existing = await env.DB.prepare('SELECT 1 FROM rolls WHERE slug = ?').bind(slug).first();
  if (!existing) {
    if (title === undefined) throw new HttpError(400, 'title is required to create a roll');
    await env.DB.prepare('INSERT INTO rolls (slug, title, camera, film, date, ignore_exif) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(slug, title, camera ?? null, film ?? null, date ?? null, ignoreExif ?? 0)
      .run();
    return reply(201, { slug });
  }

  const changes = Object.entries({ title, camera, film, date, ignore_exif: ignoreExif }).filter(([, v]) => v !== undefined);
  if (changes.length) {
    await env.DB.prepare(`UPDATE rolls SET ${changes.map(([k]) => `${k} = ?`).join(', ')} WHERE slug = ?`)
      .bind(...changes.map(([, v]) => v), slug)
      .run();
  }
  return reply(200, { slug });
}

async function uploadPhoto(request: Request, env: Env, url: URL) {
  const roll = url.searchParams.get('roll');
  if (!roll) throw new HttpError(400, 'roll is required');
  if (!(await env.DB.prepare('SELECT 1 FROM rolls WHERE slug = ?').bind(roll).first())) throw new HttpError(400, 'create the roll first');

  const alt = textHeader(request, 'X-Alt', ALT_MAX);
  const caption = textHeader(request, 'X-Caption', CAPTION_MAX);
  const filename = textHeader(request, 'X-Filename', FILENAME_MAX);
  const featured = request.headers.get('X-Featured') === '1' ? 1 : 0;

  const declared = Number(request.headers.get('Content-Length') ?? 0);
  if (declared > MAX_UPLOAD_BYTES) throw new HttpError(413, `the file is larger than ${MAX_UPLOAD_BYTES} bytes`);
  const body = new Uint8Array(await request.arrayBuffer());
  if (body.byteLength > MAX_UPLOAD_BYTES) throw new HttpError(413, `the file is larger than ${MAX_UPLOAD_BYTES} bytes`);
  if (body.byteLength < 3 || body[0] !== 0xff || body[1] !== 0xd8 || body[2] !== 0xff) throw new HttpError(415, 'the body must be a JPEG');

  const sha = [...new Uint8Array(await crypto.subtle.digest('SHA-256', body))].map((b) => b.toString(16).padStart(2, '0')).join('');
  const id = sha.slice(0, 16);

  const existing = await env.DB.prepare('SELECT status, original_key FROM photos WHERE sha256 = ?').bind(sha).first<{ status: string; original_key: string }>();
  if (existing?.status === 'ready') return reply(200, { id, duplicate: true });

  // A row without its object is an earlier upload that was cut off: keep the row, put the object again.
  const key = existing?.original_key ?? `originals/${roll}/${id}.jpg`;
  if (!existing) {
    await env.DB.prepare('INSERT INTO photos (id, sha256, roll, original_key, filename, alt, caption, featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(id, sha, roll, key, filename, alt, caption, featured)
      .run();
  }
  await env.ORIGINALS.put(key, body, { httpMetadata: { contentType: 'image/jpeg' } });
  return reply(202, { id });
}

async function patchPhoto(request: Request, env: Env, id: string) {
  const body = await readJson(request);
  onlyKeys(body, ['caption', 'alt', 'featured', 'hidden']);
  const changes = Object.entries({
    caption: optionalText(body, 'caption', CAPTION_MAX, true),
    alt: optionalText(body, 'alt', ALT_MAX, true),
    featured: optionalBool(body, 'featured'),
    hidden: optionalBool(body, 'hidden'),
  }).filter(([, v]) => v !== undefined);
  if (!changes.length) throw new HttpError(400, 'send at least one of caption, alt, featured, hidden');

  const row = await env.DB.prepare(`UPDATE photos SET ${changes.map(([k]) => `${k} = ?`).join(', ')} WHERE id = ? RETURNING id, caption, alt, featured, hidden`)
    .bind(...changes.map(([, v]) => v), id)
    .first();
  if (!row) throw new HttpError(404, 'no such photo');
  return reply(200, row);
}

async function reingestPhoto(env: Env, id: string) {
  const row = await env.DB.prepare('SELECT original_key FROM photos WHERE id = ?').bind(id).first<{ original_key: string }>();
  if (!row) throw new HttpError(404, 'no such photo');
  await env.ROLLS_INGEST.send({ key: row.original_key, reingest: true } satisfies IngestMessage);
  return reply(202, { id });
}

type Route = { pattern: RegExp; method: string; run: (request: Request, env: Env, url: URL, match: RegExpExecArray) => Promise<Response> };

const routes: Route[] = [
  { pattern: /^\/api\/rolls\/list$/, method: 'GET', run: (_, env) => listRolls(env) },
  { pattern: /^\/api\/rolls\/rolls\/([^/]+)$/, method: 'PUT', run: (req, env, _, m) => putRoll(req, env, m[1]) },
  { pattern: /^\/api\/rolls\/upload$/, method: 'PUT', run: (req, env, url) => uploadPhoto(req, env, url) },
  { pattern: /^\/api\/rolls\/photos\/([^/]+)$/, method: 'PATCH', run: (req, env, _, m) => patchPhoto(req, env, m[1]) },
  { pattern: /^\/api\/rolls\/photos\/([^/]+)\/reingest$/, method: 'POST', run: (_, env, __, m) => reingestPhoto(env, m[1]) },
];

export async function handleRollsApi(request: Request, env: Env): Promise<Response> {
  if (!(await authorized(request, env.ROLLS_UPLOAD_TOKEN))) return reply(401, { error: 'unauthorized' });

  const url = new URL(request.url);
  const matching = routes.map((route) => ({ route, match: route.pattern.exec(url.pathname) })).filter((r) => r.match);
  if (!matching.length) return reply(404, { error: 'not found' });
  const hit = matching.find((r) => r.route.method === request.method);
  if (!hit) return new Response(null, { status: 405, headers: { Allow: matching.map((r) => r.route.method).join(', ') } });

  const photoId = /\/photos\/([^/]+)/.exec(url.pathname)?.[1];
  if (photoId !== undefined && !PHOTO_ID.test(photoId)) return reply(404, { error: 'no such photo' });

  try {
    return await hit.route.run(request, env, url, hit.match!);
  } catch (error) {
    if (error instanceof HttpError) return reply(error.status, { error: error.message });
    throw error;
  }
}
