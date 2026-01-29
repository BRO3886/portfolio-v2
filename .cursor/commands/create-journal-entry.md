# Create Journal Entry

Create a new journal entry in the `journal/` directory using the token-efficient format.

## Critical Rules

1. **Date File Management**:
   - Get current date: `date +%d-%m-%y`
   - **ALWAYS check if file exists** matching `*-DD-MM-YY-done.md`
   - If file exists for today: **APPEND** to existing file with `---` separator
   - If new day: Create new file with incremented sequence number
   - **NO DUPLICATE DATE FILES** - strict enforcement required

2. **File Naming Convention**:
   - Format: `NNN-DD-MM-YY-done.md`
   - NNN = 3-digit sequence number with leading zeros (001, 002, 003, etc.)
   - Example: `001-28-01-26-done.md`

3. **Sequence Numbering**:
   - Find highest existing sequence number in `journal/` directory
   - Increment by 1 for new date file
   - Use leading zeros to ensure 3 digits
   - If no files exist, start with `001`

4. **Entry Format**:
   - Always end each entry with `---` separator
   - Token-efficient format for AI consumption
   - Use compact file notation: `+` (created), `~` (modified), `-` (deleted)

## Content Guidelines

### Structure

```markdown
## [Brief Title - Category]

[1-2 sentence overview focusing on "what" not "how"]

+ path/to/new/file.tsx
~ path/to/modified/file.css
- path/to/deleted/file.js

---
```

### Portfolio-Specific Categories

- Component implementation
- Styling updates
- Asset integration
- Page creation
- Routing configuration
- Performance optimization
- Build/deployment setup
- Content updates
- Configuration changes

### Portfolio-Specific Guidance

- **Component work**: Note which components were created/modified
- **Styling**: Mention approach (CSS modules, Tailwind, styled-components, etc.)
- **Assets**: Include image/font/icon additions
- **Configuration**: Note build config, routing, or deployment changes
- Use relative paths from project root
- Focus on what changed, not implementation details

## Example Entries

### Component Implementation
```markdown
## Hero component implementation

Created responsive hero section with animation and CTA buttons.

+ src/components/Hero.tsx
+ src/styles/hero.css
~ src/pages/index.tsx

---
```

### Styling Update
```markdown
## Dark mode theme support

Added dark mode CSS variables and theme toggle functionality.

+ src/styles/themes.css
~ src/components/Header.tsx
~ src/utils/theme.ts

---
```

### Asset Integration
```markdown
## Project images and icons

Added project screenshots and technology icons to assets.

+ public/images/project-1.png
+ public/images/project-2.png
+ public/icons/react.svg
+ public/icons/typescript.svg

---
```

### Configuration Change
```markdown
## Build configuration for image optimization

Configured Next.js image optimization and compression settings.

~ next.config.js
~ package.json

---
```

## Implementation Steps

1. **Get current date**:
   ```bash
   date +%d-%m-%y
   ```

2. **Check for existing file for today**:
   ```bash
   ls journal/*-$(date +%d-%m-%y)-done.md 2>/dev/null
   ```

3. **If file exists**:
   - Open existing file
   - Append new entry at end
   - Ensure `---` separator between entries

4. **If new day (no file exists)**:
   - Find highest sequence number:
     ```bash
     ls journal/*.md 2>/dev/null | sed 's/.*\///;s/-.*//' | sort -n | tail -1
     ```
   - Increment sequence number
   - Format with leading zeros (printf "%03d")
   - Create new file: `journal/NNN-DD-MM-YY-done.md`

5. **Write entry**:
   - Use token-efficient format
   - Include relevant file changes
   - End with `---` separator

## Token Efficiency Guidelines

- Brief overview: 1-2 sentences max
- No redundant words ("I implemented", "We added", etc.)
- Focus on "what" not "how"
- Use shorthand notation for files
- Relative paths from project root
- Compact format optimized for AI parsing

## Notes

- Journal entries are for AI context, not human documentation
- Keep entries concise and factual
- Always use `---` separator (enables easy parsing)
- File notation is standardized: `+` (new), `~` (modified), `-` (deleted)
- Multiple entries per day are appended to same file
- No duplicate date files allowed
