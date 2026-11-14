import { createExecutionContext, createMessageBatch, getQueueResult } from 'cloudflare:test';
import { env } from 'cloudflare:workers';
import { describe, expect, it, vi } from 'vitest';
import { bare, fuji, iphone, scan } from '../fixtures/images';
import worker from '../worker';
import { api, bytes, createRoll, json, upload } from './helpers';

type Row = Record<string, unknown>;

const derived = (id: string) =>
  env.DB.prepare(
    `SELECT status, error, width, height, placeholder, taken_at, taken_month, date_source, date_precision, camera_raw, lens,
            focal_mm, focal_35mm, aperture, shutter_s, iso, exposure_ev, exif_json, ingest_version, ingested_at
     FROM photos WHERE id = ?`,
  )
    .bind(id)
    .first<Row>();

function r2Event(key: string) {
  return { account: 'test', bucket: 'rolls-originals', action: 'PutObject', eventTime: '2026-11-14T00:00:00Z', object: { key, size: 1, eTag: 'x' } };
}

async function deliver(body: unknown, attempts = 1) {
  const batch = createMessageBatch('rolls-ingest', [{ id: crypto.randomUUID(), timestamp: new Date(), attempts, body }]);
  const ctx = createExecutionContext();
  await worker.queue(batch, env);
  return getQueueResult(batch, ctx);
}

async function uploadAndIngest(file: string, headers: Record<string, string> = {}, roll = 'goa') {
  const { id } = await (await upload(bytes(file), headers, roll)).json<{ id: string }>();
  const result = await deliver(r2Event(`originals/${roll}/${id}.jpg`));
  return { id, result };
}

async function publicKeys() {
  return (await env.PUBLIC_IMAGES.list()).objects.map((o) => o.key).sort();
}

