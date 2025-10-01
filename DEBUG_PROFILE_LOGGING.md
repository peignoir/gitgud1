# Debug Logging Added for Profile Generation

## Problem
Profile generation was completing but not showing bio. User couldn't tell if text was generated or if it was empty.

---

## Debug Logs Added

### Backend (API Route)
**File:** `/mobile-app/src/app/api/founder-journey/stream/route.ts`

#### 1. Chunk Progress Logging
```typescript
// Log every 10 chunks to track streaming progress
if (chunkCount % 10 === 0) {
  console.log(`📨 [Stream] Chunk ${chunkCount}, total length: ${fullResponse.length}`);
}
```

#### 2. Stream Summary
```typescript
console.log(`📊 [Stream] Finished streaming ${chunkCount} chunks, total: ${fullResponse.length} chars`);
```

#### 3. Response Preview
```typescript
if (fullResponse.length === 0) {
  console.error('❌ [Stream] WARNING: Empty response generated!');
} else {
  console.log(`📝 [Stream] Response preview: "${fullResponse.substring(0, 200)}..."`);
}
```

---

### Frontend (ProfilePhase Component)
**File:** `/mobile-app/src/components/journey/ProfilePhase.tsx`

#### 1. Stream Start Detection
```typescript
if (eventData.type === 'start') {
  console.log('🚀 [Profile] Stream started');
}
```

#### 2. Stream Reader Progress
```typescript
console.log('🔄 [Profile] Starting to read stream...');

// On stream done
console.log(`🏁 [Profile] Stream done after ${readCount} reads, final text length: ${fullText.length}`);
```

#### 3. Chunk Reception Logging
```typescript
// Log first chunk and every 20th chunk
const currentCount = chunkCount + 1;
if (currentCount === 1 || currentCount % 20 === 0) {
  console.log(`📨 [Profile] Chunk ${currentCount}: "${eventData.content.substring(0, 50)}..." (${eventData.content.length} chars, total: ${fullText.length})`);
}
```

#### 4. Complete Event Details
```typescript
console.log(`✅ [Profile] Complete event received, fullText length: ${fullText?.length || 0}`);
console.log(`✅ [Profile] Complete preview: "${fullText?.substring(0, 200) || '(empty)'}..."`);
```

#### 5. Empty Response Detection
```typescript
if (!fullText || fullText.trim().length === 0) {
  console.error('❌ [Profile] Empty response received from complete event');
  console.error('❌ [Profile] eventData:', JSON.stringify(eventData));
  throw new Error('Profile generation returned empty response...');
}
```

#### 6. Error Event Logging
```typescript
if (eventData.type === 'error') {
  console.error('❌ [Profile] Error event received:', eventData.error);
  throw new Error(eventData.error || 'Unknown error');
}
```

---

## What to Look For in Console

### ✅ Successful Profile Generation:

```
🚀 Founder journey stream started { phase: 'profile', userId: 'current-user' }
🧠 [Mem0] Retrieved context for franck@recorp.co
💬 Agent prompt: { agent: 'profiler', promptLength: 7772 }

🔍 [Web Research Tool] Query: "Franck Nouyrigat" companies ventures
🔍 [Web Research Tool] Query: "Franck Nouyrigat" interview podcast
...

🔄 [Profile] Starting to read stream...
🚀 [Profile] Stream started

📨 [Stream] Chunk 10, total length: 245
📨 [Profile] Chunk 1: "Franck Nouyrigat is a serial entrepreneur..." (50 chars, total: 245)
📨 [Stream] Chunk 20, total length: 532
📨 [Profile] Chunk 20: "acquired by Techstars in 2015..." (45 chars, total: 532)
...
📨 [Stream] Chunk 100, total length: 1850

📊 [Stream] Finished streaming 125 chunks, total: 2340 chars
📝 [Stream] Response preview: "Franck Nouyrigat is a serial entrepreneur and community builder. Currently, he is the founder of Electis (2020-present)..."

✅ [Profile] Complete event received, fullText length: 2340
✅ [Profile] Complete preview: "Franck Nouyrigat is a serial entrepreneur..."
🏁 [Profile] Stream done after 45 reads, final text length: 2340

✅ Stream completed successfully
✅ [Mem0] Stored interaction in long-term memory
```

---

### ❌ Empty Response (Should Trigger Errors):

```
🚀 Founder journey stream started { phase: 'profile', userId: 'current-user' }
🧠 [Mem0] Retrieved context
💬 Agent prompt: { agent: 'profiler', promptLength: 7772 }

🔄 [Profile] Starting to read stream...
🚀 [Profile] Stream started

📊 [Stream] Finished streaming 0 chunks, total: 0 chars
❌ [Stream] WARNING: Empty response generated!  ← RED FLAG!

✅ [Profile] Complete event received, fullText length: 0
✅ [Profile] Complete preview: "(empty)..."
❌ [Profile] Empty response received from complete event
❌ [Profile] eventData: {"type":"complete","fullText":"","phase":"profile"}

Profile generation failed: Error: Profile generation returned empty response
```

---

### ❌ Model Configuration Error:

```
🚀 Founder journey stream started
💬 Agent prompt: { agent: 'profiler', promptLength: 7772 }

💥 Stream error: OpenAI API error: Invalid model 'gpt-5'  ← Shows exact error
❌ [Profile] Error event received: OpenAI API error...

OR if silent failure:

📊 [Stream] Finished streaming 0 chunks, total: 0 chars
❌ [Stream] WARNING: Empty response generated!
```

