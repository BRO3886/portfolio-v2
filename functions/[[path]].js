const markdownPaths = new Map([
  ['/', '/index.md'],
  ['/blog', '/blog/index.md'],
  ['/blog/', '/blog/index.md'],
  ['/resume', '/resume.md'],
  ['/resume/', '/resume.md'],
]);

function qualityFor(accept, mediaType) {
  let quality = null;

  for (const range of accept.split(',')) {
    const [type, ...parameters] = range.trim().toLowerCase().split(';');
    if (type !== mediaType) continue;

    const qualityParameter = parameters.find((parameter) => parameter.trim().startsWith('q='));
    const parsedQuality = qualityParameter ? Number.parseFloat(qualityParameter.trim().slice(2)) : 1;
    quality = Number.isFinite(parsedQuality) ? Math.min(Math.max(parsedQuality, 0), 1) : 0;
  }

  return quality;
}

export function prefersMarkdown(accept) {
  const markdownQuality = qualityFor(accept, 'text/markdown');
  if (markdownQuality === null || markdownQuality === 0) return false;

  const htmlQuality = qualityFor(accept, 'text/html');
  return htmlQuality === null || markdownQuality >= htmlQuality;
}

export function markdownPathFor(pathname) {
  const knownPath = markdownPaths.get(pathname);
  if (knownPath) return knownPath;

  const blogPost = pathname.match(/^\/blog\/([^/.]+)\/?$/);
  return blogPost ? `/blog/${blogPost[1]}.md` : null;
}

function withNegotiationHeaders(response, markdownPath, contentLocation) {
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

export async function onRequest(context) {
  const { request } = context;
  if (request.method !== 'GET' && request.method !== 'HEAD') return context.next();

  const requestURL = new URL(request.url);
  const markdownPath = markdownPathFor(requestURL.pathname);
  if (!markdownPath) return context.next();

  if (!prefersMarkdown(request.headers.get('Accept') || '')) {
    return withNegotiationHeaders(await context.next(), markdownPath);
  }

  const markdownURL = new URL(markdownPath, requestURL);
  const markdownRequest = new Request(markdownURL, request);
  const response = await context.next(markdownRequest);
  return withNegotiationHeaders(response, markdownPath, markdownPath);
}
