import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async () => {
  const posts = (await getCollection('blog', ({ data }) => !data.draft))
    .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());

  const lines: string[] = [];

  lines.push('# Blog');
  lines.push('');
  lines.push('Articles and thoughts on web development, technology, and more.');
  lines.push('');

  for (const post of posts) {
    const slug = post.data.slug || post.id.replace(/\.md$/, '');
    const date = post.data.pubDate.toISOString().split('T')[0];
    const tags = post.data.tags && post.data.tags.length > 0
      ? ` [${post.data.tags.join(', ')}]`
      : '';

    lines.push(`## [${post.data.title}](https://sidv.dev/blog/${slug}/)`);
    lines.push('');
    lines.push(`**${date}**${tags}`);
    lines.push('');
    lines.push(post.data.description);
    lines.push('');
  }

  const body = lines.join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
    },
  });
};
