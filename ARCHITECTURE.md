# GitGud - Clean Agentic Architecture

## 🎯 Overview

GitGud is a founder evaluation and acceleration platform powered by Mastra's agentic AI framework. It takes founders from LinkedIn discovery through a vibe code challenge to a personalized 3-week sprint program.

## 🏗️ Architecture

### Clean Separation of Concerns

```
mobile-app/
├── src/
│   ├── lib/
│   │   ├── agents/              # ⭐ Specialized AI agents
│   │   │   ├── tools/           # Tools agents can use
│   │   │   │   ├── linkedin-research.tool.ts
│   │   │   │   ├── web-research.tool.ts
│   │   │   │   └── founder-assessment.tool.ts
│   │   │   ├── researcher.agent.ts    # LinkedIn + web research
│   │   │   ├── profiler.agent.ts      # Bio generation + archetypes
│   │   │   ├── coach.agent.ts         # Challenge coaching
│   │   │   ├── evaluator.agent.ts     # VC-style evaluation
│   │   │   └── mentor.agent.ts        # 3-week sprint mentorship
│   │   │
│   │   ├── mastra/              # Mastra configuration
│   │   │   └── config.ts        # Initialize agents + memory
│   │   │
│   │   └── workflows/           # ⭐ Workflow orchestration
│   │       └── founder-journey.workflow.ts  # Main branching workflow
│   │
│   ├── app/
│   │   ├── api/
│   │   │   └── founder-journey/
│   │   │       ├── route.ts          # State management API
│   │   │       └── stream/
│   │   │           └── route.ts      # ⭐ Streaming agent responses
│   │   ├── founder-journey/
│   │   │   └── page.tsx              # Main journey orchestrator
│   │   └── page.tsx                  # Landing page
│   │
│   └── components/
│       └── journey/                  # ⭐ Phase-specific UI
│           ├── WelcomePhase.tsx      # Phase 1: Introduction
│           ├── DiscoveryPhase.tsx    # Phase 2: Research
│           ├── ProfilePhase.tsx      # Phase 3: Bio creation
│           ├── ChallengePhase.tsx    # Phase 4: Vibe code
│           ├── EvaluationPhase.tsx   # Phase 5: Assessment
│           └── SprintPhase.tsx       # Phase 6: 3-week program
```

## 🤖 Agents

Each agent is a specialized AI with specific tools, instructions, and personality:

### 1. Researcher Agent
- **Role**: Discover founder background and market
- **Tools**: `linkedin-research`, `web-research`
- **Output**: Comprehensive founder dossier with market fit

### 2. Profiler Agent
- **Role**: Create compelling founder bios and identify archetypes
- **Tools**: `founder-assessment`
- **Output**: 2-3 paragraph bio + archetype (Builder/Visionary/Operator/Researcher)

### 3. Coach Agent
- **Role**: Real-time coaching during challenge
- **Tools**: None (conversational)
- **Output**: Focused, actionable guidance based on time remaining

### 4. Evaluator Agent
- **Role**: VC-style evaluation of submissions
- **Tools**: `web-research` (for market validation)
- **Output**: Score (0-100) + Category (VC-backable/Bootstrap/Pivot) + Feedback

### 5. Mentor Agent
- **Role**: 3-week sprint mentorship with OKRs
- **Tools**: `web-research` (for best practices)
- **Output**: Weekly OKRs + personalized mentorship + startup wisdom

## 🌊 Workflow System

### Founder Journey Workflow

Uses Mastra's `.branch()` for clean phase routing:

```typescript
founderJourneyWorkflow
  .then(initializeContext)
  .branch(({ result }) => result.phase, {
    welcome: { then: handleWelcome },
    discovery: { then: useResearcherAgent },
    profile: { then: useProfilerAgent },
    challenge: { then: useCoachAgent },
    evaluation: { then: useEvaluatorAgent },
    sprint: { then: useMentorAgent },
  })
  .commit();
```

**Benefits:**
- ✅ Single workflow definition
- ✅ Easy to add new phases
- ✅ Clear agent-to-phase mapping
- ✅ Built-in error handling and logging
- ✅ State persistence via Mastra Memory

## 🔧 Tools

Tools are reusable functions agents can call:

```typescript
export const linkedinResearchTool = createTool({
  id: 'linkedin-research',
  description: 'Analyze LinkedIn profile...',
  inputSchema: z.object({ linkedinUrl: z.string(), ... }),
  outputSchema: z.object({ profile: ..., analysis: ... }),
  execute: async ({ context, inputData }) => {
    // Tool logic here
  },
});
```

**Adding a New Tool:**

1. Create file in `lib/agents/tools/your-tool.tool.ts`
2. Use `createTool()` with Zod schemas
3. Implement `execute` function
4. Import and add to agent's `tools` object

## 📡 Streaming API

The streaming API provides real-time responses:

```typescript
// API: /api/founder-journey/stream
POST {
  phase: 'discovery',
  userId: 'user-id',
  data: { linkedinUrl: '...' }
}

// Returns Server-Sent Events (SSE):
data: { "type": "start", "agent": "researcher", "phase": "discovery" }
data: { "type": "chunk", "content": "Based on your..." }
data: { "type": "chunk", "content": " LinkedIn profile..." }
data: { "type": "complete", "fullText": "..." }
```

**Using in Components:**

```typescript
const reader = response.body?.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  // Parse SSE format and update UI
}
```

## 🎨 UI Components

Each phase has a dedicated component:

### Phase Component Pattern

