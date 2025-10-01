# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the **GitGud AI** repository - a comprehensive founder development platform with AI-powered workflows.

## 🎯 Project Overview

**GitGud AI** is a mobile-first founder development platform that guides entrepreneurs through a structured journey from LinkedIn onboarding to 3-week sprint execution. Built with **Next.js 15**, **Mastra workflows**, **LibSQL memory**, and **NextAuth**, it features a visual workflow lab, admin interfaces, and console-driven interactions.

## 🚀 Quick Launch

The development server is already running on **http://localhost:3001**

### Available Interfaces:
- **Main App**: http://localhost:3001
- **🔬 Workflow Lab** (Visual Editor + Auto-play): http://localhost:3001/test-workflow
- **📊 Dashboard**: http://localhost:3001/dashboard
- **👤 User Flow Testing**: http://localhost:3001/user-flow
- **⚙️ Admin Panel**: http://localhost:3001/admin

### Development Commands
```bash
# Mobile App (Next.js - Port 3001)
cd mobile-app && npm run dev    # Start development server
cd mobile-app && npm run build  # Production build
cd mobile-app && npm run lint   # ESLint check

# Console Mode (Terminal-based AI)
npm run console                 # Start terminal AI console
npm run app                     # Shortcut for mobile app
```

## 🏗️ Current Architecture

This is a **dual-mode application**:
1. **Mobile App** (`mobile-app/`) - Next.js 15 web app with founder journey workflow
2. **Console Mode** (`src/console/`) - Terminal-based AI chat with specialized agents

