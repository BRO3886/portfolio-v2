import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { workExperience, projects } from '../lib/content';

export const GET: APIRoute = async () => {
  const recentPosts = (await getCollection('blog', ({ data }) => !data.draft))
    .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime())
    .slice(0, 3);

  const lines: string[] = [];

  lines.push('# Siddhartha Varma');
  lines.push('');
  lines.push('Engineer who designs with taste. I build reliable systems and clean human interfaces.');
  lines.push('');
  lines.push('Backend first. Product minded. Currently exploring AI-native tooling and Machine Learning.');
  lines.push('');

  // Recent posts
  if (recentPosts.length > 0) {
    lines.push('## Recent Posts');
    lines.push('');
    for (const post of recentPosts) {
      const slug = post.data.slug || post.id.replace(/\.md$/, '');
      const date = post.data.pubDate.toISOString().split('T')[0];
      lines.push(`- [${post.data.title}](https://sidv.dev/blog/${slug}/) (${date}): ${post.data.description}`);
    }
    lines.push('');
  }

  // Projects
  lines.push('## Projects');
  lines.push('');
  for (const project of projects) {
    const starStr = project.stars ? ` (${project.stars} stars)` : '';
    lines.push(`- [${project.name}](${project.url})${starStr}: ${project.description}`);
  }
  lines.push('');

  // Work experience
  lines.push('## Work Experience');
  lines.push('');
  for (const entry of workExperience) {
    lines.push(`### ${entry.company} (${entry.duration})`);
    lines.push('');
    for (const role of entry.roles) {
      lines.push(`**${role.title}** (${role.duration})`);
      if (role.description) {
        lines.push(`  ${role.description}`);
      }
      lines.push('');
    }
    if (entry.description) {
      lines.push(entry.description);
      lines.push('');
    }
  }

  const body = lines.join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
    },
  });
};
