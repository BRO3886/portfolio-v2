import exifr from 'exifr';

export type IngestMessage = { key: string };

// Bump when parsing or normalising changes, so each row records which version read it.
const INGEST_VERSION = 1;
const SIZES = [640, 1280, 3072] as const;
const EXIF_HEAD_BYTES = 128 * 1024;
const DEFAULT_OFFSET = '+05:30';
// Matches max_retries in wrangler.toml: the first delivery plus three retries.
const LAST_ATTEMPT = 4;

const WHITELIST = [
  'Make', 'Model', 'LensMake', 'LensModel', 'FocalLength', 'FocalLengthIn35mmFormat', 'FNumber', 'ExposureTime',
  'ISO', 'ExposureCompensation', 'DateTimeOriginal', 'OffsetTimeOriginal', 'ExifImageWidth', 'ExifImageHeight', 'Orientation',
] as const;

type Exif = Partial<Record<(typeof WHITELIST)[number], string | number>>;
type Roll = { camera: string | null; film: string | null; date: string | null; ignore_exif: number };
type PhotoRow = { id: string; status: string; uploaded_at: string };

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const text = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);

async function readExif(head: ArrayBuffer): Promise<Exif> {
  // reviveValues: false keeps DateTimeOriginal as the camera wrote it: local time with no zone.
  const parsed = await exifr.parse(head, { pick: [...WHITELIST], reviveValues: false, translateValues: false, gps: false });
  return (parsed ?? {}) as Exif;
}

function toLocal(utc: string, offset = DEFAULT_OFFSET) {
  const sign = offset.startsWith('-') ? -1 : 1;
  const [h, m] = offset.slice(1).split(':').map(Number);
  const shifted = new Date(Date.parse(utc) + sign * (h * 60 + m) * 60_000);
  return shifted.toISOString().slice(0, 19);
}

function takenDate(exif: Exif, roll: Roll, uploadedAt: string) {
  const original = roll.ignore_exif ? null : text(exif.DateTimeOriginal);
  const match = original && /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/.exec(original);
  if (match) {
    const [, y, mo, d, h, mi, s] = match;
    const offset = /^[+-]\d{2}:\d{2}$/.test(String(exif.OffsetTimeOriginal ?? '')) ? String(exif.OffsetTimeOriginal) : DEFAULT_OFFSET;
    return { taken_at: `${y}-${mo}-${d}T${h}:${mi}:${s}${offset}`, taken_month: `${y}-${mo}`, date_source: 'exif', date_precision: 'time' };
  }
  if (roll.date) {
    const day = roll.date.length === 7 ? `${roll.date}-01` : roll.date;
    return { taken_at: `${day}T00:00:00${DEFAULT_OFFSET}`, taken_month: day.slice(0, 7), date_source: 'roll', date_precision: roll.date.length === 7 ? 'month' : 'day' };
  }
  // Upload time is when the file arrived, not when it was shot, so only its day is kept.
  const day = toLocal(uploadedAt).slice(0, 10);
  return { taken_at: `${day}T00:00:00${DEFAULT_OFFSET}`, taken_month: day.slice(0, 7), date_source: 'upload', date_precision: 'day' };
}

function exposure(exif: Exif, roll: Roll) {
  if (roll.ignore_exif) {
    return { camera_raw: null, lens: null, focal_mm: null, focal_35mm: null, aperture: null, shutter_s: null, iso: null, exposure_ev: null };
  }
  const make = text(exif.Make);
  const model = text(exif.Model);
  return {
    camera_raw: make && model ? `${make}|${model}` : null,
    lens: text(exif.LensModel) ?? text(exif.LensMake),
    focal_mm: num(exif.FocalLength),
    focal_35mm: num(exif.FocalLengthIn35mmFormat),
    aperture: num(exif.FNumber),
    shutter_s: num(exif.ExposureTime),
    iso: num(exif.ISO),
    exposure_ev: num(exif.ExposureCompensation),
  };
}

const bytesStream = (buf: ArrayBuffer) => new Blob([buf]).stream();

async function webp(env: Env, original: ArrayBuffer, width: number, quality: number) {
  const result = await env.IMAGES.input(bytesStream(original)).transform({ width, fit: 'scale-down' }).output({ format: 'image/webp', quality });
  return new Response(result.image()).arrayBuffer();
}

