import { Agent } from '@mastra/core';
import chalk from 'chalk';
import { globalModelManager } from '../config/models';

export interface RoutingResult {
  selectedAgent: 'scout' | 'analyst' | 'mentor';
  confidence: number;
  reasoning: string;
  suggestedFlow: string[];
}

/**
 * Intelligent router that analyzes user input to determine the best agent
 */
export class AgentRouter {
  private routerAgent: Agent;

  constructor() {
    // Create a specialized router agent
    this.routerAgent = new Agent({
      name: 'router',
      model: globalModelManager.getModelInstance(),
      instructions: `You are an intelligent agent router. Your job is to analyze user queries and determine which agent should handle the request.

Available agents:
- SCOUT 🕵️: Research, exploration, market analysis, trend identification, competitive intelligence
- ANALYST 📊: Deep analysis, strategy, business planning, risk assessment, financial evaluation
- MENTOR 🧭: Guidance, validation, advice, mentorship, problem-solving, decision making

Analyze the user's query and respond with a JSON object containing:
{
  "selectedAgent": "scout|analyst|mentor",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation of why this agent is best",
  "suggestedFlow": ["step1", "step2", "step3"]
}

Consider:
- Keywords and intent
- Type of request (research vs analysis vs advice)
- Complexity level
- Expected output type

Examples:
- "What are AI trends?" → scout (research)
- "Analyze my startup idea" → analyst (evaluation)
- "Should I pivot my business?" → mentor (guidance)
- "Compare competitors" → scout (research) → analyst (analysis)
- "Help me decide between options" → mentor (decision making)`,
      tools: {}
    });
  }

  async route(query: string, conversationHistory: Array<{role: string, content: string}> = []): Promise<RoutingResult> {
    try {
      // Build context from conversation history
      const context = conversationHistory.length > 0
        ? `\nConversation context:\n${conversationHistory.slice(-3).map(msg => `${msg.role}: ${msg.content}`).join('\n')}\n`
        : '';

      const routingPrompt = `${context}
Current user query: "${query}"

Analyze this query and determine the best agent to handle it. Consider the conversation context if provided.`;

      const response = await this.routerAgent.generateVNext(
        [{ role: 'user', content: routingPrompt }],
        {
          temperature: 0.3, // Lower temperature for consistent routing
          maxTokens: 200
        }
      );

      // Parse the JSON response
      const result = this.parseRoutingResponse(response.text);

      console.log(chalk.gray(`🤖 Router: ${result.selectedAgent} (${Math.round(result.confidence * 100)}%) - ${result.reasoning}`));

      return result;
    } catch (error) {
      console.warn(chalk.yellow('⚠️  Router failed, using default scout agent'));
      return {
        selectedAgent: 'scout',
        confidence: 0.5,
        reasoning: 'Fallback to default agent due to routing error',
        suggestedFlow: ['research', 'analyze', 'respond']
      };
    }
  }

  private parseRoutingResponse(responseText: string): RoutingResult {
    try {
      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate required fields
      if (!parsed.selectedAgent || !['scout', 'analyst', 'mentor'].includes(parsed.selectedAgent)) {
        throw new Error('Invalid selectedAgent');
      }

      return {
        selectedAgent: parsed.selectedAgent,
        confidence: Math.max(0, Math.min(1, parsed.confidence || 0.7)),
        reasoning: parsed.reasoning || 'Agent selected based on query analysis',
        suggestedFlow: Array.isArray(parsed.suggestedFlow) ? parsed.suggestedFlow : ['process', 'respond']
      };
    } catch (error) {
      console.warn(chalk.yellow(`⚠️  Failed to parse routing response: ${error}`));

      // Fallback logic based on simple keyword analysis
      return this.simpleKeywordRouting(responseText);
    }
  }