```typescript
interface PhaseProps {
  data: Record<string, any>;    // Previous phase data
  onNext: (data: any) => void;  // Complete phase + advance
}

export function MyPhase({ data, onNext }: PhaseProps) {
  // 1. Stream agent response
  // 2. Display with beautiful UI
  // 3. Collect user input if needed
  // 4. Call onNext() with phase data
}
```

**Benefits:**
- Clean props interface
- Easy to test in isolation
- Reusable patterns across phases
- Built-in streaming support

## 🧠 Memory System

Mastra Memory tracks state across the journey:

```typescript
const memory = new Memory({
  storage: { client: libsqlClient, type: 'libsql' },
  options: {
    workingMemory: {
      enabled: true,
      template: `
        Track: name, linkedinUrl, phase, profile, archetype,
        assessment, challenge, sprint, timeCommitment
      `
    },
    conversationHistory: {
      enabled: true,
      maxMessages: 100
    }
  }
});
```

**Accessing Memory:**

```typescript
// Save
await memory.save({
  resourceId: userId,
  messages: [],
  data: { phase: 'profile', bio: '...' }
});

// Retrieve
const state = await memory.retrieve({ resourceId: userId });
```

## 🚀 Adding New Features

### Add a New Agent

1. **Create agent file**: `lib/agents/my-agent.agent.ts`

```typescript
import { Agent } from '@mastra/core';
import { openai } from '@ai-sdk/openai';

export const myAgent = new Agent({
  name: 'my-agent',
  instructions: `You are a specialized agent for...`,
  model: openai('gpt-4o'),
  tools: { /* your tools */ },
});
```

2. **Register in config**: `lib/mastra/config.ts`

```typescript
export const mastra = new Mastra({
  agents: [
    researcherAgent,
    myAgent,  // ← Add here
  ],
});
```

3. **Use in workflow**: `lib/workflows/founder-journey.workflow.ts`

```typescript
myPhase: {
  then: async ({ result, context }) => {
    const agent = mastra.getAgent('my-agent');
    const result = await agent.generate(prompt, { resourceId });
    return { success: true, data: result.text };
  }
}
```

### Add a New Tool

1. **Create tool file**: `lib/agents/tools/my-tool.tool.ts`

```typescript
import { createTool } from '@mastra/core';
import { z } from 'zod';

export const myTool = createTool({
  id: 'my-tool',
  description: 'Does something useful',
  inputSchema: z.object({ param: z.string() }),
  outputSchema: z.object({ result: z.string() }),
  execute: async ({ context, inputData }) => {
    // Your logic
    return { result: '...' };
  },
});
```

2. **Add to agent**: In agent definition

```typescript
tools: {
  myTool,  // ← Add here
}
```

### Add a New Phase

1. **Add to workflow branch**: `lib/workflows/founder-journey.workflow.ts`

```typescript
.branch(({ result }) => result.phase, {
  // ... existing phases
  myPhase: {
    then: async ({ result, context }) => {
      const agent = mastra.getAgent('my-agent');
      // Phase logic
    }
  }
})
```

2. **Create UI component**: `components/journey/MyPhase.tsx`

```typescript
export function MyPhase({ data, onNext }: PhaseProps) {
  // Stream agent response
  // Display UI
  // Handle user interaction
  // Call onNext() when complete
}
```

3. **Add to main journey page**: `app/founder-journey/page.tsx`

```typescript
{journeyState.currentPhase === 'myPhase' && (
  <MyPhase data={journeyState.data} onNext={handlePhaseComplete} />
)}
```

## 🐛 Debugging

### Built-in Debug Panel

Development mode includes a debug panel showing:
- Current phase
- Data keys in state
- Full state JSON

### Logging

Agents and workflows log to console:

```typescript
console.log('🚀 Founder journey stream started', { phase, userId });
console.log('✅ Stream completed successfully');
console.error('💥 Stream error:', error);
```

### Memory Inspection

Check stored state:

```typescript
const state = await memory.retrieve({ resourceId: userId });
console.log('Current state:', state);
```

## 📊 Flow Diagram

```
Welcome (static)
    ↓
Discovery (researcher agent)
    ↓
Profile (profiler agent)
    ↓
Challenge (coach agent)
    ↓
Evaluation (evaluator agent)
    ↓
Sprint Week 1-3 (mentor agent)
    ↓
Graduate/Dashboard
```

## 🎯 Key Design Principles

1. **Agent Specialization**: Each agent has ONE clear role
2. **Tool Reusability**: Tools can be shared across agents
3. **Workflow Branching**: Use `.branch()` for phase routing
4. **Streaming First**: All agent responses stream in real-time
5. **State Persistence**: Mastra Memory tracks the full journey
6. **UI Independence**: Components work standalone for testing
7. **Easy Extensibility**: Add agents/tools/phases without touching existing code

## 🔥 Performance Tips

- **Agents cache in memory**: First call loads, subsequent calls reuse
- **Streaming reduces perceived latency**: Users see output immediately
- **Memory is persistent**: State survives page refreshes
- **Tools are lazy-loaded**: Only execute when agent calls them

## 📚 Further Reading

- [Mastra Docs](https://mastra.ai/en/docs)
- [Mastra Workflows](https://mastra.ai/en/docs/workflows/overview)
- [Mastra Agents](https://mastra.ai/en/docs/agents/overview)
- [Mastra Tools](https://mastra.ai/en/docs/tools-mcp/overview)

---

**Built with ❤️ using Mastra, Next.js, and TypeScript**