function base64(buf: ArrayBuffer) {
  let s = '';
  for (const b of new Uint8Array(buf)) s += String.fromCharCode(b);
  return btoa(s);
}

const statusOf = (env: Env, key: string) => env.DB.prepare('SELECT status FROM photos WHERE original_key = ?').bind(key).first<string>('status');

async function ingest(env: Env, key: string) {
  const row = await env.DB.prepare('SELECT id, status, uploaded_at FROM photos WHERE original_key = ?').bind(key).first<PhotoRow>();
  if (!row) throw new Error(`no photo row for ${key}`);
  if (row.status === 'ready') return;

  const object = await env.ORIGINALS.get(key);
  if (!object) {
    // Queues deliver at least once: a duplicate may have finished first and deleted the original.
    if ((await statusOf(env, key)) === 'ready') return;
    throw new Error(`original ${key} is missing`);
  }
  const original = await object.arrayBuffer();

  const roll = await env.DB.prepare('SELECT r.camera, r.film, r.date, r.ignore_exif FROM rolls r JOIN photos p ON p.roll = r.slug WHERE p.id = ?')
    .bind(row.id)
    .first<Roll>();
  if (!roll) throw new Error(`photo ${row.id} has no roll`);

  const exif = await readExif(original.slice(0, EXIF_HEAD_BYTES));
  const info = await env.IMAGES.info(bytesStream(original));
  if (!('width' in info)) throw new Error(`original ${key} has no pixel size`);
  // info() reports the stored pixels; orientations 5 to 8 are displayed rotated a quarter turn.
  const rotated = Number(exif.Orientation) >= 5;
  const [width, height] = rotated ? [info.height, info.width] : [info.width, info.height];

  const placeholder = `data:image/webp;base64,${base64(await webp(env, original, 24, 40))}`;
  for (const size of SIZES) {
    await env.PUBLIC_IMAGES.put(`p/${row.id}-${size}.webp`, await webp(env, original, size, 80), {
      httpMetadata: { contentType: 'image/webp', cacheControl: 'public, max-age=31536000, immutable' },
    });
  }

  const columns = {
    width,
    height,
    placeholder,
    ...takenDate(exif, roll, row.uploaded_at),
    ...exposure(exif, roll),
    film: null,
    exif_json: JSON.stringify(exif),
    ingest_version: INGEST_VERSION,
  };
  const names = Object.keys(columns);
  await env.DB.prepare(
    `UPDATE photos SET ${names.map((n) => `${n} = ?`).join(', ')}, status = 'ready', error = NULL,
       ingested_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') WHERE id = ?`,
  )
    .bind(...Object.values(columns), row.id)
    .run();

  // The original lives in Google Photos; the derivatives are all the site needs.
  await env.ORIGINALS.delete(key);

  if (columns.camera_raw && !(await env.DB.prepare('SELECT 1 FROM cameras WHERE raw = ?').bind(columns.camera_raw).first())) {
    console.log(JSON.stringify({ event: 'rolls.unknown_camera', camera_raw: columns.camera_raw, photo: row.id }));
  }
}

function keyOf(body: unknown): IngestMessage | null {
  if (typeof body !== 'object' || body === null || !('key' in body) || typeof body.key !== 'string') return null;
  return { key: body.key };
}

export async function handleIngestBatch(batch: MessageBatch, env: Env) {
  for (const message of batch.messages) {
    const parsed = keyOf(message.body);
    if (!parsed || !parsed.key.startsWith('originals/')) {
      message.ack();
      continue;
    }
    try {
      await ingest(env, parsed.key);
      message.ack();
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      const last = message.attempts >= LAST_ATTEMPT;
      console.error(JSON.stringify({ event: 'rolls.ingest_failed', key: parsed.key, attempt: message.attempts, last, error: reason }));
      await env.DB.prepare(`UPDATE photos SET error = ?${last ? ", status = 'failed'" : ''} WHERE original_key = ?`)
        .bind(reason.slice(0, 1000), parsed.key)
        .run();
      // After the last attempt, retry() hands the message to the dead-letter queue.
      message.retry({ delaySeconds: 30 * 2 ** (message.attempts - 1) });
    }
  }
}