### Main Application (`mobile-app/`)
```
mobile-app/src/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── dashboard/page.tsx          # Admin startup dashboard
│   ├── admin/page.tsx              # System admin panel (4 tabs)
│   ├── test-workflow/page.tsx      # 🎯 Visual workflow lab (CORE FEATURE)
│   ├── user-flow/page.tsx          # User flow testing environment
│   └── api/
│       ├── chat/                   # Chat endpoints (streaming)
│       ├── workflow-editor/        # Live file editing API
│       └── auth/[...nextauth]/     # Google OAuth
│
├── components/
│   ├── TopNavigation.tsx           # Main navigation (admin access control)
│   ├── OnboardingFlow.tsx          # 3-phase onboarding system
│   ├── ChatInterface.tsx           # Post-onboarding chat interface
│   └── onboarding/
│       ├── Phase1Welcome.tsx       # LinkedIn URL collection
│       ├── Phase2Profile.tsx       # Founder profile display
│       └── Phase3Challenge.tsx     # Vibe code challenge
│
└── lib/
    ├── mastra/
    │   └── config.ts               # LibSQL memory configuration
    └── workflows/
        ├── founder-workflow.ts     # 🎯 Main workflow orchestrator (5 steps)
        ├── schemas.ts              # Zod type definitions
        └── steps/                  # Individual workflow steps
            ├── onboarding.ts
            ├── assessment.ts
            ├── house-classification.ts
            ├── challenge.ts
            └── sprint.ts

### Console Application (`src/console/`)
```
src/console/
├── agents/                      # Specialized AI agents
│   ├── personality.ts           # Shared personality traits
│   ├── scout.ts                 # Research specialist
│   ├── analyst.ts               # Analysis specialist
│   ├── mentor.ts                # Guidance specialist
│   └── scoring.ts               # Angel investor evaluation
├── commands/
│   └── index.ts                 # Command system (/help, /timer, /route, etc.)
├── utils/
│   ├── timer.ts                 # Timer functionality
│   ├── router.ts                # Intelligent agent routing
│   └── openai-streaming.ts      # Direct OpenAI streaming
├── index.ts                     # Main console entrypoint
└── app-mode.ts                  # App mode integration
```

## 🔬 Core Features

### 1. Founder Journey (5-Phase Flow)
**PRIMARY USER EXPERIENCE** - Complete founder onboarding and development:
1. **Welcome** → LinkedIn URL collection, timezone detection
2. **Profile** → AI-generated founder bio from LinkedIn analysis (Researcher + Profiler agents)
3. **Challenge** → Personalized challenge selection based on profile
4. **Evaluation** → Challenge assessment and scoring (Evaluator agent)
5. **Sprint** → 3-week structured program (Coach + Mentor agents)

### 2. Mastra Agent System (5 Specialized Agents)
**Mobile App Agents** - Handle founder journey workflow:
- **Researcher** → LinkedIn URL analysis and profile extraction
- **Profiler** → Bio generation and profile summary creation
- **Coach ("Guddy")** → Real-time coaching during Vibe Code Challenge
  - Personality: Steve Blank + Brad Feld + Paul Graham + Eric Ries
  - Greets founder by name after profile phase
  - Tool recommendations by skill level:
    - Beginners: Lovable, Bolt, v0.dev (no-code)
    - Intermediate: Replit, DeepSite (online IDE + AI)
    - Advanced: Cursor, DeepSeek, Claude Code (AI coding)
  - Technical founders → business model coaching
  - Business founders → MVP execution coaching
  - Uses web research for real startup examples
- **Evaluator** → Challenge assessment and house classification
- **Mentor** → 3-week sprint guidance and accountability

**Console Agents** - Terminal-based specialized assistants:
- **Scout** 🕵️ → Research and exploration specialist
- **Analyst** 📊 → Deep analysis and strategy specialist
- **Mentor** 🧭 → Guidance and validation specialist
- **Scoring** 💰 → Angel investor evaluation (0-100 scoring)

### 3. Memory & Persistence
- **PostgreSQL Storage**: Supabase-hosted database via `@mastra/pg` PostgresStore
- **Mastra Memory**: Agents automatically store/retrieve conversation history
- **Cross-session**: Memory persists across sessions and deployments
- **Thread-based**: Each phase (welcome, profile, challenge, etc.) has dedicated thread
- **Resource-scoped**: Memory tied to user email for multi-user isolation
- **LocalStorage**: Client-side journey state backup for UX resilience

### 4. Authentication
- **NextAuth.js**: Google OAuth integration
- **Session Management**: Secure session handling
- **Admin Access Control**: Restricted interfaces for `franck@recorp.co`

## 🛠️ Technical Implementation

### Mastra Workflow System
```typescript
// Main workflow in src/lib/workflows/founder-workflow.ts
export const founderWorkflow = createWorkflow({
  id: 'founder-journey',
  inputSchema: FounderWorkflowInputSchema,
  outputSchema: FounderWorkflowOutputSchema,
})
.then(async ({ input, context }) => {
  // Switch-based execution for different workflow steps
  switch (action) {
    case 'start': return await onboardingStep.execute(...)
    case 'assessment': return await assessmentStep.execute(...)
    // ... other steps
  }
})
```

### Streaming Response System
Key features for real-time AI interactions:
- **Server-Sent Events (SSE)**: Real-time streaming from OpenAI
- **Direct OpenAI Integration**: `src/console/utils/openai-streaming.ts` for console mode
- **Vercel AI SDK**: `ai` package for mobile app streaming
- **Streaming Endpoints**: `/api/founder-journey/stream` for journey phases
- **Visual Feedback**: Animated indicators during AI processing

### Memory Configuration
```typescript
// mobile-app/src/lib/mastra/config.ts
export const memory = new Memory({
  storage: new PostgresStore({
    host: 'db.kbapahwhnonxpnitlrxf.supabase.co',
    port: 5432,
    user: 'postgres',
    database: 'postgres',
    password: process.env.SUPABASE_PASSWORD,
    ssl: { rejectUnauthorized: false }
  }),
});
```

**Note**: Memory system uses **Supabase PostgreSQL** with `@mastra/pg` PostgresStore for persistent, cloud-based memory across sessions.

## 🔧 Key Environment Variables

### Required in `mobile-app/.env.local`:
```bash
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-secret

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# OpenAI API
OPENAI_API_KEY=your-openai-key

