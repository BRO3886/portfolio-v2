import type { SSRManifest } from 'astro';
import { App } from 'astro/app';
import { handle } from '@astrojs/cloudflare/handler';
import type { ExecutionContext } from '@cloudflare/workers-types';
import { negotiateMarkdown } from './markdown-negotiation';

type Env = Parameters<typeof handle>[3];
type WorkerRequest = Parameters<typeof handle>[2];

// Workers static assets answer trailing-slash redirects with 307 and cache 404s;
// Cloudflare Pages used 308 and no-store. Keep the Pages behaviour so existing
// permanent redirects stay permanent for crawlers.
function withPagesSemantics(request: Request, response: Response): Response {
  const isTrailingSlashRedirect =
    response.status === 307 &&
    new URL(response.headers.get('Location') ?? '', request.url).pathname === `${new URL(request.url).pathname}/`;

  if (!isTrailingSlashRedirect && response.status !== 404) return response;

  const headers = new Headers(response.headers);
  if (response.status === 404) headers.set('Cache-Control', 'no-store');

  return new Response(response.body, {
    status: isTrailingSlashRedirect ? 308 : response.status,
    statusText: isTrailingSlashRedirect ? 'Permanent Redirect' : response.statusText,
    headers,
  });
}

export function createExports(manifest: SSRManifest) {
  const app = new App(manifest);

  return {
    default: {
      async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        const isReadRequest = request.method === 'GET' || request.method === 'HEAD';
        if (!isReadRequest && !app.match(request)) {
          return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } });
        }

        // The runtime passes one Request object; Astro's handler is typed against
        // @cloudflare/workers-types while this file uses the DOM lib's Request.
        const response =
          (await negotiateMarkdown(request, env.ASSETS)) ??
          (await handle(manifest, app, request as unknown as WorkerRequest, env, ctx));

        return withPagesSemantics(request, response);
      },
    },
  };
}
