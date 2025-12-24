# RAG Memory Load Command

When the user runs `/rag-memory load` or `/rag-memory load [topic]`, execute the full RAG retrieval and injection.

## Step 1: Load Configuration

```bash
cat .claude/rag-memory.json
```

Extract: `projectId`, `convexUrl`

If config not found:
```
RAG Memory not configured for this project.
Run /rag-memory setup first.
```

## Step 2: Retrieve Context

### General Load (no topic)

Fetch recent memories using Convex HTTP API:

```bash
curl -s -X POST "${convexUrl}/api/query" \
  -H "Content-Type: application/json" \
  -d '{
    "path": "contextMemories:getRecent",
    "args": {
      "projectId": "<projectId>",
      "limit": 10
    }
  }'
```

### Topic-Specific Load

Perform semantic search:

```bash
curl -s -X POST "${convexUrl}/api/action" \
  -H "Content-Type: application/json" \
  -d '{
    "path": "contextMemories:search",
    "args": {
      "projectId": "<projectId>",
      "query": "<user-topic>",
      "limit": 5
    }
  }'
```

## Step 3: Process Results

Parse the JSON response. Each memory has:
- `type`: decision, code_pattern, progress, blocker, context, file_summary, conversation
- `title`: Short description
- `content`: Full details
- `tags`: Keywords
- `score`: (for search only) Relevance score 0-1

## Step 4: Inject Context (THE RAG PART)

This is the critical step that makes it RAG, not just search.

### Format as Context Block

Present the retrieved memories in a structured format that becomes part of the conversation:

```markdown
## Project Context (Retrieved from RAG Memory)

The following context was retrieved from previous sessions. I will use this to inform my responses.

### Decisions in Effect
{{#each decisions}}
- **{{title}}**: {{content summary}}
{{/each}}

### Established Patterns
{{#each code_patterns}}
- **{{title}}**: {{content summary}}
{{/each}}

### Current State
{{#each progress}}
- **{{title}}**: {{content summary}}
{{/each}}

### Known Issues
{{#each blockers}}
- **{{title}}**: {{content summary}}
{{/each}}

### Project Context
{{#each context}}
- **{{title}}**: {{content summary}}
{{/each}}

---
```

### Commit to Using Context

After presenting, explicitly acknowledge:
```
I've loaded context from previous sessions. I will:
- Follow the decisions and patterns established
- Build upon the current progress
- Keep known blockers in mind
- Apply project-specific knowledge

What would you like to work on?
```

## Step 5: Display Summary

```
RAG Context Loaded
==================
Project: <projectId>
Retrieved: <N> memories

Decisions (<count>):
  • <title>
  • <title>

Patterns (<count>):
  • <title>

Progress (<count>):
  • <title>

Blockers (<count>):
  • <title>

I'm ready to continue with full context. What's next?
```

## RAG Behavior After Load

Once context is loaded, Claude should naturally:

1. **Reference decisions** - "Since you chose X..."
2. **Follow patterns** - "Using your established pattern for..."
3. **Acknowledge progress** - "Building on the completed auth system..."
4. **Warn about blockers** - "Note: there's a known issue with..."
5. **Apply context** - Use project-specific knowledge without asking

## Error Handling

### Backend Unreachable
```
Could not connect to RAG backend at ${convexUrl}
- Is the Convex deployment active?
- Check your internet connection
- Verify the URL in .claude/rag-memory.json
```

### No Memories Found
```
No context found for project "${projectId}"
This might be a new project or context hasn't been saved yet.
Use /rag-memory save after making progress to store context.
```

### Invalid Config
```
Invalid configuration in .claude/rag-memory.json
Required fields: projectId, convexUrl
Run /rag-memory setup to reconfigure.
```

## Topic Search Examples

```
/rag-memory load authentication
→ Searches for memories related to auth, login, sessions, etc.

/rag-memory load database
→ Searches for memories about DB, schema, queries, etc.

/rag-memory load frontend architecture
→ Searches for UI framework decisions, component patterns, etc.
```

The semantic search understands meaning, not just keywords.
