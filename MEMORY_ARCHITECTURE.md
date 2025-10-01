# Memory Architecture - Founder & Startup Referentials 🧠

**Date:** Sept 30, 2025  
**Status:** Implemented

---

## Overview

Guddy now has **two separate memory referentials** that she builds and maintains throughout the founder journey:

1. **Founder Memory** - Everything about YOU
2. **Startup Memory** - Everything about the IDEA you're building

This enables Guddy to:
- Know your name, background, and expertise
- Track your behavioral patterns over time
- Understand your startup idea and evolution
- Provide personalized, context-aware coaching
- Update knowledge from conversations

---

## Architecture

### **1. Founder Memory Referential**

Stores structured information about the founder:

```typescript
{
  // Identity
  name: "Franck Nouyrigat",
  linkedinUrl: "...",
  location: "San Francisco",
  
  // Professional Background
  companies: [
    {
      name: "Startup Weekend",
      role: "Co-founder",
      years: "2009-2015",
      outcome: "Acquired by Techstars"
    },
    {
      name: "Electis",
      role: "Founder",
      years: "2020-present",
      description: "E-voting platform"
    }
  ],
  
  education: [
    {
      school: "INSA Lyon",
      degree: "Master's",
      field: "Computer Science"
    }
  ],
  
  // Founder Profile
  archetype: "Builder",
  bio: "[Generated bio]",
  
  // Behavioral Patterns (learned from interactions)
  patterns: {
    workStyle: "Ships fast, prefers action over planning",
    strengths: ["Technical execution", "Community building"],
    challenges: ["Tends to overthink MVP scope"],
    preferences: ["Prefers coding at night"]
  },
  
  // Insights Guddy learns
  insights: [
    "Experienced with 10+ companies",
    "Has successful exit (Startup Weekend)",
    "Currently building e-voting platform"
  ]
}
```

### **2. Startup Memory Referential**

Stores structured information about the startup idea:

```typescript
{
  // Core Idea
  name: "MyStartup",
  tagline: "Help founders ship faster",
  description: "...",
  problem: "Founders struggle to validate quickly",
  solution: "60-min vibe code challenge",
  
  // Business Model
  customer: "Technical founders",
  market: "YC/Techstars-style programs",
  opportunity: "$2B startup education market",
  
  // Progress
  stage: "mvp",
  milestones: [
    {
      date: "2025-09-30",
      description: "Completed vibe code challenge",
      type: "product"
    }
  ],
  
  // Vibe Code Challenge
  challenge: {
    startedAt: "2025-09-30T15:00:00Z",
    artifact: "Built landing page + signup",
    demo: "https://loom.com/...",
    fiveLiner: "..."
  },
  
  // 3-Week Sprint
  sprint: {
    week: 1,
    okrs: [...],
    progress: [...]
  },
  
  // Evolution tracking
  pivots: [
    "Changed from B2B to B2C",
    "Narrowed focus to YC founders only"
  ],
  
  decisions: [
    "Using Next.js + Vercel",
    "Starting with free tier, paid later"
  ],
  
  blockers: [
    "Need to figure out payment integration",
    "Waiting on API access from partner"
  ]
}
```

---

## How It Works

### **Phase 1: Profile (Build Founder Memory)**

1. Guddy researches your LinkedIn
2. Generates comprehensive bio
3. **Extracts structured info**:
   - Name, companies, education
   - Archetype, skills, expertise
4. **Saves to Founder Memory**
5. This memory is now accessible in ALL phases

**Code:**
```typescript
// ProfilePhase.tsx
const extracted = extractFounderInfo(bio);
MemoryManager.saveFounderMemory({
  name: extracted.name,
  companies: extracted.companies,
  education: extracted.education,
  archetype: archetype,
  bio: bio,
});
```

### **Phase 2: Challenge (Build Startup Memory)**

1. Guddy coaches you through vibe coding
2. **Learns about your idea** from conversation
3. **Tracks what you're building**
4. **Saves to Startup Memory**

**When Guddy gets a message:**
```typescript
// ChallengePhase.tsx
const founderMemory = MemoryManager.buildFounderContext();
const startupMemory = MemoryManager.buildStartupContext();

// Send to API
fetch('/api/founder-journey/stream', {
  body: JSON.stringify({
    founderMemory,  // Guddy knows WHO you are
    startupMemory,  // Guddy knows WHAT you're building
    ...
  })
});
```

**Guddy's Prompt receives:**
```
FOUNDER PROFILE:
Name: Franck Nouyrigat
Archetype: Builder

Past Companies:
- Startup Weekend (Co-founder, 2009-2015) - Acquired by Techstars
- Electis (Founder, 2020-present)

Skills: JavaScript, Product Development, Community Building

---

STARTUP INFO:
Name: MyStartup
Problem: Founders struggle to validate quickly
Solution: 60-min vibe code challenge
Stage: mvp
```

### **Phase 3: Evaluation & Sprint (Update Both)**

