# Memory Management Setup for GitGud

## Current Setup ✅

You already have **Mastra Memory** configured with **LibSQL** (local SQLite):
- Location: `mobile-app/gitgud.db`
- Storage: `@libsql/client`
- Working memory: Enabled
- Conversation history: Enabled (100 messages)

## What You Need to Add

### 1. **Per-User Memory** (Currently Missing)

Your current setup uses `resourceId: userId` but you need to:

**Option A: Keep LibSQL (Recommended for MVP)**
- ✅ Already working locally
- ✅ No additional account needed
- ✅ Free
- ❌ Not distributed (single server)

**Option B: Turso (LibSQL Cloud)**
- Free tier: 500 MB storage, 1B row reads/month
- Sign up at: https://turso.tech
- Get: `DATABASE_URL` and `DATABASE_TOKEN`
- Just update `.env.local`

**Option C: Electric SQL**
- For real-time sync across devices
- More complex setup
- Overkill for MVP

**Option D: Mem0**
- Specialized for AI memory
- Sign up at: https://mem0.ai
- Good for long-term context

### 2. **Separate Memory Stores**

You need TWO memory contexts:

```typescript
// User Memory (persistent across sessions)
- Bio, background, skills
- Archetype, strengths
- LinkedIn data
- Personal preferences

// Startup Memory (per project)
- Current startup idea
- Market research
- Challenge artifacts
- Sprint progress
- OKRs and milestones
```

### 3. **Session State** (Time remaining, chat history)

Store in user memory:
```typescript
{
  userId: "user-123",
  currentPhase: "challenge",
  challengeState: {
    timeRemaining: 2400, // seconds
    chatHistory: [...],
    startedAt: "2025-09-30T...",
  }
}
```

## Recommendation

**For MVP: Stick with LibSQL (current setup)**

1. **No new account needed** - it's already working
2. **Add proper user scoping**:
   - Save to memory with `resourceId: session.user.email`
   - Load on login
3. **Add session persistence** to database
4. **Later upgrade to Turso** when you need cloud sync

## Implementation Steps

1. ✅ LibSQL already configured
2. ⬜ Add user session loading on login
3. ⬜ Save challenge state (time, chat) to memory
4. ⬜ Separate user info updates from startup info
5. ⬜ Add "update my info" command routing

Want me to implement the session persistence next?