  private simpleKeywordRouting(query: string): RoutingResult {
    const lowerQuery = query.toLowerCase();

    // Scout keywords
    const scoutKeywords = ['research', 'find', 'search', 'trends', 'market', 'competitors', 'industry', 'data', 'information'];
    const scoutMatches = scoutKeywords.filter(keyword => lowerQuery.includes(keyword)).length;

    // Analyst keywords
    const analystKeywords = ['analyze', 'analysis', 'evaluate', 'assess', 'strategy', 'plan', 'compare', 'pros', 'cons', 'swot'];
    const analystMatches = analystKeywords.filter(keyword => lowerQuery.includes(keyword)).length;

    // Mentor keywords
    const mentorKeywords = ['should', 'help', 'advice', 'recommend', 'suggest', 'decide', 'what to do', 'guidance', 'mentor'];
    const mentorMatches = mentorKeywords.filter(keyword => lowerQuery.includes(keyword)).length;

    // Determine best match
    if (scoutMatches >= analystMatches && scoutMatches >= mentorMatches) {
      return {
        selectedAgent: 'scout',
        confidence: Math.min(0.8, 0.5 + scoutMatches * 0.1),
        reasoning: 'Query contains research-oriented keywords',
        suggestedFlow: ['research', 'gather', 'present']
      };
    } else if (analystMatches >= mentorMatches) {
      return {
        selectedAgent: 'analyst',
        confidence: Math.min(0.8, 0.5 + analystMatches * 0.1),
        reasoning: 'Query contains analysis-oriented keywords',
        suggestedFlow: ['analyze', 'evaluate', 'conclude']
      };
    } else {
      return {
        selectedAgent: 'mentor',
        confidence: Math.min(0.8, 0.5 + mentorMatches * 0.1),
        reasoning: 'Query contains advice-seeking keywords',
        suggestedFlow: ['understand', 'guide', 'recommend']
      };
    }
  }

  /**
   * Get visual representation of the current routing logic
   */
  getFlowDiagram(): string {
    return `
┌─────────────────────────────────────────────────────────────┐
│                    🤖 AGENT ROUTER FLOW                     │
└─────────────────────────────────────────────────────────────┘

    User Query
        │
        ▼
┌─────────────────┐
│  Context        │
│  Analysis       │ ◄──── Conversation History
│  • Keywords     │
│  • Intent       │
│  • Complexity   │
└─────────────────┘
        │
        ▼
┌─────────────────┐
│  Agent          │
│  Selection      │
│  • Scout        │──────► 🕵️  Research & Exploration
│  • Analyst      │──────► 📊 Analysis & Strategy
│  • Mentor       │──────► 🧭 Guidance & Advice
└─────────────────┘
        │
        ▼
┌─────────────────┐
│  Execution      │
│  Flow           │
│  • Research     │
│  • Process      │
│  • Respond      │
└─────────────────┘
        │
        ▼
    Response to User

Agent Selection Criteria:
═══════════════════════════

🕵️ SCOUT - Research & Exploration
   Keywords: research, find, search, trends, market, competitors
   Use when: Need data, market info, competitive intel
   Flow: Gather → Research → Present

📊 ANALYST - Deep Analysis & Strategy
   Keywords: analyze, evaluate, assess, strategy, compare
   Use when: Need evaluation, planning, strategic thinking
   Flow: Analyze → Evaluate → Recommend

🧭 MENTOR - Guidance & Advice
   Keywords: should, help, advice, recommend, decide
   Use when: Need guidance, validation, decision support
   Flow: Understand → Guide → Advise
`;
  }

  /**
   * Get routing statistics and insights
   */
  getRoutingStats(): string {
    return `
┌─────────────────────────────────────────────────────────────┐
│                 📊 ROUTING STATISTICS                       │
└─────────────────────────────────────────────────────────────┘

Current Session:
• Total Routes: Dynamic based on queries
• Confidence Threshold: 70%
• Fallback Strategy: Keyword analysis + Default Scout

Agent Capabilities:
┌──────────┬─────────────────────────────────────────────────┐
│ Agent    │ Specialized Capabilities                        │
├──────────┼─────────────────────────────────────────────────┤
│ 🕵️ Scout  │ • Web research simulation                      │
│          │ • Market trend analysis                        │
│          │ • Competitive intelligence                     │
│          │ • Data gathering and synthesis                 │
├──────────┼─────────────────────────────────────────────────┤
│ 📊 Analyst│ • SWOT analysis                               │
│          │ • Strategic planning                          │
│          │ • Risk assessment                             │
│          │ • Business model evaluation                   │
├──────────┼─────────────────────────────────────────────────┤
│ 🧭 Mentor │ • Startup validation                          │
│          │ • Decision frameworks                         │
│          │ • Problem solving guidance                    │
│          │ • Action plan development                     │
└──────────┴─────────────────────────────────────────────────┘

Routing Algorithm:
1. Analyze query context and intent
2. Score against agent capabilities
3. Select highest confidence match (>70%)
4. Fallback to keyword matching if needed
5. Default to Scout for ambiguous queries
`;
  }
}

export const globalRouter = new AgentRouter();