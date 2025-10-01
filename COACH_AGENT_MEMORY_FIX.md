# Coach Agent Memory Storage Error Fix

## Issue

After resetting the journey and starting the Challenge phase, when users sent chat messages to Guddy, they received an error:

```
💥 Stream error: Error: Memory requires a storage provider to function. 
Add a storage configuration to Memory or to your Mastra instance.

https://mastra.ai/en/docs/memory/overview
```

**User Experience:**
- Welcome message from Guddy worked fine
- But when user sent chat messages like "what you know about me?", no response
- Console showed memory storage error
- Empty response from agent

## Root Cause

The `coachAgent` was configured with Mastra's Memory system:

```typescript
// OLD CODE (BROKEN)
export const coachAgent = new Agent({
  name: 'coach',
  memory: new Memory({
    options: {
      conversationHistory: {
        enabled: true,
        lastMessages: 20,
      },
    },
  }),
  // ...
});
```

**Problem:**
- Memory requires a storage provider (database) to function
- After reset, Mastra threads were cleared
- Memory system couldn't access storage
- Agent failed when trying to use memory during `agent.stream()` call

**Why it happened after reset:**
The reset process cleared all Mastra threads (`/api/memory/clear`), which broke the Memory system's connection to storage.

## Solution

Removed the Memory configuration from the coach agent since we're **already passing conversation history manually** in the prompt:

```typescript
// NEW CODE (FIXED)
export const coachAgent = new Agent({
  name: 'coach',
  // No memory configuration - we handle it manually
  instructions: `You are Guddy - straight-talking AI coach at GitGud.vc.
  ...
```

**Why This Works:**
1. We already pass full conversation history in every request:
   ```typescript
   // In ChallengePhase.tsx
   data: {
     conversationHistory: messages, // ← Full chat history
     userMessage: currentMessage,
     // ...
   }
   ```

2. The prompt builder includes this in context:
   ```typescript
   // In stream/route.ts
   conversationHistory: ${JSON.stringify(data.conversationHistory || [])}
   ```

3. Manual memory management gives us more control and avoids storage dependencies

## Files Modified

### `/mobile-app/src/lib/agents/coach.agent.ts`

**Before:**
```typescript
import { Agent } from '@mastra/core';
import { openai } from '@ai-sdk/openai';
import { Memory } from '@mastra/memory';  // ← Unused now
import { webResearchTool } from './tools/web-research.tool';

export const coachAgent = new Agent({
  name: 'coach',
  memory: new Memory({  // ← REMOVED
    options: {
      conversationHistory: {
        enabled: true,
        lastMessages: 20,
      },
    },
  }),
  instructions: `...`,
  model: openai('gpt-5', {
    reasoningEffort: 'low',
  }),
  tools: {
    webResearchTool,
  },
});
```

**After:**
```typescript
import { Agent } from '@mastra/core';
import { openai } from '@ai-sdk/openai';
import { webResearchTool } from './tools/web-research.tool';

/**
 * Coach Agent
 * 
 * Note: Memory is handled manually via conversationHistory in the prompt
 * (no Mastra Memory needed since we pass full context each time)
 */
export const coachAgent = new Agent({
  name: 'coach',
  // No memory configuration
  instructions: `...`,
  model: openai('gpt-5', {
    reasoningEffort: 'low',
  }),
  tools: {
    webResearchTool,
  },
});
```

## Testing

### Before Fix:
```
User: "what you know about me?"
Console: 💥 Stream error: Error: Memory requires a storage provider
Result: ❌ Empty response, no message from Guddy
```

### After Fix:
```
User: "what you know about me?"
Console: 
  📤 [Chat] Sending message to coach: { phase: 'challenge', ... }
  📥 [Chat] Starting to read response stream...
  🚀 [Chat] Stream started
  📨 [Chat] Chunk 5: 45 chars, total: 223
  ✅ [Chat] Stream complete, received 15 chunks, total text: 456 chars
  💬 [Chat] Added coach message to chat: Hey! Based on what I know...
  
Result: ✅ Guddy responds with personalized message
```

## Why Manual Memory Management is Better Here

1. **No storage dependencies** - Works immediately without database setup
2. **Full control** - We decide exactly what history to include
3. **Transparent** - Easy to debug, clear data flow
4. **Resilient** - Works even after reset/thread clearing
5. **Efficient** - Only pass what's needed, no extra queries

## Other Agents

The other agents don't have this issue:
- ✅ `researcher` - No memory configuration
- ✅ `profiler` - No memory configuration  
- ✅ `evaluator` - No memory configuration
- ✅ `mentor` - No memory configuration
- ❌ `coach` - **HAD** memory configuration (now fixed)

## Console Logs Added

Enhanced error handling in `ChallengePhase.tsx` to diagnose issues:

```typescript
// Before sending
console.log('📤 [Chat] Sending message to coach:', { phase, messageLength, ... });

// During streaming
console.log('📥 [Chat] Starting to read response stream...');
console.log('🚀 [Chat] Stream started');
console.log(`📨 [Chat] Chunk ${count}: ${length} chars`);

// On completion
console.log('✅ [Chat] Stream complete, received X chunks, total: Y chars');
console.log('💬 [Chat] Added coach message to chat:', preview);

// On error
console.error('❌ [Chat] API error:', status, errorText);
console.error('❌ [Chat] Failed to get coach response:', error);
```

This helps debug any future issues quickly.

---

## Summary

**Problem:** Coach agent couldn't respond after reset due to Memory storage error

**Solution:** Removed Mastra Memory config, use manual conversation history (which we were already doing)

**Result:** Chat works perfectly, no storage dependencies, more resilient to resets 🎉

