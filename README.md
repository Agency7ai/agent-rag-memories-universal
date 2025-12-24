# RAG Memory - Portable Context Preservation for Claude Agent Skills or Agents.md Memories

![RAG Memory Demo](hero.gif)

*Never forget what your building*

A complete RAG (Retrieval-Augmented Generation) system that preserves your project context across Claude Code or Agent sessions.

**Framework Agnostic** - Works with any tech stack. Only requires Convex for storage.

## What It Does

- **Saves** important decisions, code patterns, progress, and blockers
- **Retrieves** relevant context at the start of new sessions
- **Augments** Claude's responses with your project history
- **Prevents** repeating yourself or losing track of decisions

## Quick Install

## Non Claude Agents start

```
npm i -g openskills
```

```
touch .agent/skills
```

```
mv rag-memory .agent/skills/rag-memory
```

```
openskills sync
```

## claude agents start

## same for both

```bash
# 1. Copy to your project
cp -r /path/to/rag-memory /your/project/.claude/skills/

# 2. Start Claude Code in your project
cd /your/project
claude

# 3. Run setup
/rag-memory setup
```

## Commands

| Command | What It Does |
|---------|--------------|
| `/rag-memory setup` | Initialize RAG for this project |
| `/rag-memory load` | Load context at session start |
| `/rag-memory load auth` | Search for context about "auth" |
| `/rag-memory save` | Save current session context |
| `/rag-memory status` | Show configuration and stats |
| `/rag-memory clear` | Delete all stored context |

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                    FRAMEWORK AGNOSTIC                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Your Project          Claude Code            Convex       │
│   (Any Stack)           Skills                 (Storage)    │
│                                                             │
│  ┌───────────┐       ┌─────────────┐       ┌───────────┐   │
│  │ React     │       │ /rag-memory │──────▶│ Vector DB │   │
│  │ Vue       │◀─────▶│ load / save │◀──────│ Embeddings│   │
│  │ Svelte    │       │             │       │ Search    │   │
│  │ Node      │       └─────────────┘       └───────────┘   │
│  │ Python    │                                              │
│  │ Go        │       No framework code                      │
│  │ Anything! │       needed in your app                     │
│  └───────────┘                                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Setup (One-Time)

### 1. Create a Convex Project

```bash
# In any directory (can be separate from your main project)
mkdir rag-memory-backend && cd rag-memory-backend
npm init -y
npm install convex
npx convex dev
```

### 2. Add Schema

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

### 3. Add Functions

Copy `templates/convex/ragMemories.ts` to `convex/ragMemories.ts`

### 4. Set OpenAI Key

```bash
npx convex env set OPENAI_API_KEY sk-your-key-here
```

### 5. Get Your Convex URL

After `npx convex dev`, note your deployment URL:
```
https://your-project-123.convex.cloud
```

### 6. Configure the Skill

Create `.claude/rag-memory.json` in your actual project:
```json
{
  "projectId": "my-project-name",
  "convexUrl": "https://your-project-123.convex.cloud"
}
```

## Memory Types

| Type | Use For |
|------|---------|
| `decision` | Tech choices, architecture decisions, trade-offs |
| `code_pattern` | Reusable patterns, conventions, idioms |
| `progress` | Completed features, milestones, current state |
| `blocker` | Known issues, pending questions, limitations |
| `context` | Project knowledge, business logic, requirements |
| `file_summary` | Key files and their purposes |
| `conversation` | Important discussions, user preferences |

## Example Session

```
User: /rag-memory load

Claude: RAG Context Loaded
        ==================
        Retrieved 5 relevant memories:

        Decisions:
          • Using PostgreSQL for main database
          • Chose Tailwind over styled-components

        Patterns:
          • API error handling pattern
          • Form validation approach

        Progress:
          • User authentication complete
          • Dashboard layout done

        I'm ready to continue. What would you like to work on?

User: Add user profile editing

Claude: I'll add profile editing. Based on your existing patterns,
        I'll follow the same form validation approach and use the
        established API error handling...
```

## Sharing With Friends

### Option A: Share Just the Skill
```bash
# Zip the skill folder
cd .claude/skills
zip -r rag-memory.zip rag-memory/
# Share the zip file
```

They'll need to:
1. Set up their own Convex backend
2. Configure `.claude/rag-memory.json` with their URL

### Option B: Share Backend Too
If you want friends to use the same backend (shared context):
1. Add them as team members in Convex dashboard
2. Share the `convexUrl`
3. They use a different `projectId` for their projects

## Troubleshooting

### "Convex not configured"
Create a Convex project and set the URL in `.claude/rag-memory.json`

### "No OPENAI_API_KEY"
In your Convex project: `npx convex env set OPENAI_API_KEY sk-...`

### Low quality search results
Clear old memories and re-save after setting OpenAI key:
```
/rag-memory clear
/rag-memory save
```

## Auto-Load Hook (True RAG)

To make context loading automatic at session start:

1. **Copy the hook script**:
   ```bash
   mkdir -p .claude/hooks
   cp .claude/skills/rag-memory/templates/hooks/rag-session-start.sh .claude/hooks/
   chmod +x .claude/hooks/rag-session-start.sh
   ```

2. **Add to settings** (`.claude/settings.json` or `settings.local.json`):
   ```json
   {
     "hooks": {
       "SessionStart": [
         {
           "hooks": [
             {
               "type": "command",
               "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/rag-session-start.sh"
             }
           ]
         }
       ]
     }
   }
   ```

Now Claude will automatically be instructed to load context at session start!

## Files Included

```
rag-memory/
├── README.md              # This file
├── SKILL.md               # Main skill definition
├── commands/
│   ├── setup.md           # Setup instructions
│   ├── load.md            # Load context logic
│   ├── save.md            # Save context logic
│   └── status.md          # Status display
└── templates/
    ├── convex/
    │   ├── ragMemories.ts      # Convex functions
    │   └── schema-addition.ts  # Schema to add
    └── hooks/
        └── rag-session-start.sh  # Auto-load hook
```

## Why Convex?

- **Free tier** - Plenty for personal/small team use
- **Built-in vector search** - No additional setup
- **Serverless** - No server to maintain
- **Works anywhere** - Just an HTTP API

## License

MIT - Use freely, share with friends.
