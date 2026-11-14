import { env } from 'cloudflare:workers';
import { describe, expect, it, vi } from 'vitest';
import { bare, fuji, iphone } from '../fixtures/images';
import { api, bytes, createRoll, json, photo, upload } from './helpers';

const sha256 = async (b: Uint8Array) =>
  [...new Uint8Array(await crypto.subtle.digest('SHA-256', b))].map((x) => x.toString(16).padStart(2, '0')).join('');

describe('auth', () => {
  it.each([
    ['missing', null],
    ['wrong, same length', 'test-tokeX'],
    ['wrong, different length', 'nope'],
  ])('rejects a %s token with 401', async (_, token) => {
    const res = await api('GET', '/api/rolls/list', { token });
    expect(res.status).toBe(401);
  });

  it('rejects a non-Bearer scheme', async () => {
    const res = await api('GET', '/api/rolls/list', { token: null, headers: { Authorization: 'Basic test-token' } });
    expect(res.status).toBe(401);
  });

  it('accepts the right token', async () => {
    const res = await api('GET', '/api/rolls/list');
    expect(res.status).toBe(200);
  });
});

describe('rolls', () => {
  it('creates a roll and lists it with its photo count', async () => {
    const res = await api('PUT', '/api/rolls/rolls/goa', json({ title: 'Goa, on Kodak Gold', camera: 'Olympus mju-II', film: 'Kodak Gold 200', date: '2026-10', ignoreExif: true }));
    expect(res.status).toBe(201);
    await upload(bytes(fuji));
    const list = await (await api('GET', '/api/rolls/list')).json();
    expect(list).toEqual({ rolls: [{ slug: 'goa', title: 'Goa, on Kodak Gold', photos: 1 }] });
    const row = await env.DB.prepare('SELECT camera, film, date, ignore_exif FROM rolls').first();
    expect(row).toEqual({ camera: 'Olympus mju-II', film: 'Kodak Gold 200', date: '2026-10', ignore_exif: 1 });
  });

  it('updates only the fields sent, and null clears one', async () => {
    await createRoll('goa', { title: 'Goa', camera: 'Olympus mju-II', film: 'Kodak Gold 200' });
    const res = await api('PUT', '/api/rolls/rolls/goa', json({ title: 'Goa again', film: null }));
    expect(res.status).toBe(200);
    const row = await env.DB.prepare('SELECT title, camera, film FROM rolls').first();
    expect(row).toEqual({ title: 'Goa again', camera: 'Olympus mju-II', film: null });
  });

  it('lists rolls newest first', async () => {
    await createRoll('first', { title: 'First' });
    await env.DB.prepare("UPDATE rolls SET created_at = '2026-01-01T00:00:00Z'").run();
    await createRoll('second', { title: 'Second' });
    const list = await (await api('GET', '/api/rolls/list')).json<{ rolls: { slug: string }[] }>();
    expect(list.rolls.map((r) => r.slug)).toEqual(['second', 'first']);
  });

  it.each([
    ['/api/rolls/rolls/Bad Slug', { title: 't' }, /slug/],
    ['/api/rolls/rolls/goa', {}, /title/],
    ['/api/rolls/rolls/goa', { title: 'x'.repeat(121) }, /title/],
    ['/api/rolls/rolls/goa', { title: 't', date: '2026' }, /date/],
    ['/api/rolls/rolls/goa', { title: 't', ignoreExif: 'yes' }, /ignoreExif/],
    ['/api/rolls/rolls/goa', { title: 't', colour: 'red' }, /colour/],
  ])('rejects %s %j with 400', async (path, body, message) => {
    const res = await api('PUT', path, json(body));
    expect(res.status).toBe(400);
    expect((await res.json<{ error: string }>()).error).toMatch(message);
  });
});

