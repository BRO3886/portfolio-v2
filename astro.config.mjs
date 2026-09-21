// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

const sitemapLastModified = new Map([
  ['/', '2026-09-21'],
  ['/blog/', '2026-09-21'],
  ['/blog/dynamodb-architecture/', '2025-01-31'],
  ['/blog/green-tea-gc-how-go-cut-memory-waste/', '2025-07-13'],
  ['/blog/software-engineering-agentic-era/', '2026-09-21'],
  ['/resume/', '2026-09-15'],
]);

// https://astro.build/config
export default defineConfig({
  site: 'https://sidv.dev',
  output: 'static',
  adapter: cloudflare({
    mode: 'directory',
  }),
  build: {
    inlineStylesheets: 'always',
  },
  markdown: {
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      defaultColor: false,
    },
  },
  integrations: [
    tailwind({
      applyBaseStyles: false,
    }),
    sitemap({
      filter: (page) => !new URL(page).pathname.startsWith('/proto/'),
      serialize: (item) => {
        const modifiedDate = sitemapLastModified.get(new URL(item.url).pathname);
        return modifiedDate
          ? { ...item, lastmod: new Date(`${modifiedDate}T00:00:00.000Z`) }
          : item;
      },
    }),
  ],
});
