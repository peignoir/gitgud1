# GitGud - Simplified Codebase

**Last updated:** Sept 30, 2025

## Core Philosophy
**Stupid easy to maintain.** No fluff, no unused code, straight to the point.

---

## 🎯 User Flow (5 Steps)

1. **/** → Auto-redirect to `/founder-journey`
2. **/founder-journey** → Shows login if not authenticated
3. **Welcome** → Enter LinkedIn URL
4. **Profile** → Guddy generates bio (uses Mem0 + web research)
5. **Challenge** → 60-90min vibe code with Guddy coaching
6. **Evaluation** → Guddy reviews submission
7. **Sprint** → 3-week mentorship with OKRs

---

## 📁 File Structure (What Matters)

```
mobile-app/src/
├── app/
│   ├── page.tsx                    # Root: just redirects to /founder-journey
│   ├── founder-journey/page.tsx    # Main flow controller (phases, auth)
│   ├── api/
│   │   ├── founder-journey/stream/route.ts  # AI streaming endpoint
│   │   └── auth/[...nextauth]/route.ts      # WebAuthn auth
│   
├── components/journey/
│   ├── WelcomePhase.tsx           # LinkedIn URL input
│   ├── ProfilePhase.tsx           # Bio generation
│   ├── ChallengePhase.tsx         # 60-90min challenge + chat
│   ├── EvaluationPhase.tsx        # Submission review
│   └── SprintPhase.tsx            # 3-week mentorship
│
├── lib/agents/
│   ├── profiler.agent.ts          # Bio generation (web research)
│   ├── coach.agent.ts             # Challenge coaching
│   ├── evaluator.agent.ts         # Submission scoring
│   ├── mentor.agent.ts            # Sprint mentorship
│   └── researcher.agent.ts        # Market research
│
├── lib/utils/
│   ├── linkify.tsx                # Make URLs clickable
│   └── mem0-client.ts             # ✅ Long-term memory utilities
│
└── lib/mastra/config.ts           # Mastra + Memory setup
```

---

## 🧠 Memory Stack

- **LibSQL** (local dev): `gitgud.db` - working memory + chat history (current session)
- **Mem0** ✅ (INTEGRATED): Long-term AI memory - Guddy remembers founders across sessions
- **Future**: Turso for cloud LibSQL (when scaling multi-user)

---

## 🤖 Guddy Personality

> "Guddy knows you. She taps into YC/Techstars wisdom + common sense. But mainly: founders git gud on their own. She's here to keep you on track, not do it for you."

All 5 agents (Profiler, Coach, Evaluator, Mentor, Researcher) share this personality.

---

## 🔧 Environment Variables

```bash
# AI
OPENAI_API_KEY=sk-...
TAVILY_API_KEY=tvly-...        # Web search for bio research
MEM0_API_KEY=m0-...            # ✅ Long-term memory (ACTIVE)

# Auth
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3001
```

---

## 🚀 Run Commands

```bash
# Mobile app (Next.js)
npm run app

# Console mode (CLI agents)
npm run console
```

---

## ✅ What We Removed

- ❌ Discovery phase (unused, skipped straight to Profile)
- ❌ Landing page marketing fluff (/ just redirects now)
- ❌ Unused imports and components

---

## ✅ Recent Updates

**Mem0 Integration (Sept 30, 2025):**
- ✅ Installed `mem0ai` package
- ✅ Created Mem0 client utilities (`lib/utils/mem0-client.ts`)
- ✅ Integrated with API streaming route
- ✅ Guddy now has long-term memory across sessions
- ✅ See `mobile-app/MEM0_INTEGRATION.md` for full docs

**Still TODO:**
- [ ] Per-user session persistence (time left in challenge)
- [ ] Separate memory contexts (founder vs startup info)
- [ ] Dynamic memory updates via chat ("update my bio")
- [ ] Memory management UI

---

**Keep it simple. Ship fast. Git gud.** 🚀
