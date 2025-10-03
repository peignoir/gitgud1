# GitGud Mastra Architecture Strategy

**Based on official Mastra documentation review (https://mastra.ai/en/docs)**

---

## 🎯 Core Recommendations

### 1. REMOVE MemoryManager - Use 100% Mastra Memory

**Current Problem:**
- `MemoryManager` (localStorage) duplicates Mastra Memory
- Client-side state causes sync issues
- Agents don't see full context

**Solution: Use Mastra's 3-Layer Memory System:**

```typescript
const coachAgent = new Agent({
  name: 'coach',
  memory: new Memory({
    storage: new PostgresStore({...}), // Already configured!
    scope: 'resource', // 🔑 Resource-scoped (userId), not thread-scoped!

    workingMemory: z.object({
      // Persistent founder profile (replaces MemoryManager)
      founder: FounderProfileSchema,
      startup: StartupInfoSchema,
    }),

    conversationHistory: {
      shortTermLimit: 10 // Last 10 messages
    },

    semanticRecall: {
      topK: 3,        // 3 most relevant past messages
      withContext: 2  // +2 surrounding messages
    }
  })
});
```

**Memory Types:**

| Type | Use For | Example |
|------|---------|---------|
| **Working Memory** | Persistent profile, preferences, patterns | Archetype, house, work style |
| **Conversation History** | Recent messages (short-term) | Last 10 messages in chat |
| **Semantic Recall** | Find relevant past insights (long-term) | "Mentioned scaling 2 weeks ago" |

**Migration Steps:**
1. Create `lib/mastra/memory-schema.ts` with Zod schemas
2. Configure `workingMemory` in all agents
3. Migrate localStorage → Mastra Memory API
4. Delete `MemoryManager` class
5. Test cross-thread persistence

---

### 2. WORKFLOW BRANCHING for Venture vs Bootstrap

**Problem:** Linear workflow (same path for everyone)

**Solution:** Use `.branch()` for conditional paths

```typescript
export const founderWorkflow = createWorkflow({
  id: 'founder-journey',
})
.then(onboardingStep)
.then(assessmentStep)
.then(houseClassificationStep)

// 🔑 BRANCH based on house
.branch([
  // Path 1: VENTURE HOUSE (YC-style)
  [
    async ({ inputData }) => inputData.house === 'VENTURE',
    createWorkflow({...})
      .then(ventureChallengeStep)   // Fast MVP, demo-first
      .then(investorPrepStep)       // Pitch deck, fundraising
      .then(ventureSprint_Week1)    // Customer discovery
      .then(ventureSprint_Week2)    // Growth hacking
      .then(ventureSprint_Week3)    // Investor intros
  ],

  // Path 2: BOOTSTRAP HOUSE (Indie Hackers)
  [
    async ({ inputData }) => inputData.house === 'BOOTSTRAP',
    createWorkflow({...})
      .then(bootstrapChallengeStep) // Revenue-first, pricing
      .then(profitabilityPlanStep)  // Unit economics
      .then(bootstrapSprint_Week1)  // Revenue validation
      .then(bootstrapSprint_Week2)  // Distribution channel
      .then(bootstrapSprint_Week3)  // Profitability path
  ]
]);
```

**Benefits:**
- Different OKRs per house
- Different coaching style (YC vs Indie Hackers)
- Different timeline (12 weeks vs 8 weeks)
- Different metrics (growth rate vs profit margin)

---

### 3. MCP (Model Context Protocol) Integration

**When to Use MCP vs Native Tools:**

| Use Case | Solution | Why |
|----------|----------|-----|
| LinkedIn scraping | Native Mastra ✅ | Already implemented |
| Web research | Native Mastra ✅ | Already implemented (Tavily) |
| **GitHub integration** | **MCP Server** 🆕 | Track commits, PRs (execution signal) |
| **Calendar scheduling** | **MCP Server** 🆕 | Schedule check-ins by timezone |
| **Notion/Airtable** | **MCP Server** 🆕 | Store OKRs, progress docs |
| **Stripe** | **MCP Server** 🆕 | Track revenue (bootstrap founders) |
| **Email/notifications** | **MCP Server** 🆕 | Weekly progress emails |

**Implementation:**

```typescript
import { MCPClient } from '@mastra/mcp';

const mcp = new MCPClient({
  servers: {
    github: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-github'],
      env: { GITHUB_TOKEN: process.env.GITHUB_TOKEN }
    },
    calendar: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-google-calendar'],
      env: { GOOGLE_CALENDAR_TOKEN: process.env.CALENDAR_TOKEN }
    }
  }
});

// Add to agents
const mentorAgent = new Agent({
  tools: {
    ...mcp.getTools('github'),
    ...mcp.getTools('calendar'),
    webResearchTool // Keep existing
  }
});
```

**Recommended MCP Servers:**
1. **GitHub** - Execution tracking (commits, PRs as progress signal)
2. **Google Calendar** - Smart scheduling based on founder timezone
3. **Slack/Discord** - Community notifications
4. **Stripe** - Revenue tracking for bootstrap founders
5. **Airtable/Notion** - OKR and progress documentation

---

### 4. ADAPTIVE FEEDBACK with Memory Processors

**Use Memory Processors to Learn Patterns:**

```typescript
const patternProcessor = {
  name: 'pattern-detector',
  process: async (messages: Message[], memory: Memory) => {
    const recentMessages = messages.slice(-20);

    // Detect behavioral patterns
    const patterns = {
      missedDeadlines: countMissedDeadlines(recentMessages),
      techQuestions: countTechQuestions(recentMessages),
      frustrationLevel: detectFrustration(recentMessages),
      executionSpeed: measureExecutionSpeed(recentMessages)
    };

    // Update working memory
    await memory.updateWorkingMemory({
      patterns: {
        workStyle: patterns.executionSpeed > 0.8
          ? 'fast shipper'
          : 'methodical planner',
        challenges: patterns.missedDeadlines > 2
          ? ['time management']
          : [],
        preferences: {
          learningStyle: patterns.techQuestions > 5
            ? 'hands-on'
            : 'theory-first'
        }
      }
    });

    // Adapt coaching dynamically
    if (patterns.frustrationLevel > 0.7) {
      return {
        instruction: 'Be more supportive and encouraging',
        tone: 'empathetic'
      };
    }

    if (patterns.executionSpeed > 0.9) {
      return {
        instruction: 'Increase challenge difficulty',
        okrComplexity: 'harder'
      };
    }

    return { instruction: 'Continue current approach' };
  }
};
```

**Adaptive Loops:**
- Misses deadlines → Easier OKRs
- Asks many code questions → More examples
- Shows frustration → More supportive tone
- Ships fast → Harder challenges

---

### 5. RESOURCE-SCOPED MEMORY for Cross-Thread Context

**Current:** Thread-scoped (each phase isolated)
**Needed:** Resource-scoped (userId as scope)

```typescript
const memory = new Memory({
  storage: new PostgresStore({...}),
  scope: 'resource', // 🔑 Not 'thread'!
  resourceId: (context) => context.userId
});

// Now memory persists across ALL threads:
// - onboarding-{userId}
// - challenge-{userId}
// - sprint-{userId}
```

**Benefits:**
- Coach sees onboarding insights during challenge
- Mentor sees challenge struggles during sprint
- No manual context passing needed
- Single source of truth per founder

---

## 🏗️ Implementation Roadmap

### Phase 1: Memory Migration (Week 1) 🚧 Next
1. Create `lib/mastra/memory-schema.ts` (Zod schemas)
2. Configure resource-scoped memory in all agents
3. Migrate MemoryManager data → Mastra working memory
4. Delete MemoryManager class
5. Test persistence across threads

### Phase 2: Workflow Branching (Week 2)
1. Split workflow post-classification:
   - `ventureWorkflow` (YC, 12 weeks)
   - `bootstrapWorkflow` (Indie Hackers, 8 weeks)
2. Create house-specific steps (OKRs, coaching, metrics)
3. Test both paths end-to-end

### Phase 3: Adaptive Feedback (Week 3)
1. Build pattern detection processor
2. Track: deadlines, questions, frustration, execution
3. Adjust coaching dynamically
4. Test adaptation over 3-week sprint

### Phase 4: MCP Integration (Week 4)
1. Add GitHub MCP (commit tracking)
2. Add Calendar MCP (check-in scheduling)
3. Add Stripe MCP (revenue for bootstrap)
4. Test tool integrations

---

## 📋 Key Code Changes

### 1. Memory Schema (`lib/mastra/memory-schema.ts`)

```typescript
import { z } from 'zod';

export const FounderProfileSchema = z.object({
  name: z.string(),
  email: z.string(),
  archetype: z.enum(['Builder', 'Visionary', 'Operator', 'Researcher']),
  house: z.enum(['VENTURE', 'BOOTSTRAP']),

  patterns: z.object({
    workStyle: z.string().optional(),
    strengths: z.array(z.string()).default([]),
    challenges: z.array(z.string()).default([]),
  }).optional(),

  preferences: z.object({
    checkInFrequency: z.enum(['daily', 'weekly', 'on-demand']).default('weekly'),
    learningStyle: z.enum(['theory', 'examples', 'hands-on']).default('examples'),
    feedbackStyle: z.enum(['direct', 'socratic', 'encouraging']).default('direct'),
    availableHours: z.number().default(10),
  }).optional(),

  currentWeek: z.number().default(0),
  completedOKRs: z.array(z.string()).default([]),
  blockers: z.array(z.string()).default([]),
});

export const StartupInfoSchema = z.object({
  name: z.string().optional(),
  problem: z.string().optional(),
  solution: z.string().optional(),
  stage: z.enum(['idea', 'prototype', 'mvp', 'launched', 'scaling']).default('idea'),
  metrics: z.object({
    users: z.number().default(0),
    revenue: z.number().default(0),
    mrr: z.number().default(0),
  }).optional(),
});
```

### 2. Agent Memory Config

```typescript
import { FounderProfileSchema, StartupInfoSchema } from '../mastra/memory-schema';

export const coachAgent = new Agent({
  name: 'coach',
  memory: new Memory({
    storage: new PostgresStore({...}),
    scope: 'resource',
    workingMemory: z.object({
      founder: FounderProfileSchema,
      startup: StartupInfoSchema,
    }),
  }),
});
```

---

## 🎯 Expected Outcomes

After full implementation:

✅ **Single Source of Truth**: Mastra Memory only (no localStorage)
✅ **Context Continuity**: Agents see full founder history across phases
✅ **Personalized Paths**: Venture vs Bootstrap get different journeys
✅ **Adaptive Coaching**: System learns from founder behavior and adjusts
✅ **Rich Integrations**: GitHub, calendar, revenue tracking via MCP
✅ **Scalable**: Resource-scoped memory works for 1000s of founders

---

## 📚 References

- **Mastra Docs**: https://mastra.ai/en/docs
- **Memory Guide**: https://mastra.ai/en/docs/memory/overview
- **Workflow Branching**: https://mastra.ai/en/docs/workflows/control-flow
- **MCP Integration**: https://mastra.ai/en/docs/tools-mcp/mcp-overview
