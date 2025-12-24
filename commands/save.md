# RAG Memory Save Command

When the user runs `/rag-memory save`, analyze the current session and extract valuable context to preserve.

## Step 1: Load Configuration

```bash
cat .claude/rag-memory.json
```

Extract: `projectId`, `convexUrl`

If not configured:
```
RAG Memory not configured. Run /rag-memory setup first.
```

## Step 2: Analyze Current Session

Review the entire conversation and identify valuable context:

### What to Extract

| Type | Look For |
|------|----------|
| `decision` | "let's use X", "chose X because", "decided on", technology picks |
| `code_pattern` | Reusable code created, conventions established, naming patterns |
| `progress` | Features completed, files created, "now working", milestones |
| `blocker` | Errors unresolved, "need to", pending questions, limitations |
| `context` | User preferences, project requirements, business logic explained |
| `file_summary` | New files and their purposes, important file modifications |
| `conversation` | Important clarifications, user corrections, preference statements |

### What NOT to Save

- Trivial exchanges ("hello", "thanks")
- Temporary debugging that's resolved
- Code that was immediately reverted
- Questions without conclusions

## Step 3: Format Memories

For each item, create a memory object:

```json
{
  "type": "decision|code_pattern|progress|blocker|context|file_summary|conversation",
  "title": "Short title (max 50 chars)",
  "content": "Detailed explanation with context, reasoning, code snippets if relevant",
  "tags": ["searchable", "keywords", "for", "retrieval"]
}
```

### Writing Good Memories

**Good:**
```json
{
  "type": "decision",
  "title": "PostgreSQL over MongoDB",
  "content": "Chose PostgreSQL for the main database. Reasons: ACID compliance needed for financial data, team familiarity, excellent Prisma support. MongoDB considered but relational model fits better.",
  "tags": ["database", "postgresql", "architecture", "decision"]
}
```

**Bad:**
```json
{
  "type": "decision",
  "title": "Database",
  "content": "Using postgres",
  "tags": ["db"]
}
```

## Step 4: Store Memories

Use Convex HTTP API to store each memory:

```bash
curl -s -X POST "${convexUrl}/api/action" \
  -H "Content-Type: application/json" \
  -d '{
    "path": "ragMemories:store",
    "args": {
      "projectId": "<projectId>",
      "sessionId": "<generated-session-id>",
      "type": "<type>",
      "title": "<title>",
      "content": "<content>",
      "tags": ["<tags>"]
    }
  }'
```

For multiple memories, make multiple calls or batch if supported.

## Step 5: Report Results

```
Context Saved
=============
Session: <session-id>
Project: <projectId>

Saved <N> memories:

Decisions:
  ✓ PostgreSQL over MongoDB
  ✓ REST API structure

Patterns:
  ✓ Error handling middleware

Progress:
  ✓ User authentication complete
  ✓ Dashboard layout done

Blockers:
  ⚠ Email service not configured

Context:
  ✓ Multi-tenant architecture requirements

These will be available via /rag-memory load in future sessions.
```

## Extraction Guidelines

### Aim for Quality Over Quantity
- 3-10 memories per save is ideal
- Each memory should be valuable standalone
- Future you should understand it without context

### Prioritize
If many things happened:
1. **Decisions** - Hardest to recreate, save first
2. **Blockers** - Need attention next session
3. **Patterns** - Easy to forget specifics
4. **Progress** - Useful for continuity
5. **Context** - Nice to have

### Be Specific
```
Bad:  "Set up the backend"
Good: "Created Express server with TypeScript. Routes in /routes,
       middleware in /middleware. Using Zod for validation.
       Error handler returns { error, code, details } format."
```

### Include Reasoning
```
Bad:  "Using Tailwind"
Good: "Chose Tailwind over styled-components. Faster development,
       smaller bundle with purging, team knows it. Trade-off:
       HTML can get cluttered, using @apply for complex components."
```

## Example Full Extraction

From a session about building an API:

```json
[
  {
    "type": "decision",
    "title": "Express with TypeScript",
    "content": "Using Express 4.x with TypeScript for the API. Considered Fastify (faster) and Hono (modern) but Express has better ecosystem and team familiarity. TypeScript for type safety.",
    "tags": ["backend", "express", "typescript", "api", "framework"]
  },
  {
    "type": "code_pattern",
    "title": "Route Handler Pattern",
    "content": "Routes follow: router.method('/path', validate(schema), asyncHandler(controller)). Validation with Zod schemas in /schemas. Controllers in /controllers return { data } or throw ApiError.",
    "tags": ["routing", "validation", "patterns", "express"]
  },
  {
    "type": "progress",
    "title": "Auth Endpoints Complete",
    "content": "Implemented: POST /auth/register, POST /auth/login, POST /auth/refresh, GET /auth/me. Using JWT with 15min access / 7day refresh tokens. Passwords hashed with bcrypt.",
    "tags": ["auth", "jwt", "api", "complete"]
  },
  {
    "type": "blocker",
    "title": "Rate Limiting Not Configured",
    "content": "Need to add rate limiting before production. Options: express-rate-limit (simple) or redis-based (scalable). Decision deferred until load testing.",
    "tags": ["security", "rate-limit", "todo", "production"]
  }
]
```

## When Context is Full

If user mentions context is full or session is getting long:

1. **Prioritize critical items** - Decisions and blockers first
2. **Summarize verbose content** - Condense but keep specifics
3. **Encourage fresh session** - "Context saved. Consider starting fresh and running /rag-memory load"
