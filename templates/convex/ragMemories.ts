/**
 * RAG Memory - Convex Backend
 *
 * Copy this file to your project's convex/ directory.
 * Also add the schema from schema-addition.ts to your schema.ts
 *
 * Setup:
 * 1. npm install convex
 * 2. npx convex dev
 * 3. npx convex env set OPENAI_API_KEY <your-key>
 */

import { v } from 'convex/values';
import { query, mutation, action, internalMutation, internalQuery } from './_generated/server';
import { internal } from './_generated/api';

// Memory types supported
const memoryTypes = [
  'decision',
  'code_pattern',
  'progress',
  'blocker',
  'context',
  'file_summary',
  'conversation'
] as const;

const memoryTypeValidator = v.union(
  v.literal('decision'),
  v.literal('code_pattern'),
  v.literal('progress'),
  v.literal('blocker'),
  v.literal('context'),
  v.literal('file_summary'),
  v.literal('conversation')
);

// ============================================
// INTERNAL MUTATIONS
// ============================================

export const insertMemory = internalMutation({
  args: {
    projectId: v.string(),
    sessionId: v.optional(v.string()),
    type: memoryTypeValidator,
    title: v.string(),
    content: v.string(),
    tags: v.array(v.string()),
    embedding: v.array(v.float64()),
    metadata: v.optional(v.object({
      files: v.optional(v.array(v.string())),
      importance: v.optional(v.number()),
      expiresAt: v.optional(v.number())
    }))
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('ragMemories', {
      ...args,
      createdAt: Date.now()
    });
  }
});

export const getById = internalQuery({
  args: { id: v.id('ragMemories') },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  }
});

// ============================================
// PUBLIC MUTATIONS
// ============================================

export const deleteMemory = mutation({
  args: { memoryId: v.id('ragMemories') },
  handler: async (ctx, { memoryId }) => {
    await ctx.db.delete(memoryId);
    return { success: true };
  }
});

export const clearProject = mutation({
  args: { projectId: v.string() },
  handler: async (ctx, { projectId }) => {
    const memories = await ctx.db
      .query('ragMemories')
      .withIndex('by_project', q => q.eq('projectId', projectId))
      .collect();

    for (const memory of memories) {
      await ctx.db.delete(memory._id);
    }

    return { deleted: memories.length };
  }
});

// ============================================
// QUERIES
// ============================================

export const listByProject = query({
  args: {
    projectId: v.string(),
    type: v.optional(v.string()),
    limit: v.optional(v.number())
  },
  handler: async (ctx, { projectId, type, limit = 50 }) => {
    if (type) {
      return await ctx.db
        .query('ragMemories')
        .withIndex('by_type', q => q.eq('projectId', projectId).eq('type', type as any))
        .order('desc')
        .take(limit);
    }

    return await ctx.db
      .query('ragMemories')
      .withIndex('by_project', q => q.eq('projectId', projectId))
      .order('desc')
      .take(limit);
  }
});

export const getRecent = query({
  args: {
    projectId: v.string(),
    limit: v.optional(v.number())
  },
  handler: async (ctx, { projectId, limit = 10 }) => {
    return await ctx.db
      .query('ragMemories')
      .withIndex('by_project', q => q.eq('projectId', projectId))
      .order('desc')
      .take(limit);
  }
});

// ============================================
// ACTIONS (External API + DB)
// ============================================

export const store = action({
  args: {
    projectId: v.string(),
    sessionId: v.optional(v.string()),
    type: memoryTypeValidator,
    title: v.string(),
    content: v.string(),
    tags: v.array(v.string()),
    metadata: v.optional(v.object({
      files: v.optional(v.array(v.string())),
      importance: v.optional(v.number()),
      expiresAt: v.optional(v.number())
    }))
  },
  handler: async (ctx, args) => {
    // Generate embedding
    const embedding = await generateEmbedding(args.title + '\n\n' + args.content);

    // Store with embedding
    const memoryId = await ctx.runMutation(internal.ragMemories.insertMemory, {
      ...args,
      embedding
    });

    return { memoryId, success: true };
  }
});

export const search = action({
  args: {
    projectId: v.string(),
    query: v.string(),
    type: v.optional(v.string()),
    limit: v.optional(v.number())
  },
  handler: async (ctx, { projectId, query, type, limit = 5 }) => {
    // Generate embedding for search query
    const queryEmbedding = await generateEmbedding(query);

    // Vector search
    const results = await ctx.vectorSearch('ragMemories', 'by_embedding', {
      vector: queryEmbedding,
      limit,
      filter: type
        ? (q) => q.eq('projectId', projectId) && q.eq('type', type)
        : (q) => q.eq('projectId', projectId)
    });

    // Fetch full documents
    const memories = await Promise.all(
      results.map(async (result) => {
        const doc = await ctx.runQuery(internal.ragMemories.getById, {
          id: result._id
        });
        return {
          ...doc,
          score: result._score
        };
      })
    );

    return memories.filter(Boolean);
  }
});

// ============================================
// EMBEDDING GENERATION
// ============================================

async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.warn('[RAG Memory] No OPENAI_API_KEY - using fallback embedding');
    return generateFallbackEmbedding(text);
  }

  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text.slice(0, 8000)
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('[RAG Memory] Embedding error:', error);
    return generateFallbackEmbedding(text);
  }
}

function generateFallbackEmbedding(text: string): number[] {
  const embedding = new Array(1536).fill(0);

  for (let i = 0; i < text.length; i++) {
    const idx = (text.charCodeAt(i) * (i + 1)) % 1536;
    embedding[idx] = (embedding[idx] + text.charCodeAt(i) / 255) % 1;
  }

  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    for (let i = 0; i < embedding.length; i++) {
      embedding[i] /= magnitude;
    }
  }

  return embedding;
}
