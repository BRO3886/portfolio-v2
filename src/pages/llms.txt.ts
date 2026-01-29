import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { socialLinks } from '../lib/content';

export const GET: APIRoute = async () => {
  const posts = (await getCollection('blog', ({ data }) => !data.draft))
    .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());

  const lines: string[] = [];

  lines.push('# Siddhartha Varma');
  lines.push('');
  lines.push('> Software engineer. Personal site with blog posts and work history.');
  lines.push('');
  lines.push('Siddhartha (Sid) Varma is a software engineer with experience at Zomato, Groww, and various startups. He writes about software engineering, AI, and technology.');
  lines.push('');

  lines.push('## Pages');
  lines.push('');
  lines.push('- [Homepage](https://sidv.dev/): About me, work experience timeline, recent blog posts');
  lines.push('- [Blog](https://sidv.dev/blog/): All published blog posts');
  lines.push('');

  lines.push('## Blog Posts');
  lines.push('');
  for (const post of posts) {
    const slug = post.data.slug || post.id.replace(/\.md$/, '');
    lines.push(`- [${post.data.title}](https://sidv.dev/blog/${slug}/): ${post.data.description}`);
  }
  lines.push('');

  lines.push('## Links');
  lines.push('');
  for (const link of socialLinks) {
    if (link.url.startsWith('mailto:')) continue;
    lines.push(`- [${link.name}](${link.url})`);
  }
  lines.push('');

  lines.push('## Optional');
  lines.push('');
  lines.push('- [Full content](https://sidv.dev/llms-full.txt): Complete site content including all blog posts and work experience');

  const body = lines.join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
