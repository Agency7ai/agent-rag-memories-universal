# RAG Memory Status Command

When the user runs `/rag-memory status`, show the current state of the RAG system.

## Step 1: Check Configuration

```bash
cat .claude/rag-memory.json 2>/dev/null
```

If not found:
```
RAG Memory Status
=================
Status: NOT CONFIGURED

This project doesn't have RAG memory set up yet.
Run /rag-memory setup to initialize.
```

## Step 2: Parse Configuration

Extract from config:
- `projectId`
- `convexUrl`
- `autoLoad`
- `createdAt`

## Step 3: Test Backend Connection

```bash
curl -s -X POST "${convexUrl}/api/query" \
  -H "Content-Type: application/json" \
  -d '{
    "path": "ragMemories:getRecent",
    "args": {
      "projectId": "<projectId>",
      "limit": 1
    }
  }'
```

Check if response is valid JSON.

## Step 4: Get Memory Stats

```bash
curl -s -X POST "${convexUrl}/api/query" \
  -H "Content-Type: application/json" \
  -d '{
    "path": "ragMemories:listByProject",
    "args": {
      "projectId": "<projectId>",
      "limit": 100
    }
  }'
```

Count memories by type.

## Step 5: Display Status

```
RAG Memory Status
=================

Configuration
  Project ID: <projectId>
  Backend: Convex
  URL: <convexUrl>
  Config: .claude/rag-memory.json
  Created: <date>

Connection
  Status: ✓ Connected (or ✗ Unreachable)

Stored Memories: <total>
  ├─ Decisions:      <count>
  ├─ Code Patterns:  <count>
  ├─ Progress:       <count>
  ├─ Blockers:       <count>
  ├─ Context:        <count>
  ├─ File Summaries: <count>
  └─ Conversations:  <count>

Settings
  Auto-load: <yes/no>

Commands
  /rag-memory load     Load context
  /rag-memory save     Save current session
  /rag-memory clear    Delete all memories
```

## Optional: Recent Memories

If user wants detail:

```
Recent Memories
───────────────
1. [decision] Stack Auth for Authentication
   "Chose Stack Auth over Auth0..."
   Tags: auth, stack-auth
   Saved: 2 hours ago

2. [progress] API Routes Complete
   "All CRUD endpoints for users..."
   Tags: api, complete
   Saved: 3 hours ago

3. [blocker] Email Service Pending
   "Need SMTP configuration..."
   Tags: email, todo
   Saved: 1 day ago
```

## Error States

### Backend Unreachable
```
RAG Memory Status
=================

Configuration
  Project ID: my-app
  Backend: Convex
  URL: https://example.convex.cloud

Connection
  Status: ✗ UNREACHABLE

  Could not connect to the backend.
  Possible causes:
  - Convex deployment is paused/deleted
  - Network issues
  - Incorrect URL in config

  To fix:
  1. Check if Convex project exists
  2. Verify URL in .claude/rag-memory.json
  3. Run 'npx convex dev' in your backend project
```

### Empty Project
```
RAG Memory Status
=================

Configuration: ✓ Valid
Connection: ✓ Connected

Stored Memories: 0

No context saved yet for this project.
Use /rag-memory save after working on features
to start building your context memory.
```

### Invalid Config
```
RAG Memory Status
=================

Status: INVALID CONFIGURATION

The config file exists but is missing required fields.

Required:
  ✗ projectId: missing
  ✓ convexUrl: https://...

Run /rag-memory setup to reconfigure.
```