- **Founder Memory** - Guddy learns patterns:
  - "Franck ships fast when focused"
  - "Tends to overthink if given too much time"
  
- **Startup Memory** - Tracks progress:
  - Milestones, pivots, decisions
  - OKRs and completion status
  - Current blockers

---

## Memory Updates

### **From Conversations**

Guddy can update memory during chat:

```typescript
// User: "I decided to pivot to B2C"
MemoryManager.addStartupPivot("Changed from B2B to B2C");

// User: "I prefer to code late at night"
MemoryManager.updateFounderPattern("preferences", ["prefers coding at night"]);

// User: "I'm blocked on payment integration"
MemoryManager.addStartupBlocker("Need to figure out payment integration");
```

### **Automatic Updates**

Memory updates automatically when:
- Bio is generated → Founder Memory
- Challenge starts → Startup Memory initialized
- Artifacts submitted → Startup Memory updated
- Sprint OKRs set → Startup Memory updated

---

## Benefits

### **1. Guddy Knows Your Name**

**Before:**
> "Hey! What's your name?"

**After:**
> "Hey Franck! I see you've built 10+ companies including Startup Weekend..."

### **2. Context-Aware Coaching**

**Before:**
> "What are you building?"

**After:**
> "Based on your experience with Startup Weekend, you know how to build community. Let's apply that here..."

### **3. Pattern Recognition**

**Week 1:**
> User: "I'm overthinking the MVP scope again"

**Week 3:**
> Guddy: "Remember Week 1 when you overthought scope? You shipped faster when you just picked ONE feature. Do that again."

### **4. Long-Term Continuity**

**Challenge Phase:**
> "You're building a vibe code platform for YC founders"

**Sprint Week 2:**
> "Last week you were blocked on payments. Did you figure that out? Your OKR was to integrate Stripe."

---

## Storage & Sync

### **Current (MVP)**
- **localStorage** (client-side)
- Instant access, no API calls
- Perfect for single-device use

### **Future (Production)**
- **Database** (server-side)
- Multi-device sync
- Cross-session persistence
- API: `GET/POST /api/memory`

---

## Files

**Core:**
- `mobile-app/src/lib/utils/founder-memory.ts` - Memory manager & types
- `mobile-app/src/app/api/memory/route.ts` - API endpoint (future)

**Usage:**
- `ProfilePhase.tsx` - Builds Founder Memory
- `ChallengePhase.tsx` - Sends memory to Guddy, builds Startup Memory
- `stream/route.ts` - Receives memory, passes to agents

**Reset:**
- `founder-journey/page.tsx` - Reset button clears all memory

---

## Example Flow

### **1. Complete Profile**
```bash
💾 [Founder Memory] Saved profile:
  - Name: Franck Nouyrigat
  - Companies: 10
  - Education: 1
```

### **2. Start Challenge**
```bash
🧠 [Memory] Sending to Guddy:
FOUNDER PROFILE:
Name: Franck Nouyrigat
Archetype: Builder
Past Companies:
- Startup Weekend (Co-founder, 2009-2015)
- Electis (Founder, 2020-present)
...

STARTUP INFO:
Not yet defined
```

### **3. Chat with Guddy**
> **Guddy**: "Hey Franck! With your experience building Startup Weekend, you know how to create community-driven products. What are we building today?"

> **You**: "I want to build a platform to help YC founders validate faster"

```bash
💾 [Startup Memory] Saved:
  - Name: YC Validation Platform
  - Customer: YC founders
  - Problem: Validation takes too long
```

### **4. Next Message**
> **Guddy**: "Love it! So we're helping YC founders validate faster. Given your Builder archetype, let's start with a quick prototype. Using Lovable or Cursor?"

*Guddy now knows:*
- Your name (Franck)
- Your background (10+ companies)
- Your archetype (Builder)
- Your startup idea (YC Validation Platform)

---

## Debug & Reset

**View Memory:**
```typescript
// In browser console
const founder = MemoryManager.getFounderMemory();
const startup = MemoryManager.getStartupMemory();
console.log('Founder:', founder);
console.log('Startup:', startup);
```

**Reset Everything:**
- Click "🗑️ Reset Journey (Debug)" button
- Clears: Journey state + Challenge state + Founder Memory + Startup Memory

---

## Next Steps

### **Implement Agent Memory Updates**

Create a Mastra tool for agents to update memory:

```typescript
// memory-tool.ts
export const updateMemoryTool = createTool({
  id: 'update-memory',
  execute: async ({ type, field, value }) => {
    if (type === 'founder') {
      MemoryManager.addFounderInsight(value);
    } else if (type === 'startup') {
      MemoryManager.addStartupMilestone(value);
    }
  }
});
```

### **Add to Agent Instructions**

```typescript
// coach.agent.ts
instructions: `
You can update memory when you learn something new:
- Founder patterns: Use update-memory tool
- Startup progress: Use update-memory tool
`
```

---

**Guddy now has a proper memory architecture! She learns about you and your startup throughout the journey.** 🎉
