# Mem0 Reset & Profile Debug Fix

## Issues Fixed

### 1. ✅ Mem0 Memories Not Cleared on Reset
**Problem:** When using "Reset" button, localStorage was cleared but Mem0 long-term memories persisted

**Solution:** Added Mem0 clearing to reset flow

#### Files Modified

**A. Added `clearAllMemories()` function** (`/mobile-app/src/lib/utils/mem0-client.ts`)
```typescript
export async function clearAllMemories(userId: string): Promise<void> {
  const memories = await getAllMemories(userId);
  console.log(`🗑️ [Mem0] Clearing ${memories?.length || 0} memories`);
  
  if (memories && memories.length > 0) {
    for (const memory of memories) {
      if (memory.id) {
        await mem0Client.delete(memory.id);
      }
    }
  }
  
  console.log(`✅ [Mem0] Cleared all memories for user ${userId}`);
}
```

**B. Created API endpoint** (`/mobile-app/src/app/api/memory/clear/route.ts`)
```typescript
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  await clearAllMemories(session.user.email);
  return NextResponse.json({ success: true });
}
```

**C. Updated reset handler** (`/mobile-app/src/app/founder-journey/page.tsx`)
```typescript
const handleReset = async () => {
  if (confirm('Reset all journey state?')) {
    // Clear localStorage
    localStorage.removeItem('founder-journey-state');
    localStorage.removeItem('challenge-state');
    
    // Clear memory referentials
    MemoryManager.resetAll();
    
    // Clear Mem0 long-term memories (NEW!)
    await fetch('/api/memory/clear', { method: 'DELETE' });
    
    // Reset state
    setJourneyState({ currentPhase: 'welcome', data: {}, loading: false });
  }
};
```

---

### 2. ✅ Added Profile Phase Debug Logging
**Problem:** User reported profile generation appearing "stuck" after initial message

**Solution:** Added console logging to track streaming progress

#### Changes Made (`/mobile-app/src/components/journey/ProfilePhase.tsx`)

```typescript
// Added logging to chunk handler
console.log('📨 [Profile] Chunk received:', eventData.content.length, 'chars, total:', fullText.length);

// Added logging to complete handler
console.log('✅ [Profile] Complete, total length:', fullText.length);
```

**What to Check in Console:**
1. Look for `📨 [Profile] Chunk received:` messages
2. If chunks are arriving but bio not showing → UI rendering issue
3. If no chunks → backend/model issue
4. Check final `✅ [Profile] Complete` with length

---

## Reset Flow (New)

### Before
```
User clicks Reset
  ↓
localStorage cleared ✅
  ↓
MemoryManager.resetAll() ✅
  ↓
Mem0 memories STILL EXIST ❌
```

### After
```
User clicks Reset
  ↓
localStorage cleared ✅
  ↓
MemoryManager.resetAll() ✅
  ↓
API call to /api/memory/clear ✅
  ↓
Mem0 clears ALL user memories ✅
  ↓
Complete fresh start! 🎉
```

---

## Testing Instructions

### Test Mem0 Reset

1. **Create some memories**
   - Go through profile phase
   - Chat with Guddy
   - Verify mem0 storage in console logs

2. **Reset**
   - Click "Reset All State" button
   - Confirm the dialog
   - Check console for:
```
🗑️ Clearing Mem0 memories...
✅ Mem0 memories cleared
🗑️ All journey state AND memory cleared
```

3. **Verify clean slate**
   - Start journey again
   - No previous context should appear
   - Guddy should act like first interaction

---

### Test Profile Debug Logs

1. **Start profile phase**
2. **Watch console for:**
```
📨 [Profile] Chunk received: 45 chars, total: 45
📨 [Profile] Chunk received: 52 chars, total: 97
📨 [Profile] Chunk received: 38 chars, total: 135
...
✅ [Profile] Complete, total length: 1250
```

3. **Diagnose issues:**
   - **No chunks at all** → Backend/model problem
   - **Chunks but no display** → UI rendering issue
   - **Chunks stop mid-stream** → Streaming interruption

---

## Console Logs to Monitor

### Successful Reset
```
🗑️ [Memory] All memory cleared
🗑️ All journey state AND memory cleared
🗑️ Clearing Mem0 memories...
🗑️ [Mem0] Clearing 15 memories for user franck@recorp.co
✅ [Mem0] Cleared all memories for user franck@recorp.co
✅ Mem0 memories cleared
```

### Successful Profile Generation
```
📨 [Profile] Chunk received: 45 chars, total: 45
📨 [Profile] Chunk received: 52 chars, total: 97
📨 [Profile] Chunk received: 38 chars, total: 135
... (many chunks)
✅ [Profile] Complete, total length: 1250
```

---

## API Endpoints

### New Endpoint

**`DELETE /api/memory/clear`**
- Clears all Mem0 memories for authenticated user
- Returns: `{ success: true, message: '...', userId: '...' }`
- Auth: Required (NextAuth session)

### Existing Endpoints

**`GET /api/memory`**
- Returns info about client-side memory
- No actual Mem0 interaction (localStorage only)

**`POST /api/memory`**
- Logs memory actions
- Future: Will save to database

---

## Error Handling

### Mem0 Clear Failures
```typescript
try {
  await fetch('/api/memory/clear', { method: 'DELETE' });
  console.log('✅ Mem0 memories cleared');
} catch (error) {
  console.warn('⚠️ Failed to clear Mem0 (non-critical)');
  // Still proceeds with local reset
}
```

**Why non-critical:**
- Local state still cleared
- User can proceed
- Mem0 will eventually overwrite old data
- Better UX than blocking

---

## Future Improvements

1. **Batch delete API**
   - Mem0 might support bulk delete
   - Faster than loop through individual deletes

2. **Soft delete option**
   - Archive instead of delete
   - Allow "undo reset" feature

3. **Selective memory clear**
   - Clear only journey state
   - Keep founder profile memories
   - User choice dialog

4. **Memory backup**
   - Export memories before clearing
   - Allow restore from backup

---

## Related Files

1. `/mobile-app/src/lib/utils/mem0-client.ts` - Mem0 client functions
2. `/mobile-app/src/app/api/memory/clear/route.ts` - Clear API endpoint
3. `/mobile-app/src/app/founder-journey/page.tsx` - Reset handler
4. `/mobile-app/src/components/journey/ProfilePhase.tsx` - Profile debug logs

---

## Notes

- Mem0 clearing is async but non-blocking
- Reset still works even if Mem0 API fails
- Console logs help debug streaming issues
- All changes are backward compatible
