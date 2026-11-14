// Uploads and edits /rolls photos through the token-protected API, the same routes the iPhone Shortcut uses.
//
//   node scripts/rolls.mjs upload <folder>
//   node scripts/rolls.mjs edit <file or id> [--caption "…"] [--alt "…"] [--feature|--unfeature] [--hide|--show]
//   node scripts/rolls.mjs reingest <id>
//
// ROLLS_UPLOAD_TOKEN is required. ROLLS_API overrides the origin (default https://sidv.dev), e.g.
// http://localhost:8787 for wrangler dev. `--caption ""` clears a caption.
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const API = (process.env.ROLLS_API ?? 'https://sidv.dev').replace(/\/$/, '');
const TOKEN = process.env.ROLLS_UPLOAD_TOKEN;
const PARALLEL = 4;

function fail(message) {
  console.error(message);
  process.exit(1);
}

async function call(method, route, { body, headers = {} } = {}) {
  const res = await fetch(`${API}/api/rolls${route}`, { method, body, headers: { Authorization: `Bearer ${TOKEN}`, ...headers } });
  const text = await res.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = { error: `${res.statusText} (not a JSON response; check ROLLS_API)` };
  }
  return { status: res.status, ok: res.ok, body: parsed };
}

const sendJson = (body) => ({ body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } });

async function upload(folder) {
  const rollFile = path.join(folder, 'roll.json');
  let roll;
  try {
    roll = JSON.parse(await readFile(rollFile, 'utf8'));
  } catch (error) {
    fail(`Can't read ${rollFile}: ${error.message}`);
  }
  if (!roll.title) fail(`${rollFile} needs a "title".`);
  const slug = roll.slug ?? path.basename(path.resolve(folder));

  const rollBody = { title: roll.title };
  for (const key of ['camera', 'film', 'date', 'ignoreExif']) if (key in roll) rollBody[key] = roll[key];
  const created = await call('PUT', `/rolls/${encodeURIComponent(slug)}`, sendJson(rollBody));
  if (!created.ok) fail(`Roll ${slug}: ${created.status} ${created.body.error}`);
  console.log(`roll ${slug}: ${created.status === 201 ? 'created' : 'updated'}`);

  const files = (await readdir(folder)).filter((f) => /\.jpe?g$/i.test(f)).sort();
  if (!files.length) fail(`No JPEGs in ${folder}.`);
  const photos = roll.photos ?? {};
  const missingAlt = [];
  let failures = 0;

  const queue = [...files];
  async function worker() {
    for (let file = queue.shift(); file; file = queue.shift()) {
      const meta = photos[file] ?? {};
      if (!meta.alt) missingAlt.push(file);
      const headers = { 'Content-Type': 'image/jpeg', 'X-Filename': encodeURIComponent(file) };
      if (meta.alt) headers['X-Alt'] = encodeURIComponent(meta.alt);
      if (meta.caption) headers['X-Caption'] = encodeURIComponent(meta.caption);
      if (meta.featured) headers['X-Featured'] = '1';
      const res = await call('PUT', `/upload?roll=${encodeURIComponent(slug)}`, { body: await readFile(path.join(folder, file)), headers });
      if (res.status === 202) console.log(`${file}: uploaded as ${res.body.id}, processing`);
      else if (res.status === 200 && res.body.duplicate) console.log(`${file}: already uploaded as ${res.body.id} (use edit to change its caption or alt text)`);
      else {
        failures += 1;
        console.error(`${file}: ${res.status} ${res.body.error}`);
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(PARALLEL, files.length) }, worker));

  if (missingAlt.length) console.log(`\nNo alt text in roll.json for:\n${missingAlt.map((f) => `  ${f}`).join('\n')}`);
  if (failures) fail(`\n${failures} of ${files.length} uploads failed.`);
}

async function idFor(target) {
  if (/^[0-9a-f]{16}$/.test(target)) return target;
  const bytes = await readFile(target).catch(() => fail(`${target} is neither a photo id nor a readable file.`));
  return createHash('sha256').update(bytes).digest('hex').slice(0, 16);
}

function editFields(args) {
  const fields = {};
  for (let i = 0; i < args.length; i++) {
    const flag = args[i];
    if (flag === '--caption' || flag === '--alt') {
      const value = args[++i];
      if (value === undefined) fail(`${flag} needs a value.`);
      fields[flag.slice(2)] = value === '' ? null : value;
    } else if (flag === '--feature' || flag === '--unfeature') fields.featured = flag === '--feature';
    else if (flag === '--hide' || flag === '--show') fields.hidden = flag === '--hide';
    else fail(`Unknown option ${flag}.`);
  }
  if (!Object.keys(fields).length) fail('Nothing to change: pass --caption, --alt, --feature, --unfeature, --hide or --show.');
  return fields;
}

async function edit(target, args) {
  const id = await idFor(target);
  const res = await call('PATCH', `/photos/${id}`, sendJson(editFields(args)));
  if (!res.ok) fail(`${id}: ${res.status} ${res.body.error}`);
  console.log(res.body);
}

async function reingest(id) {
  const res = await call('POST', `/photos/${id}/reingest`);
  if (!res.ok) fail(`${id}: ${res.status} ${res.body.error}`);
  console.log(`${id}: queued for re-ingest`);
}

const [command, target, ...rest] = process.argv.slice(2);
if (!TOKEN) fail('Set ROLLS_UPLOAD_TOKEN.');
if (command === 'upload' && target) await upload(target);
else if (command === 'edit' && target) await edit(target, rest);
else if (command === 'reingest' && target) await reingest(target);
else fail('Usage: node scripts/rolls.mjs upload <folder> | edit <file or id> [options] | reingest <id>');
