# portfolio-v2

Personal portfolio and blog at [sidv.dev](https://sidv.dev).

## Architecture

Static site built with **Astro 5.x** and deployed to **Cloudflare Pages**. All pages are pre-rendered at build time — no server-side runtime.

```
src/
├── components/
│   ├── CopyButton.astro       # Reusable copy-to-clipboard button (ghost/primary variants)
│   └── PostHog.astro           # Analytics component (cookieless, GDPR-compliant)
├── content/
│   ├── blog/                   # Markdown blog posts with frontmatter
│   └── config.ts               # Astro content collection schema
├── layouts/
│   ├── BaseLayout.astro        # Shell: head, nav, footer, theme toggle, SEO meta, JSON-LD
│   └── BlogPostLayout.astro    # Blog post template with prose styling, copy-markdown button
├── lib/
│   └── content.ts              # Typed data: WorkEntry[], ProjectEntry[], SocialLink[]
├── pages/
│   ├── index.astro             # Homepage: hero, recent posts, projects grid, work timeline
│   ├── index.md.ts             # Homepage as markdown (for LLMs)
│   ├── llms.txt.ts             # llms.txt spec — curated site map for AI
│   ├── llms-full.txt.ts        # Full site content as plain text for AI
│   ├── 404.astro               # Meta-refresh redirect to /
│   └── blog/
│       ├── index.astro         # Blog listing page
│       ├── index.md.ts         # Blog listing as markdown
│       ├── [slug].astro        # Blog post page (dynamic route)
│       └── [slug].md.ts        # Blog post as raw markdown
└── styles/
    └── theme.css               # CSS custom properties, font faces, Tailwind directives
```

### Key design decisions

- **All CSS inlined** (`build.inlineStylesheets: 'always'`) — eliminates render-blocking stylesheets
- **Theme system** — dual light (paper) / dark (charcoal) themes via `[data-theme="dark"]` attribute. Dark is default. Theme script runs before any `<style>` tags to prevent FOUC
- **Colors** — all defined as CSS custom properties in `theme.css`, mapped to Tailwind via `tailwind.config.mjs`. No hardcoded color values in components
- **Fonts** — Source Sans 3 (UI), Lora (blog prose), JetBrains Mono (code). Variable fonts with preloading
- **Content** — work experience and projects live in `src/lib/content.ts` as typed arrays. Blog posts use Astro content collections (Markdown + frontmatter)
- **SEO** — Open Graph, Twitter cards, canonical URLs, JSON-LD (Person on homepage, Article on posts), sitemap
- **Analytics** — PostHog with `persistence: 'memory'`, no cookies, respects DNT
- **LLM endpoints** — `/llms.txt`, `/llms-full.txt`, and `.md` variants of all pages auto-generated from content at build time

## Local development

### Prerequisites

- Node.js 18+
- npm

### Setup

```bash
npm install
npm run dev
```

Dev server runs at http://localhost:4321.

### Build

```bash
npm run build
```

Output goes to `dist/`. The build pre-renders all pages and API endpoints as static files.

### Deploy

```bash
bash scripts/deploy.sh
```

Builds and deploys to Cloudflare Pages in one step. Requires `wrangler` CLI to be authenticated.

### Adding a blog post

Create a new `.md` file in `src/content/blog/`:

```markdown
---
title: "Post Title"
description: "Short description"
pubDate: 2026-01-30
tags: ["tag1", "tag2"]
author: "Siddhartha Varma"
---

Post content here.
```

The `slug` is derived from the filename unless overridden in frontmatter. Draft posts (`draft: true`) are excluded from production builds. The llms.txt and .md endpoints pick up new posts automatically at build time.
