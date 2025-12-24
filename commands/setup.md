# RAG Memory Setup Command

When the user runs `/rag-memory setup`, follow these steps:

## Step 1: Detect Project Info

```bash
# Get project name
cat package.json 2>/dev/null | jq -r '.name // empty' || basename $(pwd)
```

## Step 2: Check for Existing Config

```bash
cat .claude/rag-memory.json 2>/dev/null
```

If exists, ask if they want to reconfigure.

## Step 3: Check for Existing Convex Backend

Look for signs of Convex in the project:
```bash
ls convex/ 2>/dev/null
cat .env.local 2>/dev/null | grep CONVEX
```

## Step 4: Setup Options

Present to user:

### Option A: Use Existing Convex (if detected)
If this project already has Convex:
1. Add the ragMemories table to existing schema
2. Add the ragMemories.ts functions
3. Deploy with `npx convex dev`

### Option B: Create Dedicated RAG Backend
If no Convex or user prefers separate:
1. Create a new directory for the RAG backend
2. Initialize Convex there
3. This keeps RAG separate from project code

### Option C: Use Shared Backend
If user has an existing RAG backend (from another project):
1. Just need the Convex deployment URL
2. Configure with a unique projectId

## Step 5: Convex Setup (if needed)

### For New Backend:

```bash
# User runs these commands:
mkdir rag-memory-backend
cd rag-memory-backend
npm init -y
npm install convex
npx convex dev
```

### Add Schema:

Create `convex/schema.ts`:
```typescript
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  ragMemories: defineTable({
    projectId: v.string(),
    sessionId: v.optional(v.string()),
    type: v.union(
      v.literal('decision'),
      v.literal('code_pattern'),
      v.literal('progress'),
      v.literal('blocker'),
      v.literal('context'),
      v.literal('file_summary'),
      v.literal('conversation')
    ),
    title: v.string(),
    content: v.string(),
    tags: v.array(v.string()),
    embedding: v.array(v.float64()),
    createdAt: v.number()
  })
    .index('by_project', ['projectId'])
    .index('by_type', ['projectId', 'type'])
    .vectorIndex('by_embedding', {
      vectorField: 'embedding',
      dimensions: 1536,
      filterFields: ['projectId', 'type']
    })
});
```

### Add Functions:

Copy the content from `templates/convex/ragMemories.ts` to `convex/ragMemories.ts`

### Set OpenAI Key:

```bash
npx convex env set OPENAI_API_KEY sk-your-key-here
```

### Get Deployment URL:

After `npx convex dev`, the URL is shown:
```
Convex functions ready!
https://your-deployment-123.convex.cloud
```

## Step 6: Create Configuration

In the USER'S PROJECT (not the Convex backend), create `.claude/rag-memory.json`:

```json
{
  "projectId": "<detected-project-name>",
  "convexUrl": "<deployment-url-from-step-5>",
  "autoLoad": true,
  "createdAt": "<timestamp>",
  "version": "1.0.0"
}
```

## Step 7: Initial Context Capture

Offer to extract initial project context:

1. **From README.md**: Project description, purpose, setup instructions
2. **From package.json**: Name, dependencies, what the project does
3. **From directory structure**: Key folders, architecture hints

Ask user if they want to store this as initial memories.

## Step 8: Confirm Success

```
RAG Memory Initialized!
=======================

Project ID: <name>
Backend: Convex @ <url>
Config: .claude/rag-memory.json

Commands available:
  /rag-memory load    # Load context at session start
  /rag-memory save    # Save current session
  /rag-memory status  # Check configuration

Initial context: <stored/skipped>

Tip: Run "/rag-memory load" at the start of each new session!
```

## Convex HTTP API Reference

For the load/save commands to work, they'll use Convex HTTP API:

### Store Memory
```bash
curl -X POST "https://<deployment>.convex.cloud/api/action" \
  -H "Content-Type: application/json" \
  -d '{
    "path": "ragMemories:store",
    "args": {
      "projectId": "...",
      "type": "decision",
      "title": "...",
      "content": "...",
      "tags": []
    }
  }'
```

### Search Memories
```bash
curl -X POST "https://<deployment>.convex.cloud/api/action" \
  -H "Content-Type: application/json" \
  -d '{
    "path": "ragMemories:search",
    "args": {
      "projectId": "...",
      "query": "...",
      "limit": 5
    }
  }'
```

### Get Recent
```bash
curl -X POST "https://<deployment>.convex.cloud/api/query" \
  -H "Content-Type: application/json" \
  -d '{
    "path": "ragMemories:getRecent",
    "args": {
      "projectId": "...",
      "limit": 10
    }
  }'
```
