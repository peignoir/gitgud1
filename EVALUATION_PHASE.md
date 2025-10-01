# Evaluation Phase - "The Sorting Hat" 🎩⚖️

**Date:** Sept 30, 2025  
**Status:** Complete

---

## Overview

After the Vibe Code Challenge, Guddy evaluates the founder like an early-stage VC/business angel and assigns them to one of two **houses**:

1. **🚀 VENTURE HOUSE** - YC/Techstars track for experienced/impressive founders
2. **💪 BOOTSTRAP HOUSE** - Profitable builder track for everyone else

---

## Evaluation Criteria (Weighted)

### **80% - Founder Profile**

The primary decision factor. Guddy looks for:

✅ **Previous Companies Founded**
- Number of companies
- Exits/acquisitions
- Roles (founder, co-founder, CTO, etc.)

✅ **Work Experience**
- Notable tech companies (FAANG, unicorns, well-known startups)
- Impressive titles (CTO, VP Eng, Head of Product)
- Years of experience building products

✅ **Education**
- Top schools (MIT, Stanford, CMU, etc.)
- CS/Engineering degrees
- Advanced degrees (PhD, Masters)

✅ **Fundraising Track Record**
- Previous funding raised
- Investor relationships
- Pitch competition wins

### **20% - Vibe Code Execution**

Secondary validation. Guddy checks:

- ⏱️ Time spent: Did they use the full 60 minutes?
- 🎥 Video demo: Provided and complete?
- 📝 5-liner: Clear business summary?
- 💻 Code/GitHub: 
  - If GitHub: Does it look substantial (many commits, real code) or basic (template)?
  - If other: Did they ship something?

**Note:** Video analysis is skipped for now (too complex). GitHub repos get a quick scan if public.

---

## The Two Houses

### **🚀 VENTURE HOUSE**

**Who gets in:**
- Co-founded 3+ startups (especially with exits)
- Ex-FAANG or top startup (Stripe, Airbnb, etc.)
- Top school (MIT, Stanford, Berkeley CS, etc.)
- Previously raised $1M+ seed/Series A
- Built products used by 100K+ users
- Impressive technical leadership roles

**What it means:**
- Fast growth track
- Fundraising focused
- Venture-scale ambitions (10M+ users/revenue)
- Access to VC/investor network
- Sprint focus: Build, raise, scale

**Example bio → Venture House:**
> "Co-founded Startup Weekend in 2007, scaled to 150+ countries, acquired by Techstars in 2015. Previously co-founded Revevol (cloud computing). Ex-advisor to YC-backed companies. Master's in CS from top university."

---

### **💪 BOOTSTRAP HOUSE**

**Who gets in:**
- First-time founders
- Junior/mid-level developers (< 5 years exp)
- Side project builders (no major exits)
- Learning mode, building skills
- Good execution but no standout credentials
- **Most founders start here - and that's great!**

**What it means:**
- Revenue-first approach
- Customer-focused growth
- Profitable and sustainable
- Build on your terms, keep control
- Sprint focus: MVP, customers, cash flow

**Example bio → Bootstrap House:**
> "Software engineer with 3 years experience at a startup. Built several side projects, passionate about developer tools. Completed bootcamp in 2022. Ready to ship my first real product."

---

## User Experience Flow

### **Stage 1: Analyzing (2 seconds)**
```
⏳ Loading your submission...
```

### **Stage 2: Thinking (30-60 seconds)**
```
┌─────────────────────────────────────┐
│ CG  Guddy's Thinking Process...    │
├─────────────────────────────────────┤
│                                     │
│ Looking at your background...       │
│                                     │
│ You co-founded Startup Weekend in   │
│ 2007 and scaled it to 150+ countries│
│ before it was acquired by Techstars │
│ in 2015. That's a major exit and    │
│ shows you can build global scale.   │
│                                     │
│ Previously co-founded Revevol in    │
│ cloud computing - more technical    │
│ depth there...                      │
│                                     │
│ [Streaming...]                      │
└─────────────────────────────────────┘
```

### **Stage 3: Reveal (The Big Moment!)**
```
┌──────────────────────────────────────────┐
│             🚀 (bouncing)                │
│                                          │
│         VENTURE HOUSE                    │
│      The YC / Techstars Track           │
│                                          │
│  You're building something venture-scale.│
│    Big ambitions, bigger impact.         │
│                                          │
│  🎯 Fast growth, fundraising,            │
│     scaling to millions of users         │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│ CG  Why I made this decision:           │
├──────────────────────────────────────────┤
│ You've proven you can build venture-     │
│ scale companies. Startup Weekend going   │
│ from 0 to 150 countries is no joke.     │
│ Plus the Techstars acquisition shows VC  │
│ traction. Welcome to Venture House! 🚀   │
└──────────────────────────────────────────┘
```

---

## Prompt Engineering

Guddy uses a carefully crafted evaluation prompt:

### **Key Instructions:**

1. **Weighting:** Explicitly tell Guddy that founder profile is 80%, execution is 20%
2. **Be Specific:** Reference actual details from the founder's bio
3. **Show Thinking:** Walk through the decision process in 2-4 paragraphs
4. **Clear Decision:** Final sentence MUST clearly state the house
5. **House Examples:** Provide concrete examples of each house

### **Critical Format:**

Guddy must end with one of these exact phrases:
- "Welcome to the **Venture House** - let's build something massive."
- "You're heading to the **Bootstrap House** - let's build profitably."

This triggers the house detection in the frontend.

---

## Decision Logic (Frontend)

