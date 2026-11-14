import { env } from 'cloudflare:workers';
import { beforeEach, describe, expect, it } from 'vitest';

const db = env.DB;
const id = (n: number) => n.toString(16).padStart(16, '0');
const sha = (n: number) => n.toString(16).padStart(64, '0');

async function insertPhoto(n: number, cols: Record<string, unknown> = {}) {
  const row: Record<string, unknown> = {
    id: id(n),
    sha256: sha(n),
    roll: 'goa',
    original_key: `originals/goa/${id(n)}.jpg`,
    ...cols,
  };
  const names = Object.keys(row);
  return db
    .prepare(`INSERT INTO photos (${names.join(', ')}) VALUES (${names.map(() => '?').join(', ')})`)
    .bind(...Object.values(row))
    .run();
}

const readyCols = {
  status: 'ready',
  width: 6240,
  height: 4160,
  placeholder: 'data:image/webp;base64,AAAA',
  taken_at: '2026-10-12T17:42:03+05:30',
  taken_month: '2026-10',
  date_source: 'exif',
  date_precision: 'time',
};

beforeEach(async () => {
  await db.prepare("INSERT INTO rolls (slug, title) VALUES ('goa', 'Goa, on Kodak Gold')").run();
});

describe('rolls schema', () => {
  it('accepts a pending photo for an existing roll', async () => {
    await insertPhoto(1);
    const row = await db.prepare('SELECT status, featured, hidden FROM photos').first();
    expect(row).toEqual({ status: 'pending', featured: 0, hidden: 0 });
  });

  it('accepts a ready photo with every column a page needs', async () => {
    await insertPhoto(1, readyCols);
  });

  it('rejects a photo for a roll that does not exist', async () => {
    await expect(insertPhoto(1, { roll: 'nowhere', original_key: 'originals/nowhere/x.jpg' })).rejects.toThrow(/FOREIGN KEY/);
  });

  it.each(['width', 'height', 'placeholder', 'taken_at', 'taken_month', 'date_source', 'date_precision'])(
    'rejects a ready photo with no %s',
    async (column) => {
      await expect(insertPhoto(1, { ...readyCols, [column]: null })).rejects.toThrow(/CHECK/);
    },
  );

  it('rejects an empty caption', async () => {
    await expect(insertPhoto(1, { caption: '' })).rejects.toThrow(/CHECK/);
  });

  it('accepts a 280-character caption and rejects 281', async () => {
    await insertPhoto(1, { caption: 'a'.repeat(280) });
    await expect(insertPhoto(2, { caption: 'a'.repeat(281) })).rejects.toThrow(/CHECK/);
  });

  it('rejects alt text over 420 characters', async () => {
    await insertPhoto(1, { alt: 'a'.repeat(420) });
    await expect(insertPhoto(2, { alt: 'a'.repeat(421) })).rejects.toThrow(/CHECK/);
  });

  it('rejects a non-boolean featured flag (STRICT)', async () => {
    await expect(insertPhoto(1, { featured: 'yes' })).rejects.toThrow();
  });

  it.each(['has space', 'Upper', 'under_score', ''])('rejects the roll slug %j', async (slug) => {
    await expect(db.prepare("INSERT INTO rolls (slug, title) VALUES (?, 't')").bind(slug).run()).rejects.toThrow(/CHECK/);
  });

  it.each(['2026', '2026-1', '26-10-01'])('rejects the roll date %j', async (date) => {
    await expect(db.prepare("INSERT INTO rolls (slug, title, date) VALUES ('r', 't', ?)").bind(date).run()).rejects.toThrow(/CHECK/);
  });

  it('stores an emoji, curly quotes and Hindi intact, counting characters not bytes', async () => {
    const caption = 'Chai at dawn ☕️ — “पहली किरण”';
    await insertPhoto(1, { caption });
    const row = await db.prepare('SELECT caption, length(caption) AS chars FROM photos').first<{ caption: string; chars: number }>();
    expect(row?.caption).toBe(caption);
    expect(row?.chars).toBe([...caption].length);
  });

  it('rejects a second photo with the same hash', async () => {
    await insertPhoto(1);
    await expect(insertPhoto(2, { sha256: sha(1) })).rejects.toThrow(/UNIQUE/);
  });

  it('keeps photos pointing at a roll whose slug is renamed', async () => {
    await insertPhoto(1);
    await db.prepare("UPDATE rolls SET slug = 'goa-2026' WHERE slug = 'goa'").run();
    const row = await db.prepare('SELECT roll FROM photos').first();
    expect(row).toEqual({ roll: 'goa-2026' });
  });
});
