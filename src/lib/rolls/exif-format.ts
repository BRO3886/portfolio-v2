// Display formatting for the print caption. D1 keeps raw numbers; every rule here can change without a re-ingest.

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const SHORT = MONTHS.map((m) => m.slice(0, 3));
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const STOPS = [16000, 12800, 10000, 8000, 6400, 5000, 4000, 3200, 2500, 2000, 1600, 1250, 1000, 800, 640, 500, 400, 320, 250, 200, 160, 125, 100, 80, 60, 50, 40, 30, 25, 20, 15, 13, 10, 8, 6, 5, 4, 3, 2];

export const fmt = (n: number) => n.toLocaleString('en-GB');
export const plural = (n: number, one: string, many = one + 's') => `${fmt(n)} ${n === 1 ? one : many}`;

export function shutter(s: number | null) {
  if (s == null) return null;
  if (s >= 1) return `${Number(s.toFixed(1))}s`;
  const denom = STOPS.reduce((best, d) => (Math.abs(d - 1 / s) < Math.abs(best - 1 / s) ? d : best));
  return `1/${denom}s`;
}

// One decimal like the camera frames do; a true minus sign so the column doesn't jump.
export function ev(v: number | null) {
  if (v == null) return null;
  const r = Math.round(v * 10) / 10;
  if (r === 0) return '0.0ev';
  return `${r < 0 ? '−' : '+'}${Math.abs(r).toFixed(1)}ev`;
}

// Phones report a tiny physical focal length; the 35mm equivalent is the number people recognise.
export function focal(make: string | null, mm: number | null, mm35: number | null) {
  const phone = make === 'Apple' || (mm ?? 99) < 12;
  const value = phone && mm35 ? mm35 : mm;
  return value == null ? null : `${Math.round(value)}mm`;
}

export const aperture = (a: number | null) => (a == null ? null : `F${Number(a.toFixed(1))}`);

// An unknown Make|Model reads as the make in title case plus the model as written: 'NIKON CORPORATION|NIKON Z 6'
// becomes 'Nikon Z 6', since models often repeat the make.
export function cameraName(raw: string) {
  const [make = '', model = ''] = raw.split('|');
  const nice = make
    .toLowerCase()
    .replace(/\b(corporation|corp\.?|co\.,? ?ltd\.?|imaging|company)\b/g, '')
    .trim()
    .replace(/\b\p{L}/gu, (c) => c.toUpperCase());
  if (!model) return nice || null;
  return model.toLowerCase().startsWith(nice.toLowerCase()) ? `${nice}${model.slice(nice.length)}` : `${nice} ${model}`.trim();
}

export function dayLabel(iso: string, short = false) {
  const d = new Date(iso + 'T00:00:00Z');
  const wd = WEEKDAYS[d.getUTCDay()];
  return short ? `${wd.slice(0, 3)} ${d.getUTCDate()} ${SHORT[d.getUTCMonth()]}` : `${wd} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

// "3–21 Aug" from the first and last local dates (YYYY-MM-DD) of a set of photos.
export function dayRange(first: string, last: string) {
  const [, fm, fd] = first.split('-').map(Number);
  const [, lm, ld] = last.split('-').map(Number);
  if (first === last) return `${fd} ${SHORT[fm - 1]}`;
  return fm === lm ? `${fd}–${ld} ${SHORT[fm - 1]}` : `${fd} ${SHORT[fm - 1]} – ${ld} ${SHORT[lm - 1]}`;
}
