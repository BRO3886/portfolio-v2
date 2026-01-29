# Prepare for Task

Review the codebase state, established patterns, recent work, and project context to prepare for taking on new tasks.

## What This Does

This command helps Claude get fully oriented by:
1. Reviewing git history to understand recent work
2. Reading journal entries to understand session context
3. Analyzing codebase patterns and architecture
4. Checking project documentation (CLAUDE.md)
5. Identifying current state and established conventions

## Steps

### 1. Review Recent Git History
Check the last 10-15 commits to understand:
- What features were recently added
- What bugs were recently fixed
- Current development trajectory
- Commit message patterns and style

```bash
git log --oneline -15
git log -5 --stat
```

### 2. Read Recent Journal Entries
Check `journal/` directory for recent session notes:
- Read the 3 most recent journal files
- Understand what was worked on
- Note any blockers or decisions made
- Identify context from previous sessions

### 3. Review Project Documentation
Read key documentation files:
- `CLAUDE.md` - Project context and patterns
- `README.md` (if exists) - Setup and overview
- `package.json` - Dependencies and scripts

### 4. Analyze Codebase Patterns

#### File Structure
```bash
# Get overview of project structure
ls -la
find src -type f -name "*.astro" -o -name "*.ts" -o -name "*.tsx" | head -20
```

#### Key Areas to Understand
- **Content structure**: How blog posts and content are organized (`src/content/`)
- **Layout patterns**: Base layouts and page templates (`src/layouts/`)
- **Styling approach**: Theme system, CSS patterns (`src/styles/theme.css`)
- **Type definitions**: Check `src/lib/` for type definitions and utilities
- **Configuration**: `astro.config.mjs`, `tailwind.config.mjs`, `tsconfig.json`

#### Code Patterns
Look for:
- Component structure and naming conventions
- TypeScript patterns and type usage
- CSS class naming and theme variable usage
- Import patterns and module organization

### 5. Check Current State

#### Uncommitted Changes
```bash
git status
git diff --stat
```

#### Development Environment
```bash
# Check if dependencies are up to date
npm outdated
```

### 6. Synthesize Understanding

After gathering information, create a mental model of:
- **Current state**: What's the latest work? Any in-progress features?
- **Architecture**: How is the codebase organized? What are the key patterns?
- **Conventions**: What coding styles and patterns are established?
- **Context**: What's the project direction? What are the goals?
- **Constraints**: Any non-negotiables or rules from CLAUDE.md?

## Output Format

Provide a concise summary covering:

1. **Recent Work** (from git history and journals)
   - Last 3-5 major changes
   - Current development phase

2. **Established Patterns**
   - Architecture overview
   - Key conventions and patterns
   - Tech stack summary

3. **Current State**
   - Any uncommitted changes
   - In-progress work
   - Known issues or TODOs

4. **Ready for Tasks**
   - Confirmation of understanding
   - Areas of the codebase understood
   - Ready to take on new work

## Usage

When invoked, Claude should:
1. Execute the review steps above
2. Read and analyze all relevant files and history
3. Provide a structured summary
4. Indicate readiness to take on new tasks with full context

This ensures Claude has comprehensive understanding before starting new work, reducing context-switching and improving code quality.