describe('upload validation', () => {
  it('refuses a roll that does not exist', async () => {
    const res = await upload(bytes(fuji), {}, 'nowhere');
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'create the roll first' });
  });

  it('refuses an upload with no roll', async () => {
    const res = await api('PUT', '/api/rolls/upload', { body: bytes(fuji) });
    expect(res.status).toBe(400);
  });

  it('refuses a header that does not percent-decode, naming it', async () => {
    await createRoll();
    const res = await upload(bytes(fuji), { 'X-Caption': '%E0%A4' });
    expect(res.status).toBe(400);
    expect((await res.json<{ error: string }>()).error).toMatch(/X-Caption/);
  });

  it('accepts a 280-character caption and refuses 281, naming the field', async () => {
    await createRoll();
    expect((await upload(bytes(fuji), { 'X-Caption': encodeURIComponent('é'.repeat(280)) })).status).toBe(202);
    const res = await upload(bytes(iphone), { 'X-Caption': encodeURIComponent('é'.repeat(281)) });
    expect(res.status).toBe(400);
    expect((await res.json<{ error: string }>()).error).toMatch(/X-Caption/);
  });

  it('refuses alt text over 420 characters', async () => {
    await createRoll();
    const res = await upload(bytes(fuji), { 'X-Alt': encodeURIComponent('a'.repeat(421)) });
    expect(res.status).toBe(400);
    expect((await res.json<{ error: string }>()).error).toMatch(/X-Alt/);
  });

  it('refuses a body that is not a JPEG with 415', async () => {
    await createRoll();
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect((await upload(png)).status).toBe(415);
  });

  it('refuses an empty body with 415', async () => {
    await createRoll();
    expect((await upload(new Uint8Array())).status).toBe(415);
  });

  it('refuses a body over the size cap with 413', async () => {
    await createRoll();
    const big = new Uint8Array(50 * 1024 * 1024 + 1);
    big.set([0xff, 0xd8, 0xff]);
    expect((await upload(big)).status).toBe(413);
  });

  it('accepts a 25MB JPEG', async () => {
    await createRoll();
    const big = new Uint8Array(25 * 1024 * 1024);
    big.set(bytes(fuji));
    expect((await upload(big)).status).toBe(202);
  });
});

