// D1 reads for the /rolls pages. Each page sends its statements as one db.batch(): one round trip.
// Every WHERE repeats `status = 'ready' AND hidden = 0` word for word, or SQLite won't use the partial index.

// The slice of D1Database these reads use. The Astro side of the repo compiles against the DOM lib, which has no
// Workers types, and the real binding satisfies this shape.
type Statement = { bind(...values: unknown[]): Statement };
export type RollsDb = { prepare(sql: string): Statement; batch(statements: Statement[]): Promise<{ results: unknown[] }[]> };

export type PhotoRow = {
  id: string;
  roll: string;
  roll_title: string;
  filename: string | null;
  caption: string | null;
  alt: string | null;
  featured: number;
  width: number;
  height: number;
  placeholder: string;
  taken_at: string;
  taken_month: string;
  date_precision: 'time' | 'day' | 'month';
  camera_raw: string | null;
  camera_display: string | null;
  roll_camera: string | null;
  ignore_exif: number;
  lens: string | null;
  focal_mm: number | null;
  focal_35mm: number | null;
  aperture: number | null;
  shutter_s: number | null;
  iso: number | null;
  exposure_ev: number | null;
  film: string | null;
};

// One row per month with photos, newest first: the year bar, the month rail and every neighbour link come from it.
export type MonthRow = { taken_month: string; n: number; first: string; last: string };

const PHOTO_COLUMNS = `p.id, p.roll, r.title AS roll_title, p.filename, p.caption, p.alt, p.featured, p.width, p.height, p.placeholder,
  p.taken_at, p.taken_month, p.date_precision, p.camera_raw, c.display AS camera_display, r.camera AS roll_camera,
  r.ignore_exif, p.lens, p.focal_mm, p.focal_35mm, p.aperture, p.shutter_s, p.iso, p.exposure_ev,
  coalesce(r.film, p.film) AS film`;
const PHOTO_FROM = 'photos p JOIN rolls r ON r.slug = p.roll LEFT JOIN cameras c ON c.raw = p.camera_raw';

export const MONTHS_SQL = `SELECT taken_month, COUNT(*) AS n, min(taken_at) AS first, max(taken_at) AS last
FROM photos WHERE status = 'ready' AND hidden = 0 GROUP BY taken_month ORDER BY taken_month DESC`;

// ?1 is a year ('2031'), or NULL for the newest year with photos (the /rolls landing page).
const YEAR_BOUND = `coalesce(?1, (SELECT substr(max(taken_month), 1, 4) FROM photos WHERE status = 'ready' AND hidden = 0))`;

export const YEAR_SQL = `SELECT ${PHOTO_COLUMNS} FROM ${PHOTO_FROM}
WHERE p.status = 'ready' AND p.hidden = 0 AND p.taken_month BETWEEN ${YEAR_BOUND} || '-01' AND ${YEAR_BOUND} || '-12'
ORDER BY p.taken_month, p.taken_at, p.filename`;

export const MONTH_SQL = `SELECT ${PHOTO_COLUMNS} FROM ${PHOTO_FROM}
WHERE p.status = 'ready' AND p.hidden = 0 AND p.taken_month = ?1
ORDER BY p.taken_month, p.taken_at, p.filename`;

// The cover for "Continue to": the newest featured frame that isn't a panorama, else the first non-panorama, else the first.
const COVER_ORDER = `ORDER BY (p.featured = 1 AND p.width < 2.2 * p.height) DESC,
  CASE WHEN p.featured = 1 AND p.width < 2.2 * p.height THEN p.taken_at END DESC,
  (p.width < 2.2 * p.height) DESC, p.taken_month, p.taken_at, p.filename LIMIT 1`;

const OLDER_YEAR = `(SELECT substr(max(taken_month), 1, 4) FROM photos WHERE status = 'ready' AND hidden = 0 AND taken_month < ${YEAR_BOUND} || '-01')`;

export const OLDER_YEAR_COVER_SQL = `SELECT ${PHOTO_COLUMNS} FROM ${PHOTO_FROM}
WHERE p.status = 'ready' AND p.hidden = 0 AND p.taken_month BETWEEN ${OLDER_YEAR} || '-01' AND ${OLDER_YEAR} || '-12'
${COVER_ORDER}`;

export const EARLIER_MONTH_COVER_SQL = `SELECT ${PHOTO_COLUMNS} FROM ${PHOTO_FROM}
WHERE p.status = 'ready' AND p.hidden = 0
  AND p.taken_month = (SELECT max(taken_month) FROM photos WHERE status = 'ready' AND hidden = 0 AND taken_month < ?1)
${COVER_ORDER}`;

export type PageData = { months: MonthRow[]; photos: PhotoRow[]; cover: PhotoRow | null };

async function load(db: RollsDb, photos: Statement, cover: Statement): Promise<PageData> {
  const [months, list, covers] = await db.batch([db.prepare(MONTHS_SQL), photos, cover]);
  return {
    months: months.results as MonthRow[],
    photos: list.results as PhotoRow[],
    cover: (covers.results[0] as PhotoRow | undefined) ?? null,
  };
}

// year: '2031', or null for the newest year.
export function loadYear(db: RollsDb, year: string | null) {
  return load(db, db.prepare(YEAR_SQL).bind(year), db.prepare(OLDER_YEAR_COVER_SQL).bind(year));
}

// month: '2038-08'.
export function loadMonth(db: RollsDb, month: string) {
  return load(db, db.prepare(MONTH_SQL).bind(month), db.prepare(EARLIER_MONTH_COVER_SQL).bind(month));
}
