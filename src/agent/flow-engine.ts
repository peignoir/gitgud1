import { Agent } from '@mastra/core';
import { google } from '@ai-sdk/google';
import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';

import { streamText } from 'ai';
import { 
  AgentFlow, 
  FlowStep, 
  FlowExecutionContext, 
  StepResult,
  ThinkingTrace 
} from '@/types/flow.types';
import { geminiSearchTool, geminiDeepSearchTool } from './tools/gemini-search.tool';
import { analysisTool, synthesizeTool, compareTool } from './tools/analysis.tool';
import { loadFlows } from './config/flow-loader';
import { EventEmitter } from 'events';

export interface FlowEngineOptions {
  emitThinking?: boolean;
  emitProgress?: boolean;
  defaultModel?: 'gemini' | 'claude' | 'gpt4';
}

export class FlowEngine extends EventEmitter {
  private flows: Map<string, AgentFlow> = new Map();
  private agents: Map<string, Agent> = new Map();
  private options: FlowEngineOptions;
  
  constructor(options: FlowEngineOptions = {}) {
    super();
    this.options = {
      emitThinking: true,
      emitProgress: true,
      defaultModel: 'gemini',
      ...options,
    };
    
    this.initializeAgents();
  }
  
  private initializeAgents() {
    // Initialize different agents for different purposes
    
    // Gemini agent - primary with search
    this.agents.set('gemini', new Agent({
      name: 'gemini-agent',
      model: google('gemini-1.5-flash'),
      instructions: 'You are an expert AI assistant with access to web search. Provide accurate, well-researched responses.',
      tools: [geminiSearchTool, geminiDeepSearchTool, analysisTool, synthesizeTool, compareTool],
    }));
    
    // Claude agent - for deep analysis
    if (process.env.ANTHROPIC_API_KEY) {
      this.agents.set('claude', new Agent({
        name: 'claude-analyst',
        model: anthropic('claude-3-5-sonnet-20241022'),
        instructions: 'You are an expert analyst specializing in business strategy and deep analysis.',
        tools: [analysisTool, synthesizeTool, compareTool],
      }));
    }
    
    // GPT-5 agent - for mentor tasks (fallback to GPT-4 until GPT-5 release)
    if (process.env.OPENAI_API_KEY) {
      this.agents.set('mentor', new Agent({
        name: 'mentor-agent',
        model: openai('gpt-4o'), // Using GPT-4o as closest to GPT-5 performance
        instructions: `You are an experienced startup accelerator mentor like those from Y Combinator or Techstars.
        You provide direct, actionable advice to founders. Ask probing questions that push their thinking forward.
        Be supportive but challenging. Focus on validation, product-market fit, and growth strategies.`,
        tools: [analysisTool, synthesizeTool, compareTool],
      }));
    }
  }
  
  async loadFlows() {
    const flowsData = await loadFlows();
    
    for (const [id, flow] of Object.entries(flowsData)) {
      this.flows.set(id, flow as AgentFlow);
    }
    
    this.emit('flows-loaded', Array.from(this.flows.values()));
  }
  
  getFlow(flowId: string): AgentFlow | undefined {
    return this.flows.get(flowId);
  }
  
  getAllFlows(): AgentFlow[] {
    return Array.from(this.flows.values());
  }
  
  async executeFlow(
    query: string,
    flowId: string,
    userContext?: Record<string, any>
  ): Promise<FlowExecutionContext> {
    console.log(`🚀 [FlowEngine] Starting flow execution:`, { flowId, query });

    const flow = this.flows.get(flowId);
    if (!flow) {
      console.error(`❌ [FlowEngine] Flow not found: ${flowId}`);
      throw new Error(`Flow ${flowId} not found`);
    }

    console.log(`📋 [FlowEngine] Flow loaded:`, {
      name: flow.name,
      steps: flow.steps.length,
      startStep: flow.defaultStartStep
    });

    const context: FlowExecutionContext = {
      flowId,
      sessionId: generateSessionId(),
      originalQuery: query,
      userContext,
      currentStepIndex: 0,
      currentStepId: flow.defaultStartStep,
      stepResults: new Map(),
      startTime: new Date(),
    };

    console.log(`📝 [FlowEngine] Context initialized:`, { sessionId: context.sessionId });
    this.emit('flow-start', { flowId, query, context });
    
    try {
      // Execute flow steps
      await this.executeSteps(flow, context);
      
      context.endTime = new Date();
      this.emit('flow-complete', { flowId, context });
      
      return context;
    } catch (error) {
      this.emit('flow-error', { flowId, error, context });
      throw error;
    }
  }
  
