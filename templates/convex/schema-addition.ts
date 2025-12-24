/**
 * RAG Memory - Schema Addition
 *
 * Add this table definition to your existing convex/schema.ts
 *
 * If you don't have a schema.ts yet, create one with:
 *
 * import { defineSchema, defineTable } from 'convex/server';
 * import { v } from 'convex/values';
 *
 * export default defineSchema({
 *   // Your existing tables...
 *
 *   // Add this:
 *   ragMemories: defineTable({ ... })
 * });
 */

import { defineTable } from 'convex/server';
import { v } from 'convex/values';

// Add this to your schema's defineSchema({ ... }) call:
export const ragMemoriesTable = defineTable({
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
  metadata: v.optional(v.object({
    files: v.optional(v.array(v.string())),
    importance: v.optional(v.number()),
    expiresAt: v.optional(v.number())
  })),
  createdAt: v.number()
})
  .index('by_project', ['projectId'])
  .index('by_type', ['projectId', 'type'])
  .index('by_session', ['sessionId'])
  .vectorIndex('by_embedding', {
    vectorField: 'embedding',
    dimensions: 1536,
    filterFields: ['projectId', 'type']
  });

/**
 * Full schema example:
 *
 * import { defineSchema, defineTable } from 'convex/server';
 * import { v } from 'convex/values';
 *
 * export default defineSchema({
 *   // Your other tables...
 *
 *   ragMemories: defineTable({
 *     projectId: v.string(),
 *     sessionId: v.optional(v.string()),
 *     type: v.union(
 *       v.literal('decision'),
 *       v.literal('code_pattern'),
 *       v.literal('progress'),
 *       v.literal('blocker'),
 *       v.literal('context'),
 *       v.literal('file_summary'),
 *       v.literal('conversation')
 *     ),
 *     title: v.string(),
 *     content: v.string(),
 *     tags: v.array(v.string()),
 *     embedding: v.array(v.float64()),
 *     metadata: v.optional(v.object({
 *       files: v.optional(v.array(v.string())),
 *       importance: v.optional(v.number()),
 *       expiresAt: v.optional(v.number())
 *     })),
 *     createdAt: v.number()
 *   })
 *     .index('by_project', ['projectId'])
 *     .index('by_type', ['projectId', 'type'])
 *     .index('by_session', ['sessionId'])
 *     .vectorIndex('by_embedding', {
 *       vectorField: 'embedding',
 *       dimensions: 1536,
 *       filterFields: ['projectId', 'type']
 *     })
 * });
 */
