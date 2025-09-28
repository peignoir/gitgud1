import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { anthropic } from '@ai-sdk/anthropic';

export type ModelProvider = 'openai' | 'google' | 'anthropic';

export interface ModelConfig {
  id: string;
  name: string;
  provider: ModelProvider;
  description: string;
  modelFunction: () => any;
}

/**
 * Latest AI models configuration for 2025
 * Updated with the most recent model names and identifiers
 */
export const AVAILABLE_MODELS: Record<string, ModelConfig> = {
  'gpt-4o': {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    description: 'OpenAI\'s multimodal flagship model',
    modelFunction: () => openai('gpt-4o')
  },
  'gpt-5': {
    id: 'gpt-5',
    name: 'GPT-5',
    provider: 'openai',
    description: 'OpenAI\'s most advanced model (requires verified org)',
    modelFunction: () => openai('gpt-5')
  },
  'gemini-2.5-pro': {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'google',
    description: 'Google\'s state-of-the-art thinking model with adaptive reasoning',
    modelFunction: () => google('gemini-2.5-pro')
  },
  'claude-opus-4-1': {
    id: 'claude-opus-4-1-20250805',
    name: 'Claude Opus 4.1',
    provider: 'anthropic',
    description: 'Anthropic\'s most capable model with superior reasoning (2025)',
    modelFunction: () => anthropic('claude-opus-4-1-20250805')
  }
};

/**
 * Global model state management
 */
class ModelManager {
  private currentModelId: string = 'gpt-5'; // Default to GPT-5 (requires verified org)

  getCurrentModel(): ModelConfig {
    return AVAILABLE_MODELS[this.currentModelId];
  }

  setModel(modelId: string): boolean {
    if (AVAILABLE_MODELS[modelId]) {
      this.currentModelId = modelId;
      return true;
    }
    return false;
  }

  getAvailableModels(): ModelConfig[] {
    return Object.values(AVAILABLE_MODELS);
  }

  getModelInstance() {
    const config = this.getCurrentModel();
    return config.modelFunction();
  }

  getModelInfo(): string {
    const config = this.getCurrentModel();
    return `${config.name} (${config.provider}) - ${config.description}`;
  }
}

export const globalModelManager = new ModelManager();