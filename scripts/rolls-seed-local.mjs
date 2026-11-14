// Loads the /rolls prototype's 25-year fixture into the local D1 database and lays out its
// images under production-style keys (p/<id>-<w>.webp) outside public/, so nothing here ships.
//
//   node scripts/rolls-seed-local.mjs [--proto <checkout>] [--out <dir>] [--serve [port]]
//
// --proto  a checkout of proto/rolls-page with its fixture images built
//          (node src/proto/rolls/fixtures/build-data.mjs, then extras.mjs, from that checkout).
//          Defaults to the worktree that has the branch checked out.
// --out    where the images and the generated SQL go. Defaults to .wrangler/rolls-img.
// --serve  after seeding, serve --out on http://localhost:<port> (default 4322). Point
//          ROLLS_IMG_BASE at it in .dev.vars.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createReadStream, existsSync, linkSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import path from 'node:path';

const repo = path.resolve(import.meta.dirname, '..');
const require = createRequire(path.join(repo, 'package.json'));
const sharp = require('sharp');

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const value = (name) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : undefined;
};

function protoCheckout() {
  const given = value('--proto');
  if (given) return path.resolve(given);
  const list = execFileSync('git', ['worktree', 'list', '--porcelain'], { cwd: repo, encoding: 'utf8' });
  const block = list.split('\n\n').find((b) => b.includes('branch refs/heads/proto/rolls-page'));
  if (!block) throw new Error('No checkout of proto/rolls-page found; pass --proto <path>.');
  return block.split('\n')[0].replace(/^worktree /, '');
}

const proto = protoCheckout();
const out = path.resolve(value('--out') ?? path.join(repo, '.wrangler/rolls-img'));
const publicDir = path.join(repo, 'public');
if (out === publicDir || out.startsWith(publicDir + path.sep)) throw new Error('--out must not be inside public/: deploy ships everything in it.');

const base = JSON.parse(readFileSync(path.join(proto, 'src/proto/rolls/photos.json'), 'utf8'));
const extras = JSON.parse(readFileSync(path.join(proto, 'src/proto/rolls/extras.json'), 'utf8'));
const sourceImage = (srcId, w) => path.join(proto, 'public/proto-rolls', `${srcId}-${w}.webp`);
for (const s of [...base, ...extras]) {
  if (!existsSync(sourceImage(s.id, 1920))) throw new Error(`Missing ${sourceImage(s.id, 1920)}: build the prototype's fixture images first.`);
}

// Ported from the prototype's fixture generator (src/proto/rolls/archive.ts) without behaviour changes.
// Every call to r() must stay in the same order as the prototype, or the planted edge cases move.

const pad = (n) => String(n).padStart(2, '0');