---

## Debugging Steps

### Step 1: Check if Stream Starts
Look for: `🚀 [Profile] Stream started`
- **Not present?** → Stream isn't starting, check API connection
- **Present?** → Continue to Step 2

### Step 2: Check if Chunks Arrive (Backend)
Look for: `📨 [Stream] Chunk 10, total length: X`
- **No chunks?** → Model isn't generating, check model config
- **Chunks present?** → Continue to Step 3

### Step 3: Check if Chunks Arrive (Frontend)
Look for: `📨 [Profile] Chunk 1: "..."`
- **Backend has chunks, frontend doesn't?** → Streaming/encoding issue
- **Both have chunks?** → Continue to Step 4

### Step 4: Check Complete Event
Look for: `✅ [Profile] Complete event received, fullText length: X`
- **Length is 0?** → Complete event has empty fullText
- **Length > 0?** → Check if bio displayed on screen

### Step 5: Check Final Text Length
Look for: `🏁 [Profile] Stream done after X reads, final text length: Y`
- Compare frontend `fullText.length` with backend total
- Should match!

---

## Common Issues & Solutions

### Issue 1: Empty Response from Model
**Symptoms:**
```
📊 [Stream] Finished streaming 0 chunks, total: 0 chars
❌ [Stream] WARNING: Empty response generated!
```

**Possible Causes:**
1. Wrong model parameters (check `reasoningEffort` format)
2. Invalid model name
3. Model API quota exceeded
4. Prompt too long / invalid

**Solution:**
- Check model config in `profiler.agent.ts`
- Verify `reasoningEffort` is top-level, not nested
- Check OpenAI API status/quota

---

### Issue 2: Chunks Generated but Not Displayed
**Symptoms:**
```
Backend: 📊 Finished streaming 125 chunks, total: 2340 chars
Frontend: 🏁 Stream done, final text length: 0
```

**Possible Causes:**
1. `fullText` accumulation broken in frontend
2. Chunk parsing issue
3. State update race condition

**Solution:**
- Check `fullText += eventData.content` logic
- Verify `setGeneratedBio(fullText)` is called
- Check React state batching

---

### Issue 3: Complete Event Has Wrong Data
**Symptoms:**
```
✅ [Profile] Complete event received, fullText length: 0
Backend shows: total: 2340 chars
```

**Possible Causes:**
1. `completeData.fullText` not set correctly in backend
2. JSON serialization issue
3. Variable scope issue

**Solution:**
- Check backend: `completeData.fullText = fullResponse`
- Verify `fullResponse` has content before sending
- Check variable naming (fullText vs fullResponse)

---

### Issue 4: Stream Never Completes
**Symptoms:**
- Stream starts
- Some chunks arrive
- Never sees "Stream done" or "Complete event"
- Request hangs

**Possible Causes:**
1. Infinite loop in stream processing
2. Model not ending stream
3. Network timeout
4. Buffer overflow

**Solution:**
- Check for `controller.close()` call
- Add timeout to stream reader
- Check network tab for hung request
- Verify model streaming support

---

## Quick Diagnostic Checklist

Run through this when debugging:

- [ ] `🚀 [Profile] Stream started` appears? (Connection OK)
- [ ] `📨 [Stream] Chunk X` appears? (Model generating)
- [ ] `📨 [Profile] Chunk X` appears? (Frontend receiving)
- [ ] `📊 Finished streaming` shows count > 0? (Backend has text)
- [ ] `🏁 Stream done` shows length > 0? (Frontend has text)
- [ ] `✅ Complete event` shows length > 0? (Complete data OK)
- [ ] `📝 Response preview` shows actual text? (Content valid)
- [ ] No `❌` error logs? (No errors)

**If all ✅** → Problem is in UI rendering, not data flow  
**If any ❌** → Follow the debug steps above

---

## How to Use

1. **Open browser console** (F12 → Console tab)
2. **Clear console** to start fresh
3. **Start profile generation**
4. **Watch logs in real-time**
5. **Look for the emoji patterns:**
   - 🚀 = Start events
   - 📨 = Chunk progress
   - 📊 = Stream summary
   - 📝 = Response preview
   - ✅ = Success events
   - ❌ = Errors/warnings
   - 🏁 = Stream end
   - 🔄 = Stream reader

6. **Save console output** if reporting a bug (right-click → "Save as...")

---

## Expected Timeline

For a typical profile generation:

```
0s     🚀 Stream started
0-40s  🔍 Web research queries
40s    📨 First chunk arrives
40-50s 📨 Chunks streaming (100-200 chunks)
50s    📊 Finished streaming
50s    ✅ Complete event
50s    🏁 Stream done
```

**Red flags:**
- No chunks after 60s
- Empty response after 60s
- Stream never completes after 90s

---

## Related Files

1. `/mobile-app/src/app/api/founder-journey/stream/route.ts` - Backend logs
2. `/mobile-app/src/components/journey/ProfilePhase.tsx` - Frontend logs
3. `/mobile-app/src/lib/agents/profiler.agent.ts` - Model config

---

## Next Test

Run profile generation and share:
1. Full console output
2. Network tab screenshot showing the `/api/founder-journey/stream` request
3. What you see on screen (or don't see)

The logs will tell us **exactly** where the flow breaks! 🔍
