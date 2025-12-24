---
name: rag-memory
description: Full RAG (Retrieval-Augmented Generation) context memory system. Automatically preserves and retrieves context across sessions using vector search. Framework agnostic - works with any project.
user_invocable: true
---

# RAG Memory - Persistent Context Across Sessions

A portable, framework-agnostic RAG system for Claude Code that preserves your project context across sessions.

## Quick Start

```bash
# 1. Copy this skill folder to your project
cp -r .claude/skills/rag-memory /path/to/your/project/.claude/skills/

# 2. Run the setup
/rag-memory setup

# 3. Start using it
/rag-memory load    # Load context at session start
/rag-memory save    # Save context when needed
```

## Commands

| Command | Description |
|---------|-------------|
| `/rag-memory setup` | Initialize RAG for this project |
| `/rag-memory load` | Load relevant context (run at session start) |
| `/rag-memory load [topic]` | Search for context about a specific topic |
| `/rag-memory save` | Save current session context |
| `/rag-memory status` | Show current configuration and stats |
| `/rag-memory clear` | Clear all stored context (careful!) |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│               FRAMEWORK AGNOSTIC RAG                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  /rag-memory load                 /rag-memory save          │
│       │                                │                    │
│       ▼                                ▼                    │
│  ┌─────────────────────────────────────────────┐           │
│  │         Convex (Serverless Backend)         │           │
│  │                                             │           │
│  │  • ragMemories table                        │           │
│  │  • OpenAI text-embedding-3-small            │           │
│  │  • Vector similarity search                 │           │
│  │  • No framework code in your app            │           │
│  └─────────────────────────────────────────────┘           │
│                                                             │
│  Works with: React, Vue, Svelte, Node, Python,             │
│              Go, Rust, or ANY tech stack                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## How RAG Works

1. **RETRIEVAL** - When you run `/rag-memory load`:
   - Fetches relevant memories from vector database
   - Uses semantic search (not just keywords)
   - Returns decisions, patterns, progress from past sessions

2. **AUGMENTATION** - The retrieved context is presented to Claude:
   - Becomes part of the conversation
   - Informs all subsequent responses
   - No need to re-explain your project

3. **GENERATION** - Claude uses the context:
   - References past decisions
   - Follows established patterns
   - Continues from where you left off

## Configuration

After setup, your `.claude/rag-memory.json` looks like:

```json
{
  "projectId": "your-project-name",
  "convexUrl": "https://your-deployment.convex.cloud",
  "autoLoad": true
}
```

## Memory Types

| Type | What to Store |
|------|--------------|
| `decision` | Architecture choices, tech stack decisions, trade-offs |
| `code_pattern` | Reusable patterns, conventions, idioms |
| `progress` | Completed features, milestones, current state |
| `blocker` | Known issues, pending questions, limitations |
| `context` | Project-specific knowledge, business logic |
| `file_summary` | Key files and their purposes |
| `conversation` | Important discussions, user preferences |

## Backend Setup (One-Time)

You need a Convex backend. This can be:
- A dedicated project just for RAG memory
- Part of an existing Convex project
- Shared across multiple projects (different projectIds)

### Quick Convex Setup

```bash
# Create backend (can be anywhere)
mkdir rag-backend && cd rag-backend
npm init -y
npm install convex
npx convex dev

# Set OpenAI key for embeddings
npx convex env set OPENAI_API_KEY sk-your-key

# Copy schema and functions from templates/convex/
```

## When to Use

### `/rag-memory load`
- Starting a new session
- Switching to a feature you've worked on before
- Need to recall a previous decision
- After context was summarized/compressed

### `/rag-memory save`
- Ending a productive session
- Made important decisions
- Established new patterns
- Context window getting full
- Before switching to a different topic

## Example Flow

```
Day 1:
User: Let's build an auth system
Claude: [Works on auth, makes decisions about Stack Auth, patterns, etc.]
User: /rag-memory save
Claude: Saved 4 memories: Stack Auth decision, auth patterns, progress, config notes

Day 2:
User: /rag-memory load
Claude: Loaded context - you're using Stack Auth with email/OAuth,
        middleware pattern for protected routes, auth is complete.

User: Add profile settings
Claude: I'll add profile settings that integrates with your Stack Auth
        setup, following your established patterns...
```

## Sharing

### Share Just the Skill
```bash
zip -r rag-memory.zip .claude/skills/rag-memory/
# Friends unzip to their .claude/skills/
# They set up their own Convex backend
```

### Share Everything
1. Add friends to your Convex team
2. Share the convexUrl
3. They use unique projectIds

## Files

```
rag-memory/
├── README.md              # Detailed documentation
├── SKILL.md               # This file
├── commands/
│   ├── setup.md           # Setup flow
│   ├── load.md            # Retrieval logic
│   ├── save.md            # Extraction logic
│   └── status.md          # Status display
└── templates/
    └── convex/
        ├── ragMemories.ts      # Copy to convex/
        └── schema-addition.ts  # Add to schema.ts
```
