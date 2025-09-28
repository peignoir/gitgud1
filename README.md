# 🚀 GitGud AI - Universal AI Assistant

A powerful AI assistant app with 4 specialized agents, Google OAuth authentication, and real-time streaming responses. Works on iPhone, Android, and web browsers.

## ✨ Features

- **4 Specialized AI Agents**:
  - 🕵️ **Scout** - Research and exploration
  - 📊 **Analyst** - Strategic analysis + market intelligence
  - 🧭 **Mentor** - Startup guidance + wisdom search
  - 💰 **Scoring** - Angel investor evaluation (0-100 scoring)

- **Authentication**: Google OAuth (Apple Sign In ready)
- **Real-time Streaming**: Server-Sent Events for live AI responses
- **Progressive Web App**: Works on all devices, installable
- **Clean Architecture**: HTTP + SSE (no WebSocket complexity)
- **Dual Mode**: Mobile app + terminal console

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/peignoir/gitgud1.git
cd gitgud1
npm install
cd mobile-app && npm install
```

### 2. Environment Setup

```bash
# Copy example files
cp .env.example .env
cp mobile-app/.env.local.example mobile-app/.env.local
```

### 3. Get API Keys

**Required:**
- **OpenAI API**: https://platform.openai.com/api-keys
- **Google OAuth**: https://console.cloud.google.com/

**Optional:**
- **Google AI**: https://makersuite.google.com/app/apikey
- **Anthropic**: https://console.anthropic.com/

### 4. Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create project → Enable Google+ API
3. Create OAuth 2.0 credentials:
   - Type: Web application
   - Redirect URI: `http://localhost:3000/api/auth/callback/google`
4. Add credentials to `mobile-app/.env.local`

### 5. Run the App

```bash
# Mobile app with authentication
npm run app

# Terminal console mode
npm run console
```

Visit: http://localhost:3000

## 🤖 Meet the Agents

| Agent | Role | Best For |
|-------|------|----------|
| 🕵️ **Scout** | Research & Exploration | Market research, trend analysis, competitive intelligence |
| 📊 **Analyst** | Deep Analysis & Strategy | Business analysis, strategic planning, risk assessment |
| 🧭 **Mentor** | Guidance & Validation | Startup mentorship, decision making, problem solving |

## 🔧 Commands

| Command | Description |
|---------|-------------|
| `/help` | Show available commands |
| `/timer start [description]` | Start a timer |
| `/timer stop` | Stop timer and show duration |
| `/timer status` | Check current timer |
| `/flow` | Show ASCII flow diagram of routing logic |
| `/route <query>` | Test agent routing for a specific query |
| `/auto on/off` | Enable/disable automatic agent routing |
| `/stats` | Show routing statistics and agent capabilities |
| `/scout` | Switch to Scout agent (manual override) |
| `/analyst` | Switch to Analyst agent (manual override) |
| `/mentor` | Switch to Mentor agent (manual override) |
| `/clear` | Clear console |
| `/exit` | Exit application |

## 📁 Project Structure

```
src/
└── console/
    ├── agents/           # Agent definitions
    │   ├── personality.ts   # Shared personality traits
    │   ├── scout.ts        # Research specialist
    │   ├── analyst.ts      # Analysis specialist
    │   └── mentor.ts       # Guidance specialist
    ├── commands/         # Command system
    │   └── index.ts        # Command handlers
    ├── utils/           # Utilities
    │   ├── timer.ts        # Timer functionality
    │   └── router.ts       # Intelligent agent routing
    └── index.ts         # Main application
```

## 🎯 Example Usage

```bash
$ npm run console

🚀 GitGud AI Console
──────────────────────────────────────────────────
Available agents:
  🕵️  Scout   - Research and exploration
  📊 Analyst - Deep analysis and strategy
  🧭 Mentor  - Guidance and validation
──────────────────────────────────────────────────

🕵️ Current Agent: Scout
Description: Research and exploration specialist

💬 Chat started! Type your message or use /help for commands.

🕵️ You: What are the current trends in AI startups?

🕵️ Scout: Based on market analysis, here are the key AI startup trends:

1. **Vertical AI Solutions** - Industry-specific tools
2. **AI Infrastructure** - Model deployment platforms
3. **Generative AI Apps** - Beyond basic chatbots
4. **AI Agents** - Autonomous task completion
5. **Edge AI** - On-device processing

/timer start "Market analysis session"
⏰ Timer started: Market analysis session

/analyst
📊 Switched to Analyst agent

📊 You: Analyze the market opportunity for AI agents
```

## 🔧 Extending

### Add New Commands
```typescript
// In src/console/commands/index.ts
this.register({
  name: 'mycommand',
  description: 'My custom command',
  usage: '/mycommand [args]',
  execute: (args: string[]) => {
    // Your command logic
    return false; // true to exit app
  }
});
```

### Add New Agents
```typescript
// Create src/console/agents/newagent.ts
export const createNewAgent = () => {
  return new Agent({
    name: 'newagent',
    model: openai('gpt-4o'),
    instructions: `${PERSONALITY.core_instructions}

    You are the NEW AGENT...`,
    tools: []
  });
};
```

## 🏗️ Built With

- **[Mastra](https://mastra.ai)** - AI framework
- **[OpenAI](https://openai.com)** - Language models
- **[Inquirer](https://github.com/SBoudrias/Inquirer.js)** - Interactive prompts
- **[Chalk](https://github.com/chalk/chalk)** - Terminal colors
- **[Ora](https://github.com/sindresorhus/ora)** - Loading spinners

## 🎯 Perfect for

- Building AI agent prototypes
- Testing conversation flows
- Learning AI framework integration
- Creating specialized AI assistants
- Rapid AI experimentation

---

**Simple. Clean. Extensible.** Ready to build something amazing! 🚀