function mulberry(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PLACES = [
  'Lisbon in the rain', 'Kyoto', 'Hampi', 'Isle of Skye', 'Ladakh', 'Copenhagen by bike', 'Oaxaca', 'Tbilisi', 'Lofoten',
  'Seoul', 'Istanbul', 'Marrakech', 'Hokkaido in snow', 'Kerala backwaters', 'Porto', 'Reykjavík', 'Valparaíso', 'Hanoi',
  'Dolomites', 'Edinburgh', 'Jaisalmer', 'Patagonia', 'Vienna', 'Galle', 'Paro and Thimphu', 'Naples', 'Mexico City',
  'Taipei', 'Berlin', 'Cappadocia', 'Bangalore weekends', 'Goa off-season', 'Varanasi', 'Prague', 'Cornwall coast',
  'Montréal', 'Kathmandu', 'Singapore', 'Melbourne', 'Queenstown',
];
const SWISS = ['Bern', 'Basel', 'Lucerne', 'Zermatt', 'Lauterbrunnen', 'Interlaken', 'Lausanne', 'Geneva', 'Montreux'];

const slugify = (s) => s.normalize('NFKD').replace(/[^\w\s-]/g, '').trim().toLowerCase().replace(/\s+/g, '-');
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

function procedural(year, n, total, r, months = range(1, 12)) {
  const used = new Set();
  const weights = Array.from({ length: n }, () => 0.3 + r() * 1.4);
  const sum = weights.reduce((a, b) => a + b, 0);
  return weights.map((w) => {
    let place = PLACES[Math.floor(r() * PLACES.length)];
    while (used.has(place)) place = PLACES[Math.floor(r() * PLACES.length)];
    used.add(place);
    const month = months[Math.floor(r() * months.length)];
    const count = Math.max(3, Math.round((total * w) / sum));
    return {
      slug: slugify(place),
      title: place,
      start: `${year}-${pad(month)}-${pad(1 + Math.floor(r() * 22))}`,
      days: 1 + Math.floor(r() * 6),
      count,
      featured: Math.round(count / 70) + (r() < 0.6 ? 1 : 0),
    };
  });
}

const GAPS = new Set([2034, 2035, 2042]);

const SPECIAL = {
  2025: (r) => procedural(2025, 4, 110, r),
  2027: (r) => [
    ...procedural(2027, 8, 420, r),
    { slug: 'pentax', title: 'Dad’s Pentax, scanned', start: '2027-06-10', days: 1, count: 24, exif: 'none', camera: 'Pentax K1000', undated: true, featured: 1 },
    { slug: 'negatives', title: 'Found negatives', start: '2027-11-02', days: 1, count: 3, exif: 'none', undated: true },
  ],
  2029: () => [{ slug: 'shillong', title: 'One frame from Shillong', start: '2029-05-14', days: 1, count: 1 }],
  2030: (r) => [...procedural(2030, 9, 520, r, range(1, 11)), { slug: 'lapland', title: 'Lapland over New Year', start: '2030-12-28', days: 7, count: 64, featured: 2 }],
  2032: (r) => [...procedural(2032, 10, 560, r), { slug: 'helios', title: 'An old Helios lens', start: '2032-09-05', days: 3, count: 30, exif: 'manual' }],
  2033: (r) => procedural(2033, 7, 380, r).map((p) => ({ ...p, featured: 0 })),
  2036: (r) => procedural(2036, 3, 210, r, [7]),
  2038: (r) => [
    ...procedural(2038, 12, 900, r, [1, 2, 4, 5, 6, 10, 11, 12]),
    { slug: 'trans-siberian', title: 'Trans-Siberian, Moscow to Vladivostok', start: '2038-08-03', days: 21, count: 1100, featured: 3 },
    { slug: 'w-trek', title: 'The W trek, Torres del Paine', start: '2038-03-09', days: 6, count: 160, featured: 1 },
    ...SWISS.map((t, i) => ({ slug: slugify(t), title: t, start: `2038-09-${pad(4 + i * 2)}`, days: 2, count: 8 + Math.floor(r() * 12) })),
  ],
  2040: (r) => procedural(2040, 10, 600, r).map((p) => ({ ...p, featured: 3 })),
  2044: (r) => [
    ...procedural(2044, 8, 450, r),
    { slug: 'konkan', title: 'Three slow weeks along the Konkan coast, from Ratnagiri down to Gokarna and back again', start: '2044-02-02', days: 20, count: 90, featured: 1 },
  ],
  2046: (r) => [...procedural(2046, 8, 470, r), { slug: 'ladakh-panoramas', title: 'Ladakh, mostly panoramas', start: '2046-07-11', days: 9, count: 26, frames: 'pano', featured: 1 }],
  2049: (r) => procedural(2049, 4, 140, r, [1, 2, 3]),
};

const pano = extras.filter((e) => e.width / e.height > 2);
const square = extras.find((e) => e.width === e.height);

function pick(plan, r, i) {
  if (plan.frames === 'pano') return i % 4 === 3 ? base[Math.floor(r() * base.length)] : pano[i % pano.length];
  if (plan.exif === 'none') return base[Math.floor(r() * base.length)];
  const x = r();
  if (x < 0.012) return pano[Math.floor(r() * pano.length)];
  if (x < 0.035) return square;
  return base[Math.floor(r() * base.length)];
}

function addDays(start, d) {
  const t = new Date(start + 'T00:00:00Z');
  t.setUTCDate(t.getUTCDate() + d);
  return t.toISOString().slice(0, 10);
}

function frames(plan, planYear, r) {
  const featured = new Set();
  while (featured.size < Math.min(plan.featured ?? 0, plan.count)) featured.add(Math.floor(r() * plan.count));
  const stamps = Array.from({ length: plan.count }, () => [Math.floor(r() * plan.days), 7 * 3600 + Math.floor(r() * 14 * 3600)]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  return stamps.map(([d, s], i) => ({
    key: `${planYear}-${plan.slug}-${i + 1}`,
    frame: i + 1,
    src: pick(plan, r, i),
    plan,
    roll: `${planYear}-${plan.slug}`,
    featured: featured.has(i),
    date: plan.undated ? plan.start : addDays(plan.start, d),
    time: plan.undated ? null : `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`,
    exif: plan.exif ?? 'full',
  }));
}

function fixture(years) {
  return years.flatMap((y) => {
    if (GAPS.has(y)) return [];
    const r = mulberry(y * 7919);
    const plans = SPECIAL[y]?.(r) ?? procedural(y, 6 + Math.floor(r() * 7), 300 + Math.floor(r() * 400), r);
    return plans.flatMap((p) => frames(p, y, r));
  });
}

// Film rolls carry their camera, stock and date at roll level. "Found negatives" only knows its month.
const ROLL_OVERRIDES = {
  '2027-pentax': { camera: 'Pentax K1000', film: 'Kodak Gold 200', date: '2027-06-10', ignore_exif: 1 },
  '2027-negatives': { camera: null, film: null, date: '2027-11', ignore_exif: 1 },
};

// Most raw pairs have a display name; X100V and iPhone 14 Pro are left out so the title-case fallback is exercised.
const CAMERAS = [
  ['FUJIFILM|X-T5', 'Fujifilm X-T5'],
  ['FUJIFILM|X-T4', 'Fujifilm X-T4'],
  ['FUJIFILM|X100VI', 'Fujifilm X100VI'],
  ['Apple|iPhone 15 Pro', 'iPhone 15 Pro'],
  ['Apple|iPhone 16 Pro', 'iPhone 16 Pro'],
  ['Apple|iPhone 17 Pro', 'iPhone 17 Pro'],
];

const LONG_CAPTION =
  'We waited forty-odd minutes for the fog to lift off the ridge, and when it finally went it went all at once, ' +
  'like someone pulling a sheet off furniture. Everyone on the platform stopped talking. ' +
  'I took three frames, and this is the only one where the light reaches the far valley.';
const INTL_CAPTION = 'Chai at Irkutsk station ☕️ — “पहली किरण, पहली चाय” 🚂';
const SHORT_CAPTIONS = ['The one morning it didn’t rain', 'Last light', 'Worth the climb', 'Nobody else on the street', 'Twelve hours on this bench', 'Snow until April'];
if ([...LONG_CAPTION].length !== 280) throw new Error(`LONG_CAPTION is ${[...LONG_CAPTION].length} characters, not 280`);

const hex = (s) => createHash('sha256').update(s).digest('hex');
const q = (v) => (v == null ? 'NULL' : typeof v === 'number' ? String(v) : `'${String(v).replaceAll("'", "''")}'`);

function plantedCaption(f, i, longKey) {
  if (f.key === longKey) return LONG_CAPTION;
  if (f.key === '2038-trans-siberian-1') return INTL_CAPTION;
  if (f.key === '2046-ladakh-panoramas-1') return 'The whole valley in one breath';
  if (f.key === '2027-pentax-1') return 'Dad’s first roll after he bought it in 1981';
  return i % 523 === 7 ? SHORT_CAPTIONS[Math.floor(i / 523) % SHORT_CAPTIONS.length] : null;
}

// One placeholder per row, as ingest would produce: a slightly different crop and tone of the shared source,
// so the HTML budget is measured with unique, incompressible-across-rows placeholders.
const thumbs = new Map();
async function placeholder(src, seed) {
  if (!thumbs.has(src.id)) thumbs.set(src.id, await sharp(sourceImage(src.id, 640)).resize({ width: 160 }).toBuffer());
  const r = mulberry(seed);
  const buf = thumbs.get(src.id);
  const meta = await sharp(buf).metadata();
  const scale = 0.8 + r() * 0.2;
  const width = Math.max(8, Math.round(meta.width * scale));
  const height = Math.max(8, Math.round(meta.height * scale));
  const left = Math.floor(r() * (meta.width - width + 1));
  const top = Math.floor(r() * (meta.height - height + 1));
  const webp = await sharp(buf)
    .extract({ left, top, width, height })
    .modulate({ brightness: 0.85 + r() * 0.3, saturation: 0.8 + r() * 0.4, hue: Math.floor(r() * 30) - 15 })
    .resize({ width: 24, height: Math.max(1, Math.round((24 * src.height) / src.width)), fit: 'fill' })
    .webp({ quality: 40 })
    .toBuffer();
  return 'data:image/webp;base64,' + webp.toString('base64');
}

const model = (s) => (s.make === 'FUJIFILM' ? s.camera.replace(/^Fujifilm /, '') : s.camera);

async function photoRow(f, i, longKey) {
  const s = f.src;
  const roll = ROLL_OVERRIDES[f.roll];
  const none = f.exif === 'none';
  const manual = f.exif === 'manual';
  const id = hex(f.key).slice(0, 16);
  const monthPrecise = roll?.date?.length === 7;
  const takenDate = monthPrecise ? `${roll.date}-01` : f.date;
  return {
    id,
    sha256: hex(f.key),
    roll: f.roll,
    original_key: `originals/${f.roll}/${id}.jpg`,
    filename: none ? `scan-${pad(f.frame)}.jpg` : `DSCF${String(1000 + f.frame).padStart(4, '0')}.JPG`,
    caption: plantedCaption(f, i, longKey),
    // A handful without alt text: they're shown anyway, so pages must cope.
    alt: i % 811 === 400 ? null : s.alt,
    featured: f.featured ? 1 : 0,
    hidden: 0,
    status: 'ready',
    width: s.width,
    height: s.height,
    placeholder: await placeholder(s, i + 1),
    taken_at: `${takenDate}T${f.time ?? '00:00:00'}+05:30`,
    taken_month: takenDate.slice(0, 7),
    date_source: f.time ? 'exif' : 'roll',
    date_precision: f.time ? 'time' : monthPrecise ? 'month' : 'day',
    camera_raw: none ? null : `${s.make}|${model(s)}`,
    lens: null,
    focal_mm: none || manual ? null : s.focalMm,
    focal_35mm: none || manual ? null : s.focal35,
    aperture: none || manual ? null : s.aperture,
    shutter_s: none ? null : s.shutterS,
    iso: none ? null : s.iso,
    exposure_ev: none ? null : s.exposureEv,
    film: null,
    exif_json: null,
    ingest_version: 1,
    ingested_at: '2026-11-13T00:00:00Z',
    source: s.id,
  };
}

function insert(table, rows) {
  const cols = Object.keys(rows[0]);
  const lines = [];
  for (let i = 0; i < rows.length; i += 50) {
    const chunk = rows.slice(i, i + 50).map((r) => `(${cols.map((c) => q(r[c])).join(', ')})`);
    lines.push(`INSERT INTO ${table} (${cols.join(', ')}) VALUES\n${chunk.join(',\n')};`);
  }
  return lines.join('\n');
}

const all = fixture(range(2025, 2049));
const longKey = all.find((f) => f.roll.startsWith('2049-') && f.featured)?.key;
const photos = [];
for (const [i, f] of all.entries()) photos.push(await photoRow(f, i, longKey));

const rollRows = [...new Map(all.map((f) => [f.roll, f])).values()].map((f) => ({
  slug: f.roll,
  title: f.plan.title,
  camera: null,
  film: null,
  date: null,
  ignore_exif: 0,
  ...ROLL_OVERRIDES[f.roll],
}));

// Two rows that must never reach a page: an interrupted upload and a failed ingest.
const anyRoll = photos[0].roll;
const invisible = [
  { id: hex('pending').slice(0, 16), sha256: hex('pending'), roll: anyRoll, original_key: `originals/${anyRoll}/pending.jpg`, status: 'pending', error: null },
  { id: hex('failed').slice(0, 16), sha256: hex('failed'), roll: anyRoll, original_key: `originals/${anyRoll}/failed.jpg`, status: 'failed', error: 'planted: ingest failed' },
];

const sources = new Map(photos.map((p) => [p.id, p.source]));
for (const p of photos) delete p.source;

mkdirSync(path.join(out, 'p'), { recursive: true });
const sql = [
  'DELETE FROM photos;',
  'DELETE FROM rolls;',
  'DELETE FROM cameras;',
  insert('cameras', CAMERAS.map(([raw, display]) => ({ raw, display }))),
  insert('rolls', rollRows),
  insert('photos', photos),
  insert('photos', invisible),
].join('\n');
const sqlFile = path.join(out, 'seed.sql');
writeFileSync(sqlFile, sql);

// Derivatives are hard links to the prototype's sizes; 2048 falls back to its 1920px file.
const SIZES = { 640: 640, 1280: 1280, 2048: 1920 };
for (const [id, src] of sources) {
  for (const [w, from] of Object.entries(SIZES)) {
    const dest = path.join(out, 'p', `${id}-${w}.webp`);
    if (existsSync(dest)) rmSync(dest);
    linkSync(sourceImage(src, from), dest);
  }
}

const wrangler = (...a) => execFileSync('npx', ['wrangler', ...a], { cwd: repo, stdio: ['ignore', 'pipe', 'inherit'], encoding: 'utf8' });
wrangler('d1', 'migrations', 'apply', 'rolls', '--local');
wrangler('d1', 'execute', 'rolls', '--local', '--file', sqlFile);

const years = new Set(photos.map((p) => p.taken_month.slice(0, 4)));
const avg = Math.round(photos.reduce((n, p) => n + p.placeholder.length, 0) / photos.length);
console.log(`seeded ${photos.length} ready photos (+${invisible.length} not ready) in ${rollRows.length} rolls across ${years.size} years`);
console.log(`placeholders: ${new Set(photos.map((p) => p.placeholder)).size} unique, ${avg} bytes on average`);
console.log(`images: ${sources.size * 3} files under ${path.join(out, 'p')}`);

if (flag('--serve')) {
  const port = Number(value('--serve') ?? 4322);
  createServer((req, res) => {
    const file = path.join(out, path.normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)));
    if (!file.startsWith(path.join(out, 'p') + path.sep) || !existsSync(file)) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, {
      'Content-Type': 'image/webp',
      'Content-Length': statSync(file).size,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Access-Control-Allow-Origin': '*',
    });
    createReadStream(file).pipe(res);
  }).listen(port, () => console.log(`serving ${out} on http://localhost:${port} (set ROLLS_IMG_BASE=http://localhost:${port} in .dev.vars)`));
}
