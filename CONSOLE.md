# GitGud AI Console

A clean, terminal-based interactive chat application using OpenAI with Mastra framework.

## ✨ Features

- **3 Specialized Agents**: Scout 🕵️, Analyst 📊, and Mentor 🧭
- **Interactive Chat**: Real-time conversations with streaming responses
- **Timer Functionality**: Built-in timer with start/stop/status commands
- **Command System**: Extensible command system with `/help`
- **Time Awareness**: Agents are aware of current time and running timers
- **Clean Architecture**: Organized agent files and modular design

## 🚀 Quick Start

1. **Set up environment**:
   ```bash
   # Copy environment file
   cp .env.example .env

   # Add your OpenAI API key
   echo "OPENAI_API_KEY=your_key_here" >> .env
   ```

2. **Run the console**:
   ```bash
   npm run console
   ```

## 🤖 Agents

### Scout 🕵️
- **Purpose**: Research and exploration specialist
- **Best for**: Market research, trend analysis, competitive intelligence
- **Style**: Structured analysis with key findings

### Analyst 📊
- **Purpose**: Deep analysis and strategic thinking
- **Best for**: Business analysis, strategic planning, risk assessment
- **Style**: Framework-based analysis (SWOT, etc.) with recommendations

### Mentor 🧭
- **Purpose**: Guidance and validation specialist
- **Best for**: Startup mentorship, decision making, problem solving
- **Style**: Probing questions, actionable advice, encouragement

## 🔧 Commands

| Command | Description | Usage |
|---------|-------------|-------|
| `/help` | Show available commands | `/help [command]` |
| `/timer` | Timer functionality | `/timer start/stop/status [description]` |
| `/scout` | Switch to Scout agent | `/scout` |
| `/analyst` | Switch to Analyst agent | `/analyst` |
| `/mentor` | Switch to Mentor agent | `/mentor` |
| `/clear` | Clear console | `/clear` |
| `/exit` | Exit application | `/exit` or `/quit` |

## ⏰ Timer Examples

```bash
# Start a work session timer
/timer start "Feature development"

# Check timer status
/timer status

# Stop timer and see duration
/timer stop
```

## 💬 Example Conversation

```
🕵️ Scout: Current Agent: Scout
Description: Research and exploration specialist

🕵️ You: What are the latest trends in AI startups?

🕵️ Scout: Based on current market analysis, here are the key trends in AI startups:

1. **Vertical AI Solutions** - Industry-specific AI tools (healthcare, finance, legal)
2. **AI Infrastructure** - Tools for building and deploying AI models
3. **Generative AI Applications** - Beyond ChatGPT clones, specialized content creation
4. **AI Agents & Automation** - Autonomous task completion systems
5. **Edge AI** - On-device AI processing for privacy and speed

/analyst

📊 Analyst: Switched to Analyst agent

📊 You: Analyze the market opportunity for AI agents

📊 Analyst: **Market Analysis: AI Agents Opportunity**

**Market Size**
- Current: $4.8B (2024)
- Projected: $28.5B by 2030
- CAGR: 34.2%

**Key Segments**
1. Enterprise automation (45% market share)
2. Customer service (28%)
3. Personal productivity (15%)
4. Development tools (12%)

**Strategic Recommendations**
- Focus on specific vertical markets initially
- Build strong API ecosystem
- Prioritize security and compliance
- Consider freemium model for adoption
```

## 🏗️ Architecture

```
src/console/
├── agents/           # Agent definitions
│   ├── personality.ts   # Shared personality traits
│   ├── scout.ts        # Research specialist
│   ├── analyst.ts      # Analysis specialist
│   └── mentor.ts       # Guidance specialist
├── commands/         # Command system
│   └── index.ts        # Command handlers
├── utils/           # Utilities
│   └── timer.ts        # Timer functionality
└── index.ts         # Main application
```

## 🔧 Extending

### Add New Commands

```typescript
// In src/console/commands/index.ts
this.register({
  name: 'mynewcommand',
  description: 'Description of what it does',
  usage: '/mynewcommand [args]',
  execute: (args: string[]) => {
    // Command logic here
    return false; // true to exit app
  }
});
```

### Add New Agents

```typescript
// Create src/console/agents/newagent.ts
import { Agent } from '@mastra/core';
import { openai } from '@ai-sdk/openai';
import { PERSONALITY } from './personality';

export const createNewAgent = () => {
  return new Agent({
    name: 'newagent',
    model: openai('gpt-4o'),
    instructions: `${PERSONALITY.core_instructions}

You are the NEW AGENT with specific capabilities...`,
    tools: []
  });
};
```

## 🎯 Next Steps

This clean foundation is ready for building more complex flows:

1. **Add Web Search Tools** - Integrate real-time search capabilities
2. **Custom Commands** - Add domain-specific commands
3. **Session Persistence** - Save and restore chat sessions
4. **Agent Collaboration** - Multi-agent workflows
5. **Plugin System** - Modular tool extensions

---

**Ready to build something amazing!** 🚀