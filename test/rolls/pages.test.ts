import { env } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import { buildIndex, days, groupMonthPage, groupYear, monthMeta, shape, type Photo } from '../../src/lib/rolls/archive';
import { MONTH_SQL, YEAR_SQL, loadMonth, loadYear, type PhotoRow } from '../../src/lib/rolls/db';
import { cachedRollsPage } from '../../worker/rolls-cache';

const IMG = 'https://img.example';

type Seed = Partial<PhotoRow> & { at: string; precision?: PhotoRow['date_precision']; hidden?: number; status?: string };
let counter = 0;

async function roll(slug: string, extra: { camera?: string; film?: string; ignore_exif?: number } = {}) {
  await env.DB.prepare('INSERT INTO rolls (slug, title, camera, film, ignore_exif) VALUES (?, ?, ?, ?, ?)')
    .bind(slug, `Roll ${slug}`, extra.camera ?? null, extra.film ?? null, extra.ignore_exif ?? 0)
    .run();
}

function insertStatement(r: string, s: Seed) {
  counter += 1;
  const id = counter.toString(16).padStart(16, '0');
  return env.DB.prepare(
    `INSERT INTO photos (id, sha256, roll, original_key, filename, featured, hidden, status, width, height, placeholder,
       taken_at, taken_month, date_source, date_precision, camera_raw, iso, focal_mm, focal_35mm, aperture, shutter_s, exposure_ev)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'data:image/webp;base64,AA==', ?, ?, 'exif', ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    id,
    id.repeat(4),
    r,
    `originals/${r}/${id}.jpg`,
    `F${counter}.JPG`,
    s.featured ?? 0,
    s.hidden ?? 0,
    s.status ?? 'ready',
    s.width ?? 3000,
    s.height ?? 2000,
    s.at,
    s.at.slice(0, 7),
    s.precision ?? 'time',
    s.camera_raw ?? 'FUJIFILM|X-T5',
    s.iso ?? 400,
    s.focal_mm ?? 23,
    s.focal_35mm ?? 35,
    s.aperture ?? 2.8,
    s.shutter_s ?? 0.004,
    s.exposure_ev ?? -0.33,
  );
}

async function photos(r: string, seeds: Seed[]) {
  for (let i = 0; i < seeds.length; i += 50) await env.DB.batch(seeds.slice(i, i + 50).map((s) => insertStatement(r, s)));
}

const at = (month: string, i: number) => `${month}-${String(1 + (i % 28)).padStart(2, '0')}T${String(8 + (i % 12)).padStart(2, '0')}:00:00+05:30`;

// The raw row as YEAR_SQL returns it, for grouping tests that don't need D1.
function row(over: Partial<PhotoRow> & { taken_at: string }): PhotoRow {
  return {
    id: '0000000000000001',
    roll: 'r',
    roll_title: 'Roll',
    filename: null,
    caption: null,
    alt: 'Alt',
    featured: 0,
    width: 3000,
    height: 2000,
    placeholder: 'data:image/webp;base64,AA==',
    taken_month: over.taken_at.slice(0, 7),
    date_precision: 'time',
    camera_raw: 'FUJIFILM|X-T5',
    camera_display: 'Fujifilm X-T5',
    roll_camera: null,
    ignore_exif: 0,
    lens: null,
    focal_mm: 23,
    focal_35mm: 35,
    aperture: 2.8,
    shutter_s: 0.004,
    iso: 400,
    exposure_ev: -0.33,
    film: null,
    ...over,
  };
}

const many = (n: number, month: string, over: Partial<PhotoRow> = {}): Photo[] =>
  Array.from({ length: n }, (_, i) => shape(row({ id: i.toString(16).padStart(16, '0'), taken_at: at(month, i), ...over }), IMG));

describe('a page render', () => {
  it('sends one db.batch() and nothing else', async () => {
    await roll('goa');
    await photos('goa', [{ at: at('2026-10', 1) }]);
    const calls: string[] = [];
    const counted = new Proxy(env.DB, {
      get(target, key) {
        const value = Reflect.get(target, key);
        if (typeof value !== 'function') return value;
        return (...args: unknown[]) => {
          if (key !== 'prepare') calls.push(String(key));
          return value.apply(target, args);
        };
      },
    });
    await loadYear(counted, null);
    await loadYear(counted, '2026');
    await loadMonth(counted, '2026-10');
    expect(calls).toEqual(['batch', 'batch', 'batch']);
  });

  it.each([
    ['the year query', YEAR_SQL, '2031'],
    ['the month query', MONTH_SQL, '2031-08'],
  ])('reads %s through photos_visible_by_month', async (_, sql, arg) => {
    const { results } = await env.DB.prepare(`EXPLAIN QUERY PLAN ${sql}`).bind(arg).all<{ detail: string }>();
    const plan = results.map((r) => r.detail).join('\n');
    expect(plan).toMatch(/SEARCH p USING INDEX photos_visible_by_month \(taken_month[=><]/);
  });
});

describe('loadYear and loadMonth', () => {
  it('leave out hidden, pending and failed photos', async () => {
    await roll('goa');
    await photos('goa', [{ at: at('2026-10', 1) }, { at: at('2026-10', 2), hidden: 1 }, { at: at('2026-10', 3), status: 'pending', width: undefined }]);
    await env.DB.prepare("INSERT INTO photos (id, sha256, roll, original_key, status, error) VALUES ('ffffffffffffffff', ?, 'goa', 'originals/goa/f.jpg', 'failed', 'x')")
      .bind('f'.repeat(64))
      .run();
    const data = await loadYear(env.DB, '2026');
    expect(data.photos).toHaveLength(1);
    expect(data.months).toEqual([{ taken_month: '2026-10', n: 1, first: at('2026-10', 1), last: at('2026-10', 1) }]);
  });

  it('load the newest year for the landing page and the older year cover for Continue', async () => {
    await roll('a');
    await photos('a', [
      { at: at('2031-03', 1) },
      { at: at('2029-05', 1), width: 9000, height: 2000, featured: 1 },
      { at: at('2029-06', 1), featured: 1 },
      { at: at('2029-07', 1), featured: 1 },
      { at: at('2029-01', 1) },
    ]);
    const data = await loadYear(env.DB, null);
    expect(data.photos.map((p) => p.taken_month)).toEqual(['2031-03']);
    // The newest featured frame that isn't a panorama.
    expect(data.cover?.taken_month).toBe('2029-07');
  });

  it('join the camera name, and use the roll camera with no exposure for an ignore_exif roll', async () => {
    await roll('film', { camera: 'Pentax K1000', film: 'Kodak Gold 200', ignore_exif: 1 });
    await roll('digital');
    await env.DB.prepare("INSERT INTO cameras (raw, display) VALUES ('FUJIFILM|X-T5', 'Fujifilm X-T5')").run();
    await photos('film', [{ at: '2027-06-10T00:00:00+05:30', precision: 'day', camera_raw: 'EPSON|Perfection V600' }]);
    await photos('digital', [{ at: at('2027-06', 20) }, { at: at('2027-06', 21), camera_raw: 'NIKON CORPORATION|NIKON Z 6' }]);
    const [film, fuji, nikon] = (await loadYear(env.DB, '2027')).photos.map((r) => shape(r, IMG));
    expect(film).toMatchObject({ camera: 'Pentax K1000', film: 'Kodak Gold 200', exposure: [], date: '10 Jun 2027', time: null, datetime: '2027-06-10' });
    expect(fuji).toMatchObject({ camera: 'Fujifilm X-T5', exposure: ['ISO 400', '23mm', '−0.3ev', 'F2.8', '1/250s'] });
    expect(nikon.camera).toBe('Nikon Z 6');
  });
});

describe('grouping', () => {
  it('splits a year into months, newest first, with day ranges', () => {
    const year = groupYear(2049, [...many(3, '2049-01'), ...many(5, '2049-02'), ...many(2, '2049-03')]);
    expect(year.months.map((m) => [m.name, m.count])).toEqual([['March', 2], ['February', 5], ['January', 3]]);
    expect(monthMeta(year.months[1])).toBe('5 photos · 1–5 Feb');
  });

  it('collapses the biggest month to an even 36-photo sample when the year is over 900', () => {
    const big = many(1100, '2038-08');
    const year = groupYear(2038, [...many(300, '2038-03'), ...big]);
    const aug = year.months.find((m) => m.month === 8)!;
    expect(aug).toMatchObject({ collapsed: true, count: 1100 });
    expect(aug.preview).toHaveLength(36);
    expect(aug.preview[0]).toBe(big[0]);
    expect(aug.preview[35]).toBe(big[Math.floor((35 * 1100) / 36)]);
    expect(monthMeta(aug)).toMatch(/^36 of 1,100 photos · /);
    expect(year.months.find((m) => m.month === 3)!.collapsed).toBe(false);
  });

  it('shows Featured only with two or more picks, at most six, newest first', () => {
    const one = groupYear(2033, many(5, '2033-04', { featured: 1 }).slice(0, 1).concat(many(4, '2033-05')));
    expect(one.featured).toEqual([]);
    const lots = groupYear(2040, many(8, '2040-02', { featured: 1 }));
    expect(lots.featured).toHaveLength(6);
    expect(lots.featured[0].takenAt > lots.featured[5].takenAt).toBe(true);
    expect(lots.featuredCount).toBe(8);
  });

  it('shows a month-precise film frame as the month only, and keeps it out of day ranges', () => {
    const undated = many(2, '2027-11', { date_precision: 'month', taken_at: '2027-11-01T00:00:00+05:30' });
    expect(undated[0]).toMatchObject({ date: 'Nov 2027', time: null, datetime: '2027-11' });
    const month = groupMonthPage(2027, 11, undated);
    expect(monthMeta(month)).toBe('2 photos');
    expect(days(undated).map((d) => d.label)).toEqual(['No exact day']);
  });

});

describe('the archive index', () => {
  const index = buildIndex(
    ['2049-03', '2049-01', '2041-06', '2036-07', '2033-12', '2029-05'].map((m) => ({ taken_month: m, n: 10, first: `${m}-02T09:00:00+05:30`, last: `${m}-20T09:00:00+05:30` })),
  );

  it('knows the span, the gaps and the neighbours', () => {
    expect([index.first, index.last]).toEqual([2029, 2049]);
    expect(index.has(2042)).toBe(false);
    expect(index.older(2049)?.year).toBe(2041);
    expect(index.newer(2041)?.year).toBe(2049);
    expect(index.gap(2049, 2041)).toEqual([2042, 2048]);
    expect(index.gap(2030, 2029)).toBeNull();
    expect(index.year(2049)).toMatchObject({ count: 20 });
  });

});

describe('the page cache', () => {
  const ctx = () => {
    const pending: Promise<unknown>[] = [];
    return { waitUntil: (p: Promise<unknown>) => pending.push(p), settle: () => Promise.all(pending) };
  };

  it('serves a hit without rendering, so D1 is never queried', async () => {
    let renders = 0;
    const render = async () => {
      renders += 1;
      return new Response(`page ${renders}`, { headers: { 'Content-Type': 'text/html' } });
    };
    const first = ctx();
    const miss = await cachedRollsPage(new Request('https://sidv.dev/rolls/2031?utm_source=x'), first, render);
    expect(await miss.text()).toBe('page 1');
    expect(miss.headers.get('Cache-Control')).toBe('public, max-age=600');
    await first.settle();

    const hit = await cachedRollsPage(new Request('https://sidv.dev/rolls/2031'), ctx(), render);
    expect(await hit.text()).toBe('page 1');
    expect(renders).toBe(1);
  });

});
