// Grouping for the /rolls pages: rows from db.ts become months, rolls, days, Featured and the year budget.
import type { MonthRow, PhotoRow } from './db';
import { MONTHS, SHORT, aperture, cameraName, dayLabel, dayRange, ev, focal, plural, shutter } from './exif-format';

// A year page holds at most this many prints. Over budget, the biggest months collapse to a sample (largest first)
// and link to their own page, so one long trip can't bloat a year while ordinary years always show everything.
export const YEAR_BUDGET = 900;
export const PREVIEW = 36;
export const FEATURED_MAX = 6;
// A roll this long is split by day on the month page, so a three-week trip has landmarks.
export const DAY_SPLIT = 60;
export const SIZES = [640, 1280, 3072] as const;
const PANO = 2.2;

const pad = (n: number) => String(n).padStart(2, '0');

export function shape(row: PhotoRow, imgBase: string) {
  const [y, m] = row.taken_month.split('-').map(Number);
  const day = row.taken_at.slice(0, 10);
  const film = row.ignore_exif === 1;
  const make = row.camera_raw?.split('|')[0] ?? null;
  const exposure = film
    ? []
    : [
        row.iso != null ? `ISO ${row.iso}` : null,
        focal(make, row.focal_mm, row.focal_35mm),
        ev(row.exposure_ev),
        aperture(row.aperture),
        shutter(row.shutter_s),
      ].filter((x): x is string => x !== null);
  const camera = film ? row.roll_camera : (row.camera_display ?? (row.camera_raw ? cameraName(row.camera_raw) : null) ?? row.roll_camera);
  const url = (w: number) => `${imgBase}/p/${row.id}-${w}.webp`;
  const ratio = row.width / row.height;
  return {
    id: row.id,
    roll: row.roll,
    rollTitle: row.roll_title,
    caption: row.caption,
    alt: row.alt ?? '',
    featured: row.featured === 1,
    width: row.width,
    height: row.height,
    ratio,
    pano: ratio >= PANO,
    placeholder: row.placeholder,
    src: url,
    srcset: SIZES.map((w) => `${url(w)} ${w}w`).join(', '),
    camera,
    film: row.film,
    lens: film ? null : row.lens,
    exposure,
    precision: row.date_precision,
    // A month-precise frame (a film roll dated "2027-11") shows only the month: no invented day or time.
    date: row.date_precision === 'month' ? `${SHORT[m - 1]} ${y}` : `${Number(day.slice(8))} ${SHORT[m - 1]} ${y}`,
    time: row.date_precision === 'time' ? row.taken_at.slice(11, 16) : null,
    datetime: row.date_precision === 'time' ? row.taken_at : row.date_precision === 'day' ? day : row.taken_month,
    takenAt: row.taken_at,
    day,
    year: y,
    month: m,
  };
}

export type Photo = ReturnType<typeof shape>;

// The dated span of a set of photos, ignoring month-precise frames, which have no real day.
export function photoRange(photos: Photo[]) {
  const dated = photos.filter((p) => p.precision !== 'month');
  return dated.length ? dayRange(dated[0].day, dated.at(-1)!.day) : null;
}

export const withRange = (count: string, range: string | null) => (range ? `${count} · ${range}` : count);

function groupMonth(y: number, m: number, photos: Photo[], collapsed: boolean) {
  const rolls: { slug: string; title: string; photos: Photo[] }[] = [];
  for (const p of photos) {
    const roll = rolls.find((r) => r.slug === p.roll);
    if (roll) roll.photos.push(p);
    else rolls.push({ slug: p.roll, title: p.rollTitle, photos: [p] });
  }
  const ordered = rolls.flatMap((r) => r.photos);
  // An even sample across the month, so a long trip previews its whole route rather than its first afternoon.
  const preview = collapsed ? Array.from({ length: PREVIEW }, (_, i) => ordered[Math.floor((i * ordered.length) / PREVIEW)]) : ordered;
  return {
    year: y,
    month: m,
    mm: pad(m),
    key: `${y}-${pad(m)}`,
    name: MONTHS[m - 1],
    short: SHORT[m - 1],
    label: `${MONTHS[m - 1]} ${y}`,
    count: ordered.length,
    range: photoRange(ordered),
    rolls: rolls.map((r) => ({ ...r, count: r.photos.length, range: photoRange(r.photos) })),
    photos: ordered,
    preview,
    collapsed,
  };
}

export type Month = ReturnType<typeof groupMonth>;

