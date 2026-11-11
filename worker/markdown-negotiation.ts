const markdownPaths = new Map([
  ['/', '/index.md'],
  ['/blog', '/blog/index.md'],
  ['/blog/', '/blog/index.md'],
  ['/resume', '/resume.md'],
  ['/resume/', '/resume.md'],
]);

type AssetFetcher = { fetch: (request: Request | string) => Promise<Response> };

function qualityFor(accept: string, mediaType: string): number | null {
  let quality: number | null = null;

  for (const range of accept.split(',')) {
    const [type, ...parameters] = range.trim().toLowerCase().split(';');
    if (type !== mediaType) continue;

    const qualityParameter = parameters.find((parameter) => parameter.trim().startsWith('q='));
    const parsedQuality = qualityParameter ? Number.parseFloat(qualityParameter.trim().slice(2)) : 1;
    quality = Number.isFinite(parsedQuality) ? Math.min(Math.max(parsedQuality, 0), 1) : 0;
  }

  return quality;
}

export function prefersMarkdown(accept: string): boolean {
  const markdownQuality = qualityFor(accept, 'text/markdown');
  if (markdownQuality === null || markdownQuality === 0) return false;

  const htmlQuality = qualityFor(accept, 'text/html');
  return htmlQuality === null || markdownQuality >= htmlQuality;
}

export function markdownPathFor(pathname: string): string | null {
  const knownPath = markdownPaths.get(pathname);
  if (knownPath) return knownPath;

  const blogPost = pathname.match(/^\/blog\/([^/.]+)\/?$/);
  return blogPost ? `/blog/${blogPost[1]}.md` : null;
}

function withNegotiationHeaders(response: Response, markdownPath: string, contentLocation?: string): Response {
  const headers = new Headers(response.headers);
  const vary = headers.get('Vary');

  if (!vary?.split(',').some((value) => value.trim().toLowerCase() === 'accept')) {
    headers.set('Vary', vary ? `${vary}, Accept` : 'Accept');
  }

  headers.set('Link', `<${markdownPath}>; rel="alternate"; type="text/markdown"`);
  if (contentLocation) headers.set('Content-Location', contentLocation);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export async function negotiateMarkdown(request: Request, assets: AssetFetcher): Promise<Response | null> {
  if (request.method !== 'GET' && request.method !== 'HEAD') return null;

  const requestURL = new URL(request.url);
  const markdownPath = markdownPathFor(requestURL.pathname);
  if (!markdownPath) return null;

  if (!prefersMarkdown(request.headers.get('Accept') || '')) {
    return withNegotiationHeaders(await assets.fetch(request), markdownPath);
  }

  const markdownRequest = new Request(new URL(markdownPath, requestURL), request);
  return withNegotiationHeaders(await assets.fetch(markdownRequest), markdownPath, markdownPath);
}