describe('upload', () => {
  it('stores the pending row and the original, and answers 202 with the id', async () => {
    await createRoll();
    const file = bytes(iphone);
    const res = await upload(file, { 'X-Filename': encodeURIComponent('DSCF0042.JPG'), 'X-Featured': '1' });
    expect(res.status).toBe(202);
    const { id, message } = await res.json<{ id: string; message: string }>();
    expect(id).toBe((await sha256(file)).slice(0, 16));
    expect(message).toBe('Uploaded');
    expect(await photo(id)).toEqual({
      id,
      roll: 'goa',
      original_key: `originals/goa/${id}.jpg`,
      filename: 'DSCF0042.JPG',
      caption: null,
      alt: 'A test frame',
      featured: 1,
      hidden: 0,
      status: 'pending',
      error: null,
    });
    const original = await env.ORIGINALS.get(`originals/goa/${id}.jpg`);
    expect(new Uint8Array(await original!.arrayBuffer())).toEqual(file);
  });

  it('queues the ingest for the stored original', async () => {
    await createRoll();
    const send = vi.spyOn(env.ROLLS_INGEST, 'send');
    const { id } = await (await upload(bytes(fuji))).json<{ id: string }>();
    expect(send).toHaveBeenCalledWith({ key: `originals/goa/${id}.jpg` });
  });

  it('round-trips a caption with an emoji, curly quotes and Hindi byte for byte', async () => {
    await createRoll();
    const caption = 'Chai at dawn ☕️ — “पहली किरण” 🚂';
    const res = await upload(bytes(fuji), { 'X-Caption': encodeURIComponent(caption) });
    const { id } = await res.json<{ id: string }>();
    const row = await photo(id);
    expect(row?.caption).toBe(caption);
    expect(new TextEncoder().encode(row?.caption as string)).toEqual(new TextEncoder().encode(caption));
  });

  it('treats an empty caption header as no caption', async () => {
    await createRoll();
    const { id } = await (await upload(bytes(fuji), { 'X-Caption': '' })).json<{ id: string }>();
    expect((await photo(id))?.caption).toBeNull();
  });

  it('accepts a photo without alt text', async () => {
    await createRoll();
    const res = await api('PUT', '/api/rolls/upload?roll=goa', { body: bytes(bare) });
    expect(res.status).toBe(202);
    const { id } = await res.json<{ id: string }>();
    expect((await photo(id))?.alt).toBeNull();
  });

  it('answers a second upload of a ready photo with duplicate: true', async () => {
    await createRoll();
    const { id } = await (await upload(bytes(fuji))).json<{ id: string }>();
    await env.DB.prepare(
      "UPDATE photos SET status = 'ready', width = 1, height = 1, placeholder = 'x', taken_at = 't', taken_month = '2026-10', date_source = 'exif', date_precision = 'time' WHERE id = ?",
    ).bind(id).run();
    const res = await upload(bytes(fuji));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id, duplicate: true, message: 'Already uploaded' });
  });

  it('retries an interrupted upload into the same row and puts the original', async () => {
    await createRoll();
    const { id } = await (await upload(bytes(fuji), { 'X-Caption': encodeURIComponent('first try') })).json<{ id: string }>();
    await env.ORIGINALS.delete(`originals/goa/${id}.jpg`);
    const res = await upload(bytes(fuji), { 'X-Caption': encodeURIComponent('second try') });
    expect(res.status).toBe(202);
    expect(await res.json()).toEqual({ id, message: 'Uploaded' });
    const count = await env.DB.prepare('SELECT COUNT(*) AS n FROM photos').first('n');
    expect(count).toBe(1);
    expect((await photo(id))?.caption).toBe('first try');
    expect(await env.ORIGINALS.head(`originals/goa/${id}.jpg`)).not.toBeNull();
  });
});

describe('editing a photo', () => {
  async function uploaded() {
    await createRoll();
    const res = await upload(bytes(fuji), { 'X-Caption': encodeURIComponent('Original caption') });
    return (await res.json<{ id: string }>()).id;
  }

  it('changes only the fields sent', async () => {
    const id = await uploaded();
    const res = await api('PATCH', `/api/rolls/photos/${id}`, json({ featured: true }));
    expect(res.status).toBe(200);
    expect(await photo(id)).toMatchObject({ caption: 'Original caption', alt: 'A test frame', featured: 1, hidden: 0 });
  });

  it('clears the caption with null', async () => {
    const id = await uploaded();
    await api('PATCH', `/api/rolls/photos/${id}`, json({ caption: null, hidden: true }));
    expect(await photo(id)).toMatchObject({ caption: null, alt: 'A test frame', hidden: 1 });
  });

  it('answers 404 for an unknown photo', async () => {
    const res = await api('PATCH', '/api/rolls/photos/0123456789abcdef', json({ featured: true }));
    expect(res.status).toBe(404);
  });

  it.each([
    [{ caption: '' }, /caption/],
    [{ caption: 'x'.repeat(281) }, /caption/],
    [{ featured: 'yes' }, /featured/],
    [{ status: 'ready' }, /status/],
  ])('refuses %j with 400 naming the field', async (body, message) => {
    const id = await uploaded();
    const res = await api('PATCH', `/api/rolls/photos/${id}`, json(body));
    expect(res.status).toBe(400);
    expect((await res.json<{ error: string }>()).error).toMatch(message);
  });
});

describe('routing', () => {
  it('answers 404 for an unknown route', async () => {
    expect((await api('GET', '/api/rolls/nothing')).status).toBe(404);
  });

  it('answers 405 for a known route with the wrong method', async () => {
    const res = await api('DELETE', '/api/rolls/list');
    expect(res.status).toBe(405);
    expect(res.headers.get('Allow')).toBe('GET');
  });
});
