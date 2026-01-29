# PostHog Analytics

Privacy-first analytics with cookieless tracking, GDPR compliance, and Do Not Track respect.

## Configuration

- **Persistence**: `memory` (no cookies, no localStorage)
- **Person profiles**: `identified_only`
- **IP tracking**: disabled
- **Do Not Track**: respected
- **Session replay**: enabled, masks inputs and `.prose` text
- **Autocapture**: clicks only, restricted to `<a>`, `<button>`, and `[data-ph-capture]` elements
- **Page leave**: enabled

## Currently Tracked

### Custom Events

| Event | Location | Trigger | Properties |
|---|---|---|---|
| `theme_toggle` | BaseLayout | User clicks theme toggle | `new_theme` (`light` \| `dark`) |
| `copy_email` | Homepage | User clicks "Get in Touch" CTA | — |
| `copy_markdown` | BlogPostLayout | User clicks "Markdown" copy button | `blog_title`, `blog_url` |
| `blog_scroll_depth` | BlogPostLayout | User scrolls to 25/50/75/90/100% | `depth_percent`, `blog_title`, `blog_url` |
| `outbound_link_click` | BaseLayout | User clicks external link | `url`, `link_text` |
| `blog_post_click` | Homepage / Blog index | User clicks a blog post link | `post_title`, `source` (`homepage` \| `blog_index`) |
| `blog_time_on_page` | BlogPostLayout | User leaves blog post (tab hidden / navigate away) | `seconds_spent`, `blog_title`, `blog_url` |
| `blog_bounce` | BlogPostLayout | User leaves before reaching 25% scroll | `blog_title`, `blog_url` |

### Autocapture (built-in)

- All clicks on `<a>` and `<button>` elements
- All clicks on elements with `data-ph-capture` attribute
- Page leave events

### Session Replay

- All sessions recorded
- Inputs masked
- Blog prose text masked

## Ideas for Additional Tracking

### High Value

| Event | Where | Why |
|---|---|---|
| `project_card_click` | Homepage | Which projects get the most interest? Track `project_name` and `project_url` |
| `work_entry_click` | Homepage | Which companies attract clicks? Track `company_name` |
| `cta_visible` | Homepage | Is the hero CTA actually seen? Intersection Observer on the "Get in Touch" button |

### Content Engagement

| Event | Where | Why |
|---|---|---|
| `code_block_copy` | BlogPostLayout | Are readers copying code snippets? Track which block (index or language) |
| `heading_visible` | BlogPostLayout | Which sections are actually read? Intersection Observer on `h2` headings to track `heading_text` |

### Navigation Patterns

| Event | Where | Why |
|---|---|---|
| `nav_click` | BaseLayout | Which nav items are used? Track `destination` (Home, Blog) |
| `footer_social_click` | BaseLayout | Which social links get clicks? Already partially covered by `outbound_link_click` but could track `social_platform` specifically |
| `scroll_to_section` | Homepage | How far do homepage visitors scroll? Similar approach to blog scroll depth |

### Technical / Performance

| Event | Where | Why |
|---|---|---|
| `page_performance` | BaseLayout | Track Core Web Vitals (LCP, FID, CLS) via `web-vitals` library |
| `error_boundary` | BaseLayout | Track any client-side JS errors via `window.onerror` |

## Implementation Notes

- All `posthog.capture()` calls must be guarded with `if (window.posthog)`
- Use vanilla JS only (no framework dependencies) — all tracking is in `<script is:inline>` blocks
- Keep scroll/intersection tracking throttled via `requestAnimationFrame`
- Add `data-ph-capture` attribute to any element that should be autocaptured beyond `<a>` and `<button>`

## Files

| File | What it tracks |
|---|---|
| `src/components/PostHog.astro` | Initialization and config |
| `src/layouts/BaseLayout.astro` | Theme toggle, outbound links |
| `src/pages/index.astro` | Copy email, blog post click (homepage) |
| `src/pages/blog/index.astro` | Blog post click (blog index) |
| `src/layouts/BlogPostLayout.astro` | Copy markdown, scroll depth, time on page, bounce |