```typescript
const extractDecision = (text: string): { house: House; reasoning: string } => {
  const lowerText = text.toLowerCase();
  
  // Check for house assignment
  let house: House = 'bootstrap'; // Default
  if (lowerText.includes('venture house') || lowerText.includes('yc') || lowerText.includes('techstars')) {
    house = 'venture';
  }
  
  // Extract reasoning (last paragraph)
  const reasoning = text.split('\n\n').filter(p => p.trim()).pop() || text;
  
  return { house, reasoning };
};
```

**Default:** Bootstrap House (if unclear or error)

---

## Memory Integration

### **Saves to Founder Memory:**
```typescript
MemoryManager.addFounderInsight(`Evaluated as ${house} house founder`);
```

### **Passes to API:**
- Founder Bio
- Founder Archetype
- Founder Memory Context (companies, education, skills)
- Startup Memory Context (challenge data)

---

## Visual Design

### **House Cards:**

**Venture House:**
- Purple/Indigo gradient
- Rocket emoji 🚀
- Larger text, more dramatic
- Purple glow shadow
- "Build something massive"

**Bootstrap House:**
- Blue/Cyan gradient
- Flexed bicep emoji 💪
- Warm, encouraging tone
- Blue glow shadow
- "Build profitably"

### **Animations:**

1. **Bounce:** House emoji bounces on reveal
2. **Fade In:** Card fades in from bottom (0.8s)
3. **Scale:** Card grows on hover (105%)
4. **Pulse:** Guddy avatar pulses during thinking

---

## API Integration

### **Request:**
```json
{
  "phase": "evaluation",
  "userId": "current-user",
  "data": {
    "founderBio": "...",
    "founderArchetype": "Builder",
    "videoUrl": "https://...",
    "fiveLiner": "...",
    "codeUrl": "https://github.com/...",
    "timeSpent": 3420,
    "founderMemory": "FOUNDER PROFILE:\nName: ...",
    "startupMemory": "STARTUP INFO:\n..."
  }
}
```

### **Response (Streaming):**
```
data: {"type":"chunk","content":"Looking at your background..."}
data: {"type":"chunk","content":" You co-founded Startup Weekend"}
...
data: {"type":"complete","fullText":"...Welcome to the **Venture House**..."}
```

---

## Edge Cases

### **Missing Data:**

1. **No Bio:** 
   - Default to Bootstrap House
   - Encourage completing profile

2. **No Deliverables:**
   - Still evaluate based on founder profile
   - Note in reasoning: "Would love to see what you ship next time"

3. **API Error:**
   - Fallback decision based on `founderMemory.companies.length >= 3`
   - Experienced (3+ companies) → Venture
   - Everyone else → Bootstrap

### **Ambiguous Cases:**

- **Mid-level founder (2 companies, no big exits):** Bootstrap
- **Top school but no experience:** Bootstrap (potential, but needs to prove it)
- **Experienced but no exits:** Depends on company quality/scale

**Philosophy:** When in doubt → Bootstrap House (it's a great place to start!)

---

## Testing

### **Test Case 1: Experienced Founder**

**Input:**
- Bio: "Co-founded 4 startups, 1 acquired by Google, ex-Stripe"
- Video: ✅
- 5-liner: ✅
- Time: 58 minutes

**Expected:** 🚀 Venture House

---

### **Test Case 2: First-Time Founder**

**Input:**
- Bio: "Junior dev, 2 years experience, built side projects"
- Video: ✅
- 5-liner: ✅
- Time: 60 minutes

**Expected:** 💪 Bootstrap House

---

### **Test Case 3: Edge - Top School, No Experience**

**Input:**
- Bio: "MIT CS grad, no work experience yet, fresh out of school"
- Video: ✅
- 5-liner: ✅
- Time: 45 minutes

**Expected:** 💪 Bootstrap House
**Reasoning:** Potential but unproven

---

### **Test Case 4: Strong Execution, Weak Profile**

**Input:**
- Bio: "Self-taught developer, 1 year experience"
- Video: ✅ Amazing demo
- 5-liner: ✅ Brilliant business model
- GitHub: 200+ commits, production-ready
- Time: 60 minutes

**Expected:** 💪 Bootstrap House
**Reasoning:** 80/20 rule - profile matters most. But note in reasoning: "Impressive execution! Ship this and come back with traction."

---

## Next Steps After Evaluation

### **Venture House → 3-Week Sprint:**
- Focus: Build, raise, scale
- Metrics: User growth, investor pitch, fundraising prep
- Guddy's role: Push for venture-scale thinking

### **Bootstrap House → 3-Week Sprint:**
- Focus: MVP, first customers, revenue
- Metrics: MRR, customer feedback, profitability path
- Guddy's role: Customer validation, sustainable growth

**Both paths are valuable!** Just different strategies.

---

## Code Files

1. **Frontend:**
   - `mobile-app/src/components/journey/EvaluationPhase.tsx`

2. **API:**
   - `mobile-app/src/app/api/founder-journey/stream/route.ts` (evaluation case)

3. **Memory:**
   - `mobile-app/src/lib/utils/founder-memory.ts`

4. **Styles:**
   - `mobile-app/src/app/globals.css` (fadeIn animation)

---

## Success Metrics

✅ Founder feels evaluated fairly  
✅ Decision feels personalized (references their actual bio)  
✅ Both houses feel positive (no one feels "rejected")  
✅ Clear next steps after reveal  
✅ Dramatic/fun reveal experience  

---

**The Evaluation Phase is now live! Welcome to the Sorting Hat! 🎩✨**