describe('ingest', () => {
  it('reads the EXIF, writes the derivatives and marks the photo ready', async () => {
    await createRoll();
    const { id, result } = await uploadAndIngest(fuji);
    expect(result.explicitAcks).toHaveLength(1);
    const row = await derived(id);
    expect(row).toMatchObject({
      status: 'ready',
      error: null,
      width: 64,
      height: 48,
      taken_at: '2026-10-31T23:42:03+05:30',
      taken_month: '2026-10',
      date_source: 'exif',
      date_precision: 'time',
      camera_raw: 'FUJIFILM|X-T5',
      lens: 'XF23mmF1.4 R LM WR',
      focal_mm: 23,
      focal_35mm: 35,
      aperture: 2.8,
      shutter_s: 0.004,
      iso: 400,
      ingest_version: 1,
    });
    expect(row?.exposure_ev).toBeCloseTo(-1 / 3);
    expect(row?.placeholder).toMatch(/^data:image\/webp;base64,[A-Za-z0-9+/]+=*$/);
    expect(row?.ingested_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    expect(await publicKeys()).toEqual([`p/${id}-1280.webp`, `p/${id}-2048.webp`, `p/${id}-640.webp`]);
    const derivative = await env.PUBLIC_IMAGES.head(`p/${id}-640.webp`);
    expect(derivative?.httpMetadata).toMatchObject({ contentType: 'image/webp', cacheControl: 'public, max-age=31536000, immutable' });
  });

  it('keeps only whitelisted tags: no GPS, serials or owner', async () => {
    await createRoll();
    const { id } = await uploadAndIngest(fuji);
    const exif = JSON.parse((await derived(id))?.exif_json as string);
    expect(exif).toMatchObject({ Make: 'FUJIFILM', Model: 'X-T5', LensModel: 'XF23mmF1.4 R LM WR', DateTimeOriginal: '2026:10:31 23:42:03' });
    const keys = Object.keys(exif).join(' ');
    expect(keys).not.toMatch(/GPS|latitude|longitude|Serial|Owner/i);
  });

  it('reads a date with no offset as +05:30', async () => {
    await createRoll();
    const { id } = await uploadAndIngest(iphone);
    expect(await derived(id)).toMatchObject({ taken_at: '2026-11-02T07:15:00+05:30', taken_month: '2026-11', camera_raw: 'Apple|iPhone 16 Pro', focal_35mm: 24 });
  });

  it('falls back to the upload day, with no time, when there is no EXIF and no roll date', async () => {
    await createRoll();
    const { id } = await uploadAndIngest(bare);
    await env.DB.prepare("UPDATE photos SET uploaded_at = '2026-10-31T20:00:00Z' WHERE id = ?").bind(id).run();
    await deliver({ key: `originals/goa/${id}.jpg`, reingest: true });
    expect(await derived(id)).toMatchObject({ taken_at: '2026-11-01T00:00:00+05:30', taken_month: '2026-11', date_source: 'upload', date_precision: 'day', camera_raw: null });
  });

  it('uses a month-precise roll date when the file has no date', async () => {
    await createRoll('goa', { title: 'Goa', date: '2026-10' });
    const { id } = await uploadAndIngest(bare);
    expect(await derived(id)).toMatchObject({ taken_at: '2026-10-01T00:00:00+05:30', taken_month: '2026-10', date_source: 'roll', date_precision: 'month' });
  });

  it("gives a frame in an ignore_exif roll the roll's camera, film and date, not the scanner's", async () => {
    await createRoll('pentax', { title: 'Pentax', camera: 'Pentax K1000', film: 'Kodak Gold 200', date: '2027-06-10', ignoreExif: true });
    const { id } = await uploadAndIngest(scan, {}, 'pentax');
    expect(await derived(id)).toMatchObject({
      status: 'ready',
      taken_at: '2027-06-10T00:00:00+05:30',
      date_source: 'roll',
      date_precision: 'day',
      camera_raw: null,
      iso: null,
    });
  });

  it('ignores the EXIF date in an ignore_exif roll too', async () => {
    await createRoll('film', { title: 'Film', date: '2027-06', ignoreExif: true });
    const { id } = await uploadAndIngest(fuji, {}, 'film');
    expect(await derived(id)).toMatchObject({ taken_month: '2027-06', date_source: 'roll', date_precision: 'month', camera_raw: null, lens: null, aperture: null });
  });

  it('turns the same message delivered twice into one row and one set of derivatives', async () => {
    await createRoll();
    const { id } = await uploadAndIngest(fuji);
    const first = await derived(id);
    const again = await deliver(r2Event(`originals/goa/${id}.jpg`));
    expect(again.explicitAcks).toHaveLength(1);
    expect(await env.DB.prepare('SELECT COUNT(*) AS n FROM photos').first('n')).toBe(1);
    expect(await publicKeys()).toHaveLength(3);
    expect((await derived(id))?.ingested_at).toBe(first?.ingested_at);
  });

  it('creates the row for an original that skipped the route', async () => {
    await createRoll();
    const file = bytes(fuji);
    await env.ORIGINALS.put('originals/goa/0123456789abcdef.jpg', file);
    await deliver(r2Event('originals/goa/0123456789abcdef.jpg'));
    const row = await env.DB.prepare('SELECT id, roll, caption, alt, status FROM photos').first();
    expect(row).toEqual({ id: '0123456789abcdef', roll: 'goa', caption: null, alt: null, status: 'ready' });
  });

  it('acks and skips objects outside originals/', async () => {
    const result = await deliver(r2Event('elsewhere/file.jpg'));
    expect(result.explicitAcks).toHaveLength(1);
    expect(await env.DB.prepare('SELECT COUNT(*) AS n FROM photos').first('n')).toBe(0);
  });

  it('retries a failing ingest and records the error, leaving it pending', async () => {
    await createRoll();
    const { id } = await (await upload(bytes(fuji))).json<{ id: string }>();
    await env.ORIGINALS.put(`originals/goa/${id}.jpg`, new Uint8Array([0xff, 0xd8, 0xff, 0x00]));
    const result = await deliver(r2Event(`originals/goa/${id}.jpg`));
    expect(result.retryMessages).toHaveLength(1);
    expect(await derived(id)).toMatchObject({ status: 'pending', error: expect.any(String) });
  });

  it('ends a failing ingest at status failed on its last attempt', async () => {
    await createRoll();
    const { id } = await (await upload(bytes(fuji))).json<{ id: string }>();
    await env.ORIGINALS.delete(`originals/goa/${id}.jpg`);
    const result = await deliver(r2Event(`originals/goa/${id}.jpg`), 4);
    expect(result.retryMessages).toHaveLength(1);
    expect(await derived(id)).toMatchObject({ status: 'failed', error: expect.stringMatching(/original/) });
  });
});

describe('re-ingest', () => {
  it('rewrites derived columns and leaves caption, alt, featured and hidden alone', async () => {
    await createRoll('goa', { title: 'Goa' });
    const { id } = await uploadAndIngest(bare, { 'X-Caption': encodeURIComponent('Kept') });
    await api('PATCH', `/api/rolls/photos/${id}`, json({ alt: 'New alt', featured: true, hidden: true }));
    await api('PUT', '/api/rolls/rolls/goa', json({ date: '2026-09' }));
    await deliver({ key: `originals/goa/${id}.jpg`, reingest: true });
    const row = await env.DB.prepare('SELECT caption, alt, featured, hidden, taken_month, date_source FROM photos WHERE id = ?').bind(id).first();
    expect(row).toEqual({ caption: 'Kept', alt: 'New alt', featured: 1, hidden: 1, taken_month: '2026-09', date_source: 'roll' });
  });

  it('queues the photo from the reingest route', async () => {
    await createRoll();
    const { id } = await (await upload(bytes(fuji))).json<{ id: string }>();
    const send = vi.spyOn(env.ROLLS_INGEST, 'send');
    const res = await api('POST', `/api/rolls/photos/${id}/reingest`);
    expect(res.status).toBe(202);
    expect(send).toHaveBeenCalledWith({ key: `originals/goa/${id}.jpg`, reingest: true });
  });

  it('answers 404 when re-ingesting an unknown photo', async () => {
    expect((await api('POST', '/api/rolls/photos/0123456789abcdef/reingest')).status).toBe(404);
  });
});
