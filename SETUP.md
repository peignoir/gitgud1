# 🚀 GitGud Setup Guide

## Quick Start

```bash
# 1. Install dependencies
cd mobile-app
npm install

# 2. Set up environment variables
cp .env.local.example .env.local

# Edit .env.local with your API keys:
# OPENAI_API_KEY=sk-...
# GOOGLE_CLIENT_ID=...
# GOOGLE_CLIENT_SECRET=...
# NEXTAUTH_SECRET=...
# DATABASE_URL=file:./gitgud.db

# 3. Run the app
npm run dev

# Open http://localhost:3000
```

## Environment Variables

### Required

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `OPENAI_API_KEY` | OpenAI API key for GPT-4o | https://platform.openai.com/api-keys |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | https://console.cloud.google.com/ |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | https://console.cloud.google.com/ |
| `NEXTAUTH_SECRET` | NextAuth session secret | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | App URL | `http://localhost:3000` |

### Optional

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `ANTHROPIC_API_KEY` | Claude API for enhanced analysis | https://console.anthropic.com/ |
| `GOOGLE_AI_API_KEY` | Gemini API for search capabilities | https://makersuite.google.com/app/apikey |
| `DATABASE_URL` | Database connection string | Default: `file:./gitgud.db` |

## Architecture Overview

### The 6-Phase Founder Journey

1. **Welcome** - Fun introduction to the program
2. **Discovery** - AI researches LinkedIn + market (Researcher Agent)
3. **Profile** - Creates founder bio + archetype (Profiler Agent)  
4. **Challenge** - 60-90 min vibe code session (Coach Agent)
5. **Evaluation** - VC-style assessment (Evaluator Agent)
6. **Sprint** - 3-week program with OKRs (Mentor Agent)

### Agent System

Each phase uses a specialized AI agent:

```
📊 Phase Flow:
Welcome → Researcher → Profiler → Coach → Evaluator → Mentor
           (tools)     (tools)              (tools)     (tools)
```

**Agents:**
- **Researcher**: LinkedIn + web research
- **Profiler**: Bio generation + founder archetypes  
- **Coach**: Real-time challenge coaching
- **Evaluator**: VC-style scoring and categorization
- **Mentor**: 3-week sprint mentorship with OKRs

**Tools (shared across agents):**
- `linkedin-research`: Analyze LinkedIn profiles
- `web-research`: Search markets, trends, competitors
- `founder-assessment`: Evaluate founder potential

### Clean Code Structure

```
mobile-app/src/
├── lib/
│   ├── agents/              # 🤖 AI Agents
│   │   ├── tools/           # 🔧 Reusable tools
│   │   ├── researcher.agent.ts
│   │   ├── profiler.agent.ts
│   │   ├── coach.agent.ts
│   │   ├── evaluator.agent.ts
│   │   └── mentor.agent.ts
│   ├── mastra/
│   │   └── config.ts        # Mastra + Memory setup
│   └── workflows/
│       └── founder-journey.workflow.ts  # 🌊 Branching workflow
├── app/
│   ├── api/founder-journey/
│   │   ├── route.ts         # State management
│   │   └── stream/route.ts  # 📡 Streaming agents
│   ├── founder-journey/
│   │   └── page.tsx         # Main journey orchestrator
│   └── page.tsx             # Landing page
└── components/journey/      # 🎨 Phase UI
    ├── WelcomePhase.tsx
    ├── DiscoveryPhase.tsx
    ├── ProfilePhase.tsx
    ├── ChallengePhase.tsx
    ├── EvaluationPhase.tsx
    └── SprintPhase.tsx
```

## Key Features

### 🔥 Real-time Streaming

All agents stream responses in real-time using Server-Sent Events (SSE):

```typescript
// API automatically streams agent responses
const response = await fetch('/api/founder-journey/stream', {
  method: 'POST',
  body: JSON.stringify({ phase: 'discovery', ... })
});

// Components receive chunks as they're generated
data: { "type": "chunk", "content": "Based on your..." }
```

### 🧠 Persistent Memory

Mastra Memory tracks state across the entire journey:

```typescript
// Automatically saved after each phase
{
  phase: 'profile',
  linkedinUrl: '...',
  research: { ... },
  profile: { bio: '...', archetype: 'Builder' },
  // ... continues through all phases
}
```

### 🔀 Workflow Branching

Easy to extend with new phases:

```typescript
.branch(({ result }) => result.phase, {
  welcome: { then: handleWelcome },
  discovery: { then: useResearcherAgent },
  // ✨ Add your new phase here
  myPhase: { then: useMyAgent },
})
```

### 🐛 Built-in Debugging

Development mode shows:
- Current phase
- Data keys in state
- Full state JSON
- Console logs with emojis for easy scanning

```
🚀 Founder journey stream started { phase: 'discovery', userId: '...' }
💬 Agent prompt { agent: 'researcher', promptLength: 245 }
✅ Stream completed successfully
```

## Adding Features

### Add a New Agent

See `ARCHITECTURE.md` for detailed instructions. Quick example:

```typescript
// 1. Create lib/agents/my-agent.agent.ts
export const myAgent = new Agent({
  name: 'my-agent',
  instructions: 'You are a specialized agent for...',
  model: openai('gpt-4o'),
  tools: { /* optional tools */ },
});

// 2. Register in lib/mastra/config.ts
export const mastra = new Mastra({
  agents: [researcherAgent, myAgent],
});

// 3. Use in workflow
myPhase: {
  then: async ({ result }) => {
    const agent = mastra.getAgent('my-agent');
    return await agent.generate(prompt);
  }
}
```

### Add a New Tool

```typescript
// lib/agents/tools/my-tool.tool.ts
export const myTool = createTool({
  id: 'my-tool',
  description: 'Does something useful',
  inputSchema: z.object({ param: z.string() }),
  outputSchema: z.object({ result: z.string() }),
  execute: async ({ inputData }) => {
    // Your logic
    return { result: '...' };
  },
});

// Add to agent's tools
tools: { myTool }
```

### Add a New Phase

1. Add to workflow branch
2. Create UI component
3. Add to journey page
4. Done! 🎉

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd mobile-app
vercel

# Set environment variables in Vercel dashboard
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY mobile-app/package*.json ./
RUN npm install
COPY mobile-app .
RUN npm run build
CMD ["npm", "start"]
```

## Troubleshooting

### "Agent not found"
- Check agent is registered in `lib/mastra/config.ts`
- Verify agent name matches in workflow

### Streaming not working
- Check API route is using `ReadableStream`
- Verify SSE format: `data: {...}\n\n`

### Memory not persisting
- Check `DATABASE_URL` is set
- Verify `resourceId` is consistent (use userId)

### TypeScript errors
- Run `npm install` to get latest types
- Check Mastra version: `npm list @mastra/core`

## Performance

- **First agent call**: ~500ms (loading)
- **Subsequent calls**: ~100ms (cached)
- **Streaming latency**: <50ms (first token)
- **Full response**: 2-5s (depending on length)

## Testing

```bash
# Run type checks
npm run type-check

# Run linter
npm run lint

# Test agent locally
# Create test-agent.ts and run with ts-node
```

## Resources

- **Mastra Docs**: https://mastra.ai/en/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs

## Support

Questions? Check:
1. `ARCHITECTURE.md` - Deep dive into architecture
2. `CLAUDE.md` - Project context for AI assistants
3. Console logs - Extensive emoji-coded logging

---

**Built with Mastra 🤖 • Next.js ⚡ • TypeScript 🔷**
