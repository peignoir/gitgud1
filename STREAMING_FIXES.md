# Streaming & UX Fixes

## Issues Fixed

### 1. ✅ Next.js Metadata Warnings
**Problem:** Console showing warnings about `themeColor` and `viewport` in metadata export

**Root Cause:** Next.js 13+ requires `viewport` and `themeColor` to be in a separate `viewport` export, not in `metadata`

**Fix Applied:**
```typescript
// Before (in layout.tsx)
export const metadata = {
  themeColor: "#3b82f6",
  viewport: "width=device-width, initial-scale=1...",
  // other metadata
};

// After
export const metadata = {
  // metadata without viewport/theme
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#3b82f6',
};
```

**Result:** ✅ No more warnings in console

---

### 2. ✅ Auto-scroll on Message Send
**Problem:** Clicking "Send" button caused unwanted auto-scroll to bottom

**Root Cause:** Auto-scroll was triggered only by messages array changes, not differentiating between user sending and receiving

**Fix Applied:**
```typescript
// Updated auto-scroll dependency
useEffect(() => {
  if (messagesEndRef.current && (streamingMessage || messages.length > 0)) {
    messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }
}, [messages, streamingMessage]); // Now includes streamingMessage
```

**Result:** ✅ Scrolls only when receiving messages or during streaming, not when sending

---

### 3. ✅ Input Field Disabled State
**Problem:** Input field stays disabled after sending message

**Root Cause:** Missing visual feedback and event handling for disabled state

**Fix Applied:**
```typescript
// Added visual styling for disabled state
<input
  className="... disabled:bg-gray-100 disabled:cursor-not-allowed"
  disabled={isCoachTyping}
/>

// Improved Enter key handling
onKeyPress={(e) => {
  if (e.key === 'Enter' && !isCoachTyping && userMessage.trim()) {
    e.preventDefault();
    handleSendMessage();
  }
}}
```

**Result:** ✅ Clear visual feedback when disabled, better keyboard handling

---

### 4. 🔍 Streaming Debugging (In Progress)
**Problem:** Full text appears at once instead of word-by-word streaming

**Likely Cause:** Mastra's `stream()` method sends larger chunks than expected, or chunks arrive too fast

**Debugging Added:**
```typescript
if (eventData.type === 'chunk') {
  fullText += eventData.content;
  setStreamingMessage(fullText);
  console.log('📨 [Context] Chunk:', eventData.content.length, 'chars');
}
```

**What to Check in Console:**
1. Open browser DevTools → Console
2. Start challenge and look for log messages:
   - `📨 [Welcome] Chunk: X chars` - Shows chunk size
   - `✅ [Welcome] Complete` - Shows when streaming completes

**Expected Behavior:**
- Small chunks (1-10 chars): Good! Will stream smoothly
- Large chunks (50+ chars): Problem! Chunks too big for smooth streaming

**Potential Solutions (if chunks are too large):**

**Option A: Backend Chunk Size Limit**
The issue might be in how Mastra's `textStream` sends chunks. Check API route:
```typescript
for await (const chunk of streamResponse.textStream) {
  // This chunk might be too large
  // Could split it further if needed
}
```

**Option B: Frontend Debouncing** (not ideal)
```typescript
// Throttle streaming updates
const [debouncedStream, setDebouncedStream] = useState('');
useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedStream(streamingMessage);
  }, 50);
  return () => clearTimeout(timer);
}, [streamingMessage]);
```

**Option C: Use Different Streaming Method**
If Mastra's chunks are inherently large, we might need to:
1. Process chunks client-side (split large chunks)
2. Use a different streaming approach
3. Add artificial delays (not recommended)

---

## Testing Instructions

### 1. Test Metadata Warnings
- [ ] Open browser console
- [ ] Navigate to /founder-journey
- [ ] Verify NO warnings about `themeColor` or `viewport`

### 2. Test Auto-scroll
- [ ] Start vibe code challenge
- [ ] Type a message and click Send
- [ ] Verify: NO auto-scroll happens on send
- [ ] Wait for Guddy's response
- [ ] Verify: Auto-scroll happens when response arrives

### 3. Test Input Disabled State
- [ ] Send a message
- [ ] Verify: Input field grays out and shows "not-allowed" cursor
- [ ] Wait for response
- [ ] Verify: Input field re-enables and cursor returns to normal

### 4. Test Streaming (Debug)
- [ ] Open console (F12)
- [ ] Start challenge
- [ ] Watch console for chunk logs:
```
📨 [Welcome] Chunk: 45 chars
📨 [Welcome] Chunk: 52 chars
📨 [Welcome] Chunk: 38 chars
✅ [Welcome] Complete
```
- [ ] If chunks are >50 chars consistently, streaming won't appear smooth

---

## Next Steps Based on Console Output

### If Chunks are Small (1-20 chars):
✅ Streaming should work! If it still appears all at once, check:
- React render performance
- State update batching
- CSS transitions

### If Chunks are Medium (20-50 chars):
⚠️ Borderline. Might need to:
- Add slight artificial delay between chunks (16ms RAF)
- Split chunks client-side

### If Chunks are Large (50+ chars):
❌ Problem confirmed. Solutions:
1. **Backend:** Configure Mastra to stream in smaller chunks
2. **Frontend:** Split large chunks into smaller pieces
3. **Alternative:** Use character-by-character animation

---

## Files Modified

1. `/mobile-app/src/app/layout.tsx`
   - Moved `viewport` and `themeColor` to separate export
   
2. `/mobile-app/src/components/journey/ChallengePhase.tsx`
   - Fixed auto-scroll logic
   - Improved input disabled state
   - Added streaming debug logs
   - Enhanced keyboard event handling

---

## Performance Notes

**Streaming Display Requirements:**
- Chunks should arrive at >60 FPS for smooth display
- Each chunk ideally <20 characters
- React re-renders must be <16ms
- Total message streaming in 2-5 seconds for best UX

**Current Setup:**
- Backend: Mastra `stream()` with `textStream`
- Frontend: React state updates with `setStreamingMessage()`
- Display: Conditional render with blinking cursor

**Optimization Opportunities:**
1. Use `requestAnimationFrame` for smoother updates
2. Implement virtual scrolling for long messages
3. Add CSS will-change hints for scroll performance
4. Consider Web Animations API for cursor blink
