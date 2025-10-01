# Utility Functions

This directory contains shared utility functions used across the GitGud app.

## Available Utilities

### `linkify.tsx`
**Purpose:** Convert URLs in text to clickable links

**Usage:**
```tsx
import { LinkifiedText } from '@/lib/utils/linkify';

<LinkifiedText className="text-gray-900">
  {messageContent}
</LinkifiedText>
```

**What it does:**
- Finds URLs in text using regex
- Converts them to `<a>` tags
- Opens links in new tab with `target="_blank"`
- Adds security attributes (`rel="noopener noreferrer"`)

---

### `mem0-client.ts`
**Purpose:** Long-term AI memory for Guddy using Mem0

**Functions:**
- `addMemory(messages, userId)` - Store conversations
- `searchMemory(query, userId, limit)` - Find relevant memories  
- `getAllMemories(userId)` - Get all memories for a user
- `deleteMemory(memoryId)` - Remove a specific memory
- `getMemoryContext(query, userId)` - Build AI-ready context string

**Usage:**
```typescript
import { addMemory, getMemoryContext } from '@/lib/utils/mem0-client';

// Store interaction
await addMemory([
  { role: 'user', content: 'I struggle with marketing' },
  { role: 'assistant', content: 'Let me help...' }
], 'user@email.com');

// Retrieve context
const context = await getMemoryContext(
  'What did I struggle with?',
  'user@email.com'
);
```

**Environment:**
- Requires `MEM0_API_KEY` in `.env.local`
- See `MEM0_INTEGRATION.md` for full docs

---

## Adding New Utilities

**Guidelines:**
1. Keep utilities pure and reusable
2. Add TypeScript types for all functions
3. Document usage with examples
4. Update this README when adding new utils
5. Consider error handling and edge cases

**Example Structure:**
```typescript
/**
 * Brief description
 * @param input - What it takes
 * @returns What it gives back
 */
export function myUtility(input: string): string {
  // Implementation
  return result;
}
```
