import 'server-only';
import { Mastra } from '@mastra/core';
import { Memory } from '@mastra/memory';
import { PostgresStore, PgVector } from '@mastra/pg';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

// Import all agents
import { researcherAgent } from '../agents/researcher.agent';
import { profilerAgent } from '../agents/profiler.agent';
import { coachAgent } from '../agents/coach.agent';
import { evaluatorAgent } from '../agents/evaluator.agent';
import { mentorAgent } from '../agents/mentor.agent';

// Configure Memory with Supabase PostgreSQL storage via Connection Pooler
// ✅ pgvector extension enabled in Supabase
// ✅ Connection Pooler solves IPv6 issues (works locally + Vercel)
// ✅ Transaction mode pooling for serverless compatibility
//
// Memory Types (Mastra Best Practices):
// 1. Working Memory: Persistent user profile, preferences, rejected themes (resource-scoped)
// 2. Conversation History: Last 10 messages from current conversation (short-term)
// 3. Semantic Recall: Vector search for relevant past messages (long-term)

// Working Memory Schema - Tracks user preferences across all conversations
const workingMemorySchema = z.object({
  founderProfile: z.object({
    name: z.string().optional(),
    background: z.string().optional(), // e.g., "Creative Director", "Technical Founder"
    archetype: z.string().optional(), // e.g., "Builder", "Visionary"
    bio: z.string().optional(),
  }).optional(),
  preferences: z.object({
    interests: z.array(z.string()).optional(), // What they care about
    rejected: z.array(z.string()).optional(), // What they DON'T want (e.g., ["web3", "crypto", "blockchain"])
    wantsIdeasFor: z.string().optional(), // Current focus area
  }).optional(),
  ideasTracking: z.object({
    suggested: z.array(z.string()).optional(), // All ideas suggested before
    rejectedThemes: z.array(z.string()).optional(), // Rejected themes (e.g., ["web3", "blockchain"])
  }).optional(),
});

// Create OpenAI embedder (serverless-compatible, no native binaries)
const openaiEmbedder = {
  model: openai.embedding('text-embedding-3-small'),
  dimensions: 1536,
};

// PostgreSQL storage instance (used by both Mastra and Memory)
const postgresStore = new PostgresStore({
  connectionString: process.env.DATABASE_URL!,
});

const memory = new Memory({
  // PostgreSQL storage for conversation history
  storage: postgresStore,
  // PgVector for semantic recall (long-term memory)
  vector: new PgVector({
    connectionString: process.env.DATABASE_URL!,
  }),
  // OpenAI embedder (serverless-compatible)
  embedder: openaiEmbedder as any,
  // Memory configuration
  options: {
    // Working Memory: Persists across all threads for a resource (user)
    workingMemory: {
      enabled: true,
      schema: workingMemorySchema,
    },
    // Conversation History: Last 10 messages in current thread
    lastMessages: 10,
    // Semantic Recall: Vector search for relevant past messages
    semanticRecall: {
      topK: 3, // Retrieve top 3 relevant past messages
      messageRange: 2, // Include 2 surrounding messages for context
    },
  },
});

console.log('✅ [Mastra Config] Memory with PostgreSQL + PgVector (Connection Pooler)', {
  hasConnectionString: !!process.env.DATABASE_URL,
  pooler: 'aws-1-eu-north-1.pooler.supabase.com',
  mode: 'transaction',
  embedder: 'OpenAI text-embedding-3-small',
  workingMemory: 'Zod schema with profile, preferences, ideas tracking',
  shortTerm: '10 recent messages',
  longTerm: 'Semantic recall with vector search',
});

// Initialize Mastra instance with all agents
// Mastra best practice: Add storage adapter to main instance
export const mastra = new Mastra({
  agents: {
    researcher: researcherAgent,
    profiler: profilerAgent,
    coach: coachAgent,
    evaluator: evaluatorAgent,
    mentor: mentorAgent,
  },
  storage: postgresStore, // Add storage for persistence
});

export { memory };

// Export agents individually for debugging
export {
  researcherAgent,
  profilerAgent,
  coachAgent,
  evaluatorAgent,
  mentorAgent,
};