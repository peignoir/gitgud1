import 'server-only';
import { Mastra } from '@mastra/core';
import { Memory } from '@mastra/memory';
import { PostgresStore, PgVector } from '@mastra/pg';
import { openai } from '@ai-sdk/openai';

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
// Memory Types:
// - Conversation History (Short-term): Recent messages from current conversation
// - Semantic Recall (Long-term): Vector search retrieves relevant past messages
// - Working Memory: Persistent user data and preferences

// Create OpenAI embedder (serverless-compatible, no native binaries)
const openaiEmbedder = {
  model: openai.embedding('text-embedding-3-small'),
  dimensions: 1536,
};

const memory = new Memory({
  // PostgreSQL storage for conversation history
  storage: new PostgresStore({
    connectionString: process.env.DATABASE_URL!,
  }),
  // PgVector for semantic recall (long-term memory)
  vector: new PgVector({
    connectionString: process.env.DATABASE_URL!,
  }),
  // OpenAI embedder (serverless-compatible)
  embedder: openaiEmbedder as any,
  // Memory configuration
  options: {
    lastMessages: 10, // Keep last 10 messages in context (short-term)
    semanticRecall: {
      topK: 3, // Retrieve top 3 relevant past messages (long-term)
      messageRange: 2, // Include 2 surrounding messages for context
    },
  },
});

console.log('✅ [Mastra Config] Memory with PostgreSQL + PgVector (Connection Pooler)', {
  hasConnectionString: !!process.env.DATABASE_URL,
  pooler: 'aws-1-eu-north-1.pooler.supabase.com',
  mode: 'transaction',
  embedder: 'OpenAI text-embedding-3-small',
  shortTerm: '10 recent messages',
  longTerm: 'Semantic recall with vector search',
});

// Initialize Mastra instance with all agents
// Note: Memory is used by agents via the exported memory instance
export const mastra = new Mastra({
  agents: {
    researcher: researcherAgent,
    profiler: profilerAgent,
    coach: coachAgent,
    evaluator: evaluatorAgent,
    mentor: mentorAgent,
  },
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