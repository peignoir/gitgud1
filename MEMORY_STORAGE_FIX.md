# Memory Storage Provider Fix

## Problem

After reset, the coach agent was failing with:
```
💥 Stream error: Error: Memory requires a storage provider to function. 
Add a storage configuration to Memory or to your Mastra instance.
```

## Root Cause

The Mastra configuration had:
- ✅ LibSQL storage client configured
- ✅ Memory instance with storage configured
- ❌ **BUT** the memory was not connected to the Mastra instance
- ❌ Agents couldn't access the configured storage

## Solution

Connected the configured memory to the Mastra instance so all agents can use the LibSQL storage.

### Files Modified

#### 1. `/mobile-app/src/lib/mastra/config.ts`

**Before:**
```typescript
export const mastra = new Mastra({
  agents: {
    researcher: researcherAgent,
    profiler: profilerAgent,
    coach: coachAgent,
    evaluator: evaluatorAgent,
    mentor: mentorAgent,
  },
  // ❌ No memory configured
});
```

**After:**
```typescript
export const mastra = new Mastra({
  memory, // ✅ Connect the configured memory with LibSQL storage
  agents: {
    researcher: researcherAgent,
    profiler: profilerAgent,
    coach: coachAgent,
    evaluator: evaluatorAgent,
    mentor: mentorAgent,
  },
});
```

#### 2. `/mobile-app/src/lib/agents/coach.agent.ts`

Updated the comment to reflect that it now uses the shared memory:

```typescript
/**
 * Coach Agent
 * 
 * Note: Uses Mastra's shared memory with LibSQL storage (configured in mastra/config.ts)
 * This provides conversation history and working memory across the session
 */
```

## How It Works Now

### Storage Architecture

```
┌─────────────────────────────────────────┐
│  Mastra Instance                        │
│  ┌───────────────────────────────────┐  │
│  │ Memory (shared across all agents) │  │
│  │  - Storage: LibSQL                │  │
│  │  - Database: gitgud.db            │  │
│  │  - Working Memory: Enabled        │  │
│  │  - Conversation History: 100 msgs │  │
│  └───────────────────────────────────┘  │
│                                          │
│  Agents (all use shared memory):        │
│  ├── researcher                          │
│  ├── profiler                            │
│  ├── coach      ✅ Now has storage!     │
│  ├── evaluator                           │
│  └── mentor                              │
└─────────────────────────────────────────┘
```

### What Gets Stored in LibSQL (gitgud.db)

**Working Memory:**
- Founder name
- LinkedIn URL
- Current phase
- Profile & bio
- Archetype
- Assessment results
- Challenge artifacts
- Sprint progress
- Time commitment

**Conversation History:**
- Last 100 messages per thread
- Scoped by `threadId` (e.g., `challenge-franck@recorp.co`)
- Automatically managed by Mastra

## Benefits

✅ **Persistent Memory** - Conversations survive page refreshes
✅ **Cross-Agent Context** - All agents can access shared memory
✅ **Automatic Management** - Mastra handles storage/retrieval
✅ **Thread-Based** - Each phase has its own conversation thread
✅ **Working Memory** - Tracks key founder details across the journey

## How Memory is Used

### In the Stream API (`stream/route.ts`)

```typescript
const streamResponse = await agent.stream(
  [{ role: 'user', content: prompt }],
  {
    resourceId: userId,              // User scope
    threadId: `${phase}-${userId}`,  // Phase-specific thread
  }
);
```

### Thread IDs by Phase

- `welcome-franck@recorp.co` - Welcome phase conversations
- `discovery-franck@recorp.co` - LinkedIn research
- `profile-franck@recorp.co` - Bio creation
- `challenge-franck@recorp.co` - Vibe code coaching ✅ Now works!
- `assessment-franck@recorp.co` - Post-challenge assessment
- `evaluation-franck@recorp.co` - Final evaluation
- `sprint-franck@recorp.co` - 3-week sprint mentorship

### Automatic Conversation Context

When you send a message to Guddy:
1. Mastra retrieves last 100 messages from `challenge-{userId}` thread
2. Adds new user message
3. Sends full context to GPT-5
4. Saves GPT-5 response to thread
5. Returns streaming response

**You don't need to manually pass conversation history** - Mastra does it automatically!

## Memory vs Mem0

You're now using **both systems** optimally:

### Mastra Memory (LibSQL) - Short-term
- **Purpose:** Conversation threads, working memory
- **Scope:** Per phase, session-based
- **Storage:** `gitgud.db` (local SQLite)
- **Best for:** Chat history, current session state
- **Cleared:** When threads deleted via `/api/memory/clear`

### Mem0 - Long-term
- **Purpose:** Cross-session insights, patterns
- **Scope:** User lifetime, cross-journey
- **Storage:** Mem0 cloud
- **Best for:** "Remembers you across months, not just this session"
- **Cleared:** When user explicitly resets all data

## Testing

### Before Fix:
```bash
User sends message: "what you know about me?"
Console: 💥 Stream error: Memory requires a storage provider
Result: ❌ Empty response
```

### After Fix:
```bash
User sends message: "what you know about me?"

Server logs:
🚀 Founder journey stream started
🧠 [Mem0] Using client-side memory only (no blocking)
💬 Agent prompt: { agent: 'coach', promptLength: 1334 }
🤖 [Stream] Calling agent for coach...
✅ [Stream] agent.stream() returned, processing textStream...
📊 [Stream] Finished streaming 15 chunks, total: 456 chars

Browser console:
📤 [Chat] Sending message to coach: { phase: 'challenge', ... }
📥 [Chat] Starting to read response stream...
🚀 [Chat] Stream started
📨 [Chat] Chunk 5: 45 chars, total: 223
✅ [Chat] Stream complete, received 15 chunks, total text: 456 chars
💬 [Chat] Added coach message to chat

Result: ✅ Guddy responds with context-aware message!
```

## Database Location

The LibSQL database is stored at:
```
/Users/peignoir/dev/GitGud-App/mobile-app/gitgud.db
```

You can inspect it with:
```bash
cd mobile-app
sqlite3 gitgud.db
.tables
.schema
```

## Environment Variables

The memory storage uses these optional environment variables:

```bash
# .env.local (optional)
DATABASE_URL=file:./gitgud.db          # Default: local file
DATABASE_TOKEN=                         # Only needed for Turso (cloud)
```

**For local development:** No env vars needed - defaults to `file:./gitgud.db`

**For production (Turso cloud):**
1. Sign up at https://turso.tech
2. Create database
3. Get `DATABASE_URL` and `DATABASE_TOKEN`
4. Update `.env.local`

## Summary

✅ **Fixed:** Coach agent now has access to LibSQL storage via Mastra instance
✅ **Storage:** All conversations persisted to `gitgud.db`
✅ **Memory:** Automatic conversation history (last 100 messages)
✅ **Working Memory:** Tracks founder details across phases
✅ **Dual System:** Mastra Memory (short-term) + Mem0 (long-term)

The coach agent can now have contextual conversations with full memory! 🎉

