// Worker responses never reach Cloudflare's CDN cache on their own, so /rolls pages are cached explicitly.
// New photos show up within the TTL.
export const ROLLS_PAGE_TTL = 600;

type WaitUntil = { waitUntil(promise: Promise<unknown>): void };

export const isRollsPage = (pathname: string) => pathname === '/rolls' || pathname.startsWith('/rolls/');

// Keyed on the URL without its query, so ?utm_source=… doesn't split the cache or bypass it.
function cacheKey(url: string) {
  const key = new URL(url);
  key.search = '';
  key.hash = '';
  return new Request(key.toString(), { method: 'GET' });
}

export async function cachedRollsPage(request: Request, ctx: WaitUntil, render: () => Promise<Response>): Promise<Response> {
  if (request.method !== 'GET') return render();
  const key = cacheKey(request.url);
  const hit = await caches.default.match(key);
  if (hit) return hit;

  const rendered = await render();
  if (rendered.status !== 200) return rendered;
  const response = new Response(rendered.body, rendered);
  response.headers.set('Cache-Control', `public, max-age=${ROLLS_PAGE_TTL}`);
  ctx.waitUntil(caches.default.put(key, response.clone()));
  return response;
}
