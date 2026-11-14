import { exports } from 'cloudflare:workers';
import { env } from 'cloudflare:workers';

export const TOKEN = 'test-token';

export const bytes = (b64: string) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

export async function api(method: string, path: string, init: { headers?: Record<string, string>; body?: BodyInit; token?: string | null } = {}) {
  const headers = new Headers(init.headers);
  const token = init.token === undefined ? TOKEN : init.token;
  if (token !== null) headers.set('Authorization', `Bearer ${token}`);
  return exports.default.fetch(new Request(`https://sidv.dev${path}`, { method, headers, body: init.body }));
}

export const json = (body: unknown) => ({ body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } });

export async function createRoll(slug = 'goa', body: Record<string, unknown> = { title: 'Goa, on Kodak Gold' }) {
  const res = await api('PUT', `/api/rolls/rolls/${slug}`, json(body));
  if (!res.ok) throw new Error(`createRoll ${res.status}: ${await res.text()}`);
}

export async function upload(file: Uint8Array, headers: Record<string, string> = {}, roll = 'goa') {
  return api('PUT', `/api/rolls/upload?roll=${roll}`, { body: file, headers: { 'X-Alt': encodeURIComponent('A test frame'), ...headers } });
}

export const photo = (id: string) =>
  env.DB.prepare('SELECT id, roll, original_key, filename, caption, alt, featured, hidden, status, error FROM photos WHERE id = ?').bind(id).first();