export function monthMeta(m: Month) {
  return withRange(m.collapsed ? `${m.preview.length} of ${plural(m.count, 'photo')}` : plural(m.count, 'photo'), m.range);
}

// photos: one year's rows in shooting order, as YEAR_SQL returns them.
export function groupYear(y: number, photos: Photo[]) {
  const byMonth = new Map<number, Photo[]>();
  for (const p of photos) {
    const list = byMonth.get(p.month);
    if (list) list.push(p);
    else byMonth.set(p.month, [p]);
  }
  const collapse = new Set<number>();
  let shown = photos.length;
  for (const [m, list] of [...byMonth].sort((a, b) => b[1].length - a[1].length)) {
    if (shown <= YEAR_BUDGET || list.length <= PREVIEW) break;
    collapse.add(m);
    shown -= list.length - PREVIEW;
  }
  const months = [...byMonth.keys()].sort((a, b) => b - a).map((m) => groupMonth(y, m, byMonth.get(m)!, collapse.has(m)));
  const featured = photos.filter((p) => p.featured).sort((a, b) => b.takenAt.localeCompare(a.takenAt));
  return {
    year: y,
    count: photos.length,
    rollCount: new Set(photos.map((p) => p.roll)).size,
    months,
    featuredCount: featured.length,
    // Fewer than two picks isn't a selection; the one pick is already in its month.
    featured: featured.length >= 2 ? featured.slice(0, FEATURED_MAX) : [],
  };
}

export type Year = ReturnType<typeof groupYear>;

export function groupMonthPage(y: number, m: number, photos: Photo[]) {
  return groupMonth(y, m, photos, false);
}

export function days(photos: Photo[]) {
  const out = new Map<string, Photo[]>();
  for (const p of photos) {
    const k = p.precision === 'month' ? 'undated' : p.day;
    const list = out.get(k);
    if (list) list.push(p);
    else out.set(k, [p]);
  }
  return [...out].map(([iso, list]) => ({
    iso,
    label: iso === 'undated' ? 'No exact day' : dayLabel(iso),
    short: iso === 'undated' ? 'Undated' : dayLabel(iso, true),
    photos: list,
  }));
}

// The whole archive at month resolution, from MONTHS_SQL (newest first).
export function buildIndex(rows: MonthRow[]) {
  const months = rows.map((r) => {
    const [year, month] = r.taken_month.split('-').map(Number);
    return {
      key: r.taken_month,
      year,
      month,
      mm: pad(month),
      name: MONTHS[month - 1],
      short: SHORT[month - 1],
      label: `${MONTHS[month - 1]} ${year}`,
      count: r.n,
      range: dayRange(r.first.slice(0, 10), r.last.slice(0, 10)),
    };
  });
  const years: { year: number; count: number; months: typeof months }[] = [];
  for (const m of months) {
    const last = years.at(-1);
    if (last?.year === m.year) {
      last.count += m.count;
      last.months.push(m);
    } else years.push({ year: m.year, count: m.count, months: [m] });
  }
  const byYear = new Map(years.map((y) => [y.year, y]));
  const at = new Map(months.map((m, i) => [m.key, i]));
  return {
    years,
    months,
    empty: years.length === 0,
    first: years.at(-1)?.year ?? null,
    last: years[0]?.year ?? null,
    year: (y: number) => byYear.get(y),
    has: (y: number) => byYear.has(y),
    newer: (y: number) => [...years].reverse().find((x) => x.year > y),
    older: (y: number) => years.find((x) => x.year < y),
    // Years with nothing in them strictly between two years, or null.
    gap: (from: number, to: number) => {
      const lo = Math.min(from, to) + 1;
      const hi = Math.max(from, to) - 1;
      return lo <= hi ? ([lo, hi] as const) : null;
    },
    month: (key: string) => (at.has(key) ? months[at.get(key)!] : undefined),
    // months is newest first, so the later month sits at the lower index.
    laterMonth: (key: string) => (at.has(key) ? months[at.get(key)! - 1] : undefined),
    earlierMonth: (key: string) => (at.has(key) ? months[at.get(key)! + 1] : undefined),
  };
}

export type ArchiveIndex = ReturnType<typeof buildIndex>;
export type IndexMonth = ArchiveIndex['months'][number];
export type IndexYear = ArchiveIndex['years'][number];

export const gapLabel = (gap: readonly [number, number]) => (gap[0] === gap[1] ? `${gap[0]}` : `${gap[0]}–${gap[1]}`);
