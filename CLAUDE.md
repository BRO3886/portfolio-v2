# Non-Negotiables

⚠️ **Critical Rules - Always Follow**

1. **NO README files without explicit request**
   - Do not create README.md files in any directory unless the user explicitly asks

2. **NO Summary documents without explicit request**
   - Do not create summary files like "SUMMARY.md", "IMPLEMENTATION_SUMMARY.md", etc.

3. **NEVER create placeholders, TODOs, or mock data** without explicit user request
   - Always implement complete, production-ready code
   - Ask user first if shortcuts are needed

---

# Project Overview

**Portfolio V2** - Personal portfolio website showcasing projects and skills

## Purpose

A modern, responsive portfolio website to showcase professional work, projects, and technical skills.

## Architecture

Static site generator (SSG) with pre-rendering at build time. Blog posts are written in Markdown with frontmatter and rendered to static HTML during the build process. Deployed on Cloudflare Workers for global edge distribution.

## Tech Stack

### Core Technologies

- **Astro 5.x** - Static site generator optimized for content-focused websites
- **TypeScript** - Type-safe development with strictest configuration
- **Tailwind CSS** - Utility-first CSS framework with custom theme system
- **Markdown** - Content authoring with frontmatter for blog posts

### Infrastructure

- **Cloudflare Workers** - Serverless edge deployment
- **Cloudflare Pages** - Static asset hosting and CDN

### Development Tools

- **Vite** - Build tool and dev server (via Astro)
- **PostCSS** - CSS processing (via Tailwind)

## Directory Structure

```
portfolio-v2/
├── src/
│   ├── content/
│   │   ├── blog/          # Blog posts in Markdown
│   │   └── config.ts      # Content collections schema
│   ├── layouts/
│   │   ├── BaseLayout.astro      # Base HTML layout
│   │   └── BlogPostLayout.astro  # Blog post template
│   ├── pages/
│   │   ├── blog/
│   │   │   ├── [slug].astro      # Dynamic blog post route
│   │   │   └── index.astro       # Blog list page
│   │   └── index.astro           # Homepage
│   └── styles/
│       └── theme.css      # Theme system with CSS custom properties
├── public/
│   ├── favicon.svg
│   └── robots.txt
├── .cursor/
│   └── commands/
├── .claude/
├── journal/
├── astro.config.mjs       # Astro configuration
├── tailwind.config.mjs    # Tailwind configuration
├── tsconfig.json          # TypeScript configuration
└── wrangler.toml          # Cloudflare Workers configuration
```

## Development Guidelines

### Code Style
- TypeScript with strict mode enabled
- ESLint and Prettier configurations as set by Astro defaults
- CSS custom properties for theming (no hardcoded colors)

### Component Patterns
- Astro components for layouts and pages
- Content collections for blog posts
- SEO meta tags in BaseLayout
- Responsive design with Tailwind breakpoints

### Theme System
- All colors defined as CSS custom properties in `src/styles/theme.css`
- HSL color format for easy manipulation
- Dark mode support via `[data-theme="dark"]` attribute
- Semantic color tokens: primary, secondary, accent, surface, text hierarchy
- Design system includes spacing, typography, shadows, and border radius

### Blog System
- Blog posts in `src/content/blog/` as Markdown files
- Frontmatter schema: title, description, pubDate, slug (optional), tags, draft, author, image
- Slug can be specified in frontmatter or derived from filename
- Draft posts are filtered from production builds

<!-- CONTEXT_START -->

## Current Context

**Last Updated**: 29 Jan 2026

### Active Work
- Homepage polish: hero statement heading, "Get in Touch" clipboard CTA, "Blog" secondary button
- Blog post typography tuning — prose heading hierarchy fixed, Shiki dual-theme syntax highlighting working

### Architectural Decisions
- **Content management**: `src/lib/content.ts` centralizes typed work experience (`WorkEntry` with multi-role support) and social links — blog stays in Markdown content collections
- **Theme system**: Dual light (paper) / dark (charcoal) via `[data-theme="dark"]` on `<html>`, localStorage persistence, FOUC prevention script
- **Fonts**: Source Sans 3 (sans, UI), Lora (serif, blog prose), JetBrains Mono (code) — all variable fonts with preloading
- **Accent color**: Warm amber/ochre (`hsl(36 55% 45%)` light, `hsl(36 55% 58%)` dark)
- **Layout width**: `max-w-4xl mx-auto px-6` for all pages

### Established Patterns
- CSS custom properties in `theme.css` for all colors — no hardcoded values
- Shiki dual-theme via `:root:not([data-theme="dark"])` / `:root[data-theme="dark"]` selectors with `--shiki-light` / `--shiki-dark` variables
- Work timeline: left-edge accent line, dot markers, bordered cards with hover lift, staggered fade-in animation
- Toast notifications: lightweight inline `<div>` with CSS transitions, no dependencies

### Next Steps
- Write real blog content replacing placeholder posts
- Add more work experience descriptions
- Configure custom domain and deployment pipeline
- Consider adding project showcase section with real projects

<!-- CONTEXT_END -->

## Setup Instructions

### Prerequisites
- Node.js 18+ or 20+
- npm or yarn

### Installation
```bash
npm install
```

### Running Locally
```bash
npm run dev
```

Visit http://localhost:4321

### Building for Production
```bash
npm run build
```

Output will be in `dist/` directory

### Deploying to Cloudflare
```bash
npm run build
wrangler pages publish dist
```

Or set up GitHub Actions workflow for automatic deployments.