  private async executeSteps(flow: AgentFlow, context: FlowExecutionContext) {
    let currentStepId = context.currentStepId;
    const maxSteps = 20; // Prevent infinite loops
    let stepCount = 0;
    
    while (currentStepId && stepCount < maxSteps) {
      const step = flow.steps.find(s => s.id === currentStepId);
      if (!step) {
        throw new Error(`Step ${currentStepId} not found in flow ${flow.id}`);
      }
      
      this.emit('step-start', { step, context });
      
      const result = await this.executeStep(step, flow, context);
      context.stepResults.set(step.id, result);
      
      this.emit('step-complete', { step, result, context });
      
      // Determine next step
      currentStepId = this.determineNextStep(step, result, flow);
      context.currentStepId = currentStepId || '';
      context.currentStepIndex++;
      stepCount++;
    }
    
    if (stepCount >= maxSteps) {
      throw new Error('Maximum step limit reached - possible infinite loop');
    }
  }
  
  private async executeStep(
    step: FlowStep,
    flow: AgentFlow,
    context: FlowExecutionContext
  ): Promise<StepResult> {
    const startTime = new Date();
    const result: StepResult = {
      stepId: step.id,
      action: step.action,
      status: 'running',
      startTime,
    };
    
    try {
      // Get the appropriate agent
      const agentName = this.selectAgent(step, flow);
      const agent = this.agents.get(agentName);
      if (!agent) {
        throw new Error(`Agent ${agentName} not found`);
      }
      
      // Build input for the step
      const input = this.buildStepInput(step, context);
      
      // Execute based on action type
      switch (step.action) {
        case 'search':
          result.output = await this.executeSearch(step, input, agent);
          break;
          
        case 'analyze':
          result.output = await this.executeAnalysis(step, input, agent);
          break;
          
        case 'synthesize':
          result.output = await this.executeSynthesis(step, input, agent);
          break;
          
        case 'compare':
          result.output = await this.executeComparison(step, input, agent);
          break;
          
        case 'recommend':
          result.output = await this.executeRecommendation(step, input, agent);
          break;
          
        case 'custom':
          result.output = await this.executeCustom(step, input, agent);
          break;
          
        default:
          throw new Error(`Unknown action type: ${step.action}`);
      }
      
      result.status = 'success';
      
      // Extract sources and confidence if available
      if (result.output?.sources) {
        result.sources = result.output.sources;
      }
      if (result.output?.confidence) {
        result.confidence = result.output.confidence;
      }
      
    } catch (error: any) {
      result.status = 'failed';
      result.error = error.message;
      this.emit('step-error', { step, error, context });
    }
    
    result.endTime = new Date();
    return result;
  }
  
  private selectAgent(step: FlowStep, flow: AgentFlow): string {
    console.log(`🤖 [FlowEngine] Selecting agent for step: ${step.action}, flow: ${flow.id}`);

    // Use step-specific model preference if available
    if (step.action === 'search') {
      const agent = flow.modelPreferences?.searchModel || 'gemini';
      console.log(`🕵️ [Scout] Selected for search: ${agent}`);
      return agent;
    }

    if (step.action === 'analyze' || step.action === 'synthesize') {
      const agent = flow.modelPreferences?.analysisModel || 'claude';
      console.log(`📊 [Analyst] Selected for analysis: ${agent}`);
      return agent;
    }

    // For mentor-focused flows, prefer GPT mentor agent
    if (flow.id === 'startup_analysis' && (step.action === 'recommend' || step.action === 'custom')) {
      const agent = 'mentor';
      console.log(`🧭 [Mentor] Selected for guidance: ${agent}`);
      return agent;
    }

    const defaultAgent = flow.modelPreferences?.primary || this.options.defaultModel || 'gemini';
    console.log(`🔄 [Default] Selected: ${defaultAgent}`);
    return defaultAgent;
  }
  