# Supabase PostgreSQL (for Mastra Memory)
DATABASE_URL=postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres?sslmode=require

# Tavily API (for web research tools)
TAVILY_API_KEY=your-tavily-key
```

### Required in root `.env` (for console mode):
```bash
OPENAI_API_KEY=your-openai-key
```

### Important: pgvector Extension
Before deploying, enable pgvector in your Supabase database:
```sql
create extension if not exists vector;
```
Run this in Supabase SQL Editor or enable via Database → Extensions → "vector"

## 🎯 For Another AI Taking Over

### Primary Focus Areas:
1. **Founder Journey Flow** (`/founder-journey`) - Main 5-phase user experience
2. **Mastra Agents** - 5 specialized agents (Researcher, Profiler, Coach, Evaluator, Mentor)
3. **Memory System** - PostgreSQL-backed persistent memory via `@mastra/memory`
4. **Console Mode** - Terminal-based AI chat with Scout/Analyst/Mentor/Scoring agents
5. **Admin Access** - Restricted to `franck@recorp.co` for admin interfaces

### Current Status:
✅ **Completed Features:**
- 5-phase founder journey (Welcome → Profile → Challenge → Evaluation → Sprint)
- 5 Mastra agents with specialized tools (LinkedIn research, web research, assessment)
- **Mastra Memory with PostgreSQL**: All memory stored in Supabase, no Mem0 dependency
- Google OAuth authentication with NextAuth
- Dual-mode architecture (Mobile App + Terminal Console)
- Terminal console with 4 agents (Scout, Analyst, Mentor, Scoring)
- Command system with timer, routing, and flow visualization
- Real-time streaming responses using Server-Sent Events
- **Production-ready**: Designed for Vercel deployment with Supabase backend

### Architecture Patterns:
- **Dual-mode**: Separate mobile app and terminal console codebases
- **Phase-based**: Journey flows through 5 distinct phases with state persistence
- **Agent-driven**: Mastra agents handle LinkedIn analysis, research, coaching, evaluation
- **Memory-persistent**: PostgreSQL-backed memory via Supabase for cross-session state
- **Streaming-first**: Server-Sent Events for real-time AI responses
- **Mobile-optimized**: Next.js 15 with React 19 for smooth mobile experience

### Important Files to Understand:
1. `mobile-app/src/app/founder-journey/page.tsx` - Main journey orchestrator with phase management
2. `mobile-app/src/lib/workflows/founder-workflow.ts` - Mastra workflow with 5 steps
3. `mobile-app/src/lib/mastra/config.ts` - Mastra configuration with PostgreSQL memory
4. `mobile-app/src/lib/agents/*.agent.ts` - 5 specialized agents (researcher, profiler, coach, evaluator, mentor)
5. `src/console/index.ts` - Terminal console entrypoint
6. `src/console/agents/*.ts` - Console agents (scout, analyst, mentor, scoring)

### Testing Approach:

**Mobile App:**
1. Start dev server: `cd mobile-app && npm run dev`
2. Visit http://localhost:3001
3. Sign in with Google OAuth
4. Test founder journey flow: http://localhost:3001/founder-journey
5. Go through phases: Welcome → Profile → Challenge → Evaluation → Sprint

**Console Mode:**
1. Start console: `npm run console`
2. Test commands: `/help`, `/timer start`, `/route <query>`, `/auto on`
3. Switch agents: `/scout`, `/analyst`, `/mentor`
4. Test intelligent routing with various queries

**Key Testing Points:**
- Memory persistence across sessions (reload page, data should persist)
- Streaming responses in both modes
- Agent routing logic in console mode
- Phase transitions in founder journey
- LinkedIn profile research and analysis