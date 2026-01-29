# Sync Context to CLAUDE.md

Read all journal entries from the `journal/` directory and synthesize a concise context summary, then update the CLAUDE.md file between the context markers.

## Purpose

Maintain an up-to-date project context in CLAUDE.md that provides AI assistants with:
- Recent work and rationale
- Architectural decisions made
- Established patterns and conventions
- Current blockers or issues
- Logical next steps

## Process

1. **Read Journal Entries**:
   - Check if `journal/` directory exists
   - Read ALL journal files sorted by date and sequence number
   - Parse entries to understand project evolution

2. **Synthesize Context** (max 300 tokens):
   - **Active Work**: What's currently being worked on and why
   - **Architectural Decisions**: Key technical choices made
   - **Patterns/Conventions**: Established code patterns to follow
   - **Blockers**: Open issues or blockers requiring attention
   - **Next Steps**: Logical next actions based on current state

3. **Update CLAUDE.md**:
   - Locate markers: `<!-- CONTEXT_START -->` and `<!-- CONTEXT_END -->`
   - Replace content between markers with synthesized context
   - Preserve all content outside markers
   - Maintain markdown formatting

## Context Format

```markdown
<!-- CONTEXT_START -->

## Current Context

**Last Updated**: [Current Date]

### Active Work
- [Brief summary of recent work and current focus]

### Architectural Decisions
- [Key technical decisions and rationale]

### Established Patterns
- [Code patterns, conventions, and standards being followed]

### Open Blockers
- [Current issues, blockers, or questions needing resolution]

### Next Steps
- [Logical next actions based on current state]

<!-- CONTEXT_END -->
```

## Implementation Steps

1. **Check for journal directory**:
   ```bash
   if [ ! -d "journal" ]; then
     echo "No journal directory found"
     exit 0
   fi
   ```

2. **Read all journal entries**:
   ```bash
   # Sort by sequence number and date
   ls journal/*.md | sort -t- -k1,1n -k2,2n -k3,3n -k4,4n
   ```

3. **Synthesize context**:
   - Analyze all entries to understand project evolution
   - Identify patterns, decisions, and current state
   - Generate concise summary (under 300 tokens)
   - Focus on actionable information for AI assistants

4. **Update CLAUDE.md**:
   - Read current CLAUDE.md content
   - Find `<!-- CONTEXT_START -->` and `<!-- CONTEXT_END -->` markers
   - Replace content between markers
   - Write updated content back to CLAUDE.md
   - Verify markers still exist after update

5. **Verify update**:
   - Confirm CLAUDE.md was updated successfully
   - Check that content outside markers was preserved
   - Validate markdown formatting

## Token Efficiency

- Keep context under 300 tokens
- Focus on recent and relevant information
- Use bullet points for clarity
- Avoid redundant explanations
- Prioritize actionable insights

## Error Handling

- If `journal/` doesn't exist, skip with message
- If CLAUDE.md doesn't exist, create with markers
- If markers missing, add them at end of file
- Preserve all content outside markers

## Notes

- Context is synthesized from ALL journal entries, not just recent ones
- Old entries inform architectural decisions and patterns
- Recent entries inform active work and next steps
- Context helps maintain consistency across sessions
- Regular syncing keeps AI assistants aligned with project state