  private buildStepInput(step: FlowStep, context: FlowExecutionContext): any {
    const input: any = {
      query: context.originalQuery,
      userContext: context.userContext,
    };
    
    // Add inputs from other steps
    if (step.inputs?.fromStep) {
      const previousResult = context.stepResults.get(step.inputs.fromStep);
      if (previousResult) {
        input.previousStepData = previousResult.output;
      }
    }
    
    if (step.inputs?.fromContext) {
      input.contextData = {};
      for (const stepId of step.inputs.fromContext) {
        const result = context.stepResults.get(stepId);
        if (result) {
          input.contextData[stepId] = result.output;
        }
      }
    }
    
    return input;
  }
  
  private async executeSearch(step: FlowStep, input: any, agent: Agent): Promise<any> {
    const config = step.config || {};
    const prompt = this.interpolatePrompt(step.prompt || 'Search for: {query}', input);
    
    if (this.options.emitThinking) {
      this.emitThinking(step.id, agent.name, 'search_planning', 
        `Planning search for: ${prompt}`);
    }
    
    return await geminiSearchTool.execute({
      query: prompt,
      searchType: config.searchType || 'web',
      searchDepth: config.searchDepth || 'standard',
      maxResults: config.maxResults || 10,
      timeRange: config.timeRange || 'all',
      includeImages: config.includeImages || false,
    });
  }
  
  private async executeAnalysis(step: FlowStep, input: any, agent: Agent): Promise<any> {
    const config = step.config || {};
    const data = input.previousStepData || input.contextData || input;
    
    if (this.options.emitThinking) {
      this.emitThinking(step.id, agent.name, 'analysis', 
        `Starting ${config.analysisType || 'general'} analysis...`);
    }
    
    return await analysisTool.execute({
      data,
      analysisType: config.analysisType || 'general',
      prompt: this.interpolatePrompt(step.prompt, input),
      includeConfidence: config.includeConfidence !== false,
    });
  }
  
  private async executeSynthesis(step: FlowStep, input: any, agent: Agent): Promise<any> {
    const config = step.config || {};
    const sources = this.gatherSources(input);
    
    if (this.options.emitThinking) {
      this.emitThinking(step.id, agent.name, 'synthesis', 
        `Synthesizing ${sources.length} sources...`);
    }
    
    return await synthesizeTool.execute({
      sources,
      outputFormat: config.outputFormat || 'summary',
      prompt: this.interpolatePrompt(step.prompt, input),
      includeSources: config.includeSources !== false,
      includeConfidence: config.includeConfidence !== false,
    });
  }
  
  private async executeComparison(step: FlowStep, input: any, agent: Agent): Promise<any> {
    const items = input.previousStepData?.results || [];
    
    return await compareTool.execute({
      items,
      criteria: step.config?.criteria,
      comparisonType: step.config?.comparisonType || 'detailed',
    });
  }
  
  private async executeRecommendation(step: FlowStep, input: any, agent: Agent): Promise<any> {
    const prompt = this.interpolatePrompt(
      step.prompt || 'Provide recommendations based on the analysis',
      input
    );
    
    // Use agent to generate recommendations
    const response = await agent.generate({
      messages: [{ role: 'user', content: prompt }],
      temperature: step.config?.temperature || 0.5,
    });
    
    return {
      recommendations: response.text,
      confidence: 0.8,
    };
  }
  
  private async executeCustom(step: FlowStep, input: any, agent: Agent): Promise<any> {
    if (!step.prompt) {
      throw new Error('Custom steps require a prompt');
    }
    
    const prompt = this.interpolatePrompt(step.prompt, input);
    
    const response = await agent.generate({
      messages: [{ role: 'user', content: prompt }],
      temperature: step.config?.temperature || 0.7,
    });
    
    return {
      result: response.text,
    };
  }
  
  private interpolatePrompt(prompt: string, input: any): string {
    // Replace {variable} with values from input
    return prompt.replace(/\{(\w+)\}/g, (match, key) => {
      return input[key] || match;
    });
  }
  
