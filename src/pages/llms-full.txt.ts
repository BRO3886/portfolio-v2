import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { workExperience, projects, socialLinks } from '../lib/content';

export const GET: APIRoute = async () => {
  const posts = (await getCollection('blog', ({ data }) => !data.draft))
    .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());

  const lines: string[] = [];

  // Header
  lines.push('# Siddhartha Varma');
  lines.push('');
  lines.push('> Software engineer. Personal site with blog posts and work history.');
  lines.push('');
  lines.push('Siddhartha (Sid) Varma is a software engineer with experience at Zomato, Groww, and various startups. Backend first, product minded. Currently exploring AI-native tooling and Machine Learning.');
  lines.push('');

  // Social links
  lines.push('## Links');
  lines.push('');
  for (const link of socialLinks) {
    lines.push(`- [${link.name}](${link.url})`);
  }
  lines.push('');

  // Work experience
  lines.push('## Work Experience');
  lines.push('');
  for (const entry of workExperience) {
    lines.push(`### ${entry.company}`);
    lines.push('');
    lines.push(`${entry.duration} | [${entry.company}](${entry.url})`);
    lines.push('');
    if (entry.description) {
      lines.push(entry.description);
      lines.push('');
    }
    for (const role of entry.roles) {
      lines.push(`**${role.title}** (${role.duration})`);
      if (role.description) {
        lines.push('');
        lines.push(role.description);
      }
      lines.push('');
    }
  }

  // Projects
  lines.push('## Projects');
  lines.push('');
  for (const project of projects) {
    lines.push(`### ${project.name}`);
    lines.push('');
    lines.push(project.description);
    lines.push('');
    lines.push(`- URL: ${project.url}`);
    lines.push(`- Tech: ${project.tech.join(', ')}`);
    if (project.stars) {
      lines.push(`- Stars: ${project.stars}`);
    }
    if (project.highlight) {
      lines.push(`- Highlight: ${project.highlight}`);
    }
    lines.push('');
  }

  // Blog posts with full content
  lines.push('## Blog Posts');
  lines.push('');
  for (const post of posts) {
    const slug = post.data.slug || post.id.replace(/\.md$/, '');
    const date = post.data.pubDate.toISOString().split('T')[0];
    lines.push(`### ${post.data.title}`);
    lines.push('');
    lines.push(`- URL: https://sidv.dev/blog/${slug}/`);
    lines.push(`- Date: ${date}`);
    lines.push(`- Author: ${post.data.author}`);
    if (post.data.tags && post.data.tags.length > 0) {
      lines.push(`- Tags: ${post.data.tags.join(', ')}`);
    }
    lines.push('');
    lines.push(post.body || '');
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  const body = lines.join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
