import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export async function getStaticPaths() {
  const blogEntries = await getCollection('blog', ({ data }) => !data.draft);

  return blogEntries.map((entry) => ({
    params: { slug: entry.data.slug || entry.id.replace(/\.md$/, '') },
    props: { entry },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const { entry } = props as { entry: Awaited<ReturnType<typeof getCollection>>[number] };

  const slug = entry.data.slug || entry.id.replace(/\.md$/, '');
  const date = entry.data.pubDate.toISOString().split('T')[0];

  const lines: string[] = [];

  lines.push(`# ${entry.data.title}`);
  lines.push('');
  lines.push(`- URL: https://sidv.dev/blog/${slug}/`);
  lines.push(`- Date: ${date}`);
  lines.push(`- Author: ${entry.data.author}`);
  if (entry.data.tags && entry.data.tags.length > 0) {
    lines.push(`- Tags: ${entry.data.tags.join(', ')}`);
  }
  lines.push('');
  lines.push(`> ${entry.data.description}`);
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push(entry.body || '');

  const body = lines.join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
    },
  });
};