  private gatherSources(input: any): any[] {
    const sources: any[] = [];
    
    if (input.previousStepData) {
      sources.push(input.previousStepData);
    }
    
    if (input.contextData) {
      Object.values(input.contextData).forEach((data: any) => {
        if (Array.isArray(data)) {
          sources.push(...data);
        } else {
          sources.push(data);
        }
      });
    }
    
    return sources;
  }
  
  private determineNextStep(
    step: FlowStep,
    result: StepResult,
    flow: AgentFlow
  ): string | null {
    if (!step.conditions) {
      // Find next step in sequence
      const currentIndex = flow.steps.findIndex(s => s.id === step.id);
      if (currentIndex < flow.steps.length - 1) {
        return flow.steps[currentIndex + 1].id;
      }
      return null;
    }
    
    // Check conditions
    if (result.status === 'success' && step.conditions.onSuccess) {
      return step.conditions.onSuccess === 'end' ? null : step.conditions.onSuccess;
    }
    
    if (result.status === 'failed' && step.conditions.onFailure) {
      return step.conditions.onFailure === 'end' ? null : step.conditions.onFailure;
    }
    
    if (result.output?.results?.length === 0 && step.conditions.onNoResults) {
      return step.conditions.onNoResults === 'end' ? null : step.conditions.onNoResults;
    }
    
    return null;
  }
  
  private emitThinking(
    stepId: string,
    model: string,
    type: ThinkingTrace['type'],
    content: string,
    confidence?: number
  ) {
    const trace: ThinkingTrace = {
      timestamp: new Date(),
      stepId,
      model,
      type,
      content,
      confidence,
    };
    
    this.emit('thinking', trace);
  }
  
  // Stream execution for real-time updates
  async *streamFlowExecution(
    query: string,
    flowId: string,
    userContext?: Record<string, any>
  ) {
    const flow = this.flows.get(flowId);
    if (!flow) {
      throw new Error(`Flow ${flowId} not found`);
    }
    
    yield { type: 'flow-start', flowId, query };
    
    const context = await this.executeFlow(query, flowId, userContext);
    
    // Stream the final output
    const finalStep = Array.from(context.stepResults.values()).pop();
    if (finalStep?.output) {
      yield { 
        type: 'result', 
        output: this.formatOutput(finalStep.output, flow.output) 
      };
    }
    
    yield { type: 'flow-complete', context };
  }
  
  private formatOutput(output: any, outputConfig: AgentFlow['output']): any {
    // Format based on configuration
    switch (outputConfig.format) {
      case 'markdown':
        return this.formatAsMarkdown(output, outputConfig);
      case 'json':
        return output;
      case 'html':
        return this.formatAsHTML(output);
      case 'report':
        return this.formatAsReport(output, outputConfig);
      default:
        return output;
    }
  }
  
  private formatAsMarkdown(output: any, config: AgentFlow['output']): string {
    let markdown = '';
    
    if (output.synthesis) {
      markdown = output.synthesis;
    } else if (output.analysis) {
      markdown = output.analysis;
    } else if (output.recommendations) {
      markdown = output.recommendations;
    } else if (output.results) {
      markdown = '# Search Results\n\n';
      output.results.forEach((result: any, i: number) => {
        markdown += `## ${i + 1}. ${result.title}\n`;
        markdown += `${result.snippet}\n`;
        if (result.url) {
          markdown += `[Source](${result.url})\n`;
        }
        markdown += '\n';
      });
    } else {
      markdown = JSON.stringify(output, null, 2);
    }
    
    if (config.includeSources && output.sources) {
      markdown += '\n\n## Sources\n\n';
      output.sources.forEach((source: any, i: number) => {
        markdown += `${i + 1}. [${source.title}](${source.url})\n`;
      });
    }
    
    return markdown;
  }
  
  private formatAsHTML(output: any): string {
    // Convert to HTML format
    return `<div class="flow-output">${JSON.stringify(output, null, 2)}</div>`;
  }
  
  private formatAsReport(output: any, config: AgentFlow['output']): string {
    // Format as professional report
    let report = '# Analysis Report\n\n';
    report += `Generated: ${new Date().toLocaleString()}\n\n`;
    
    // Add content based on what's available
    if (output.synthesis || output.analysis) {
      report += output.synthesis || output.analysis;
    }
    
    return report;
  }
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
