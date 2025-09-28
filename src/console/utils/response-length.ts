export type ResponseLength = 'short' | 'medium' | 'detailed';

export interface ResponseLengthConfig {
  name: string;
  emoji: string;
  description: string;
  instruction: string;
}

export const RESPONSE_LENGTH_CONFIGS: Record<ResponseLength, ResponseLengthConfig> = {
  short: {
    name: 'Short',
    emoji: '⚡',
    description: 'Super concise, 1-3 sentences max',
    instruction: 'Be extremely concise. Answer in 1-3 sentences maximum. Get straight to the point without elaboration.'
  },
  medium: {
    name: 'Medium',
    emoji: '📝',
    description: 'Balanced, 1-2 paragraphs',
    instruction: 'Provide a balanced response with 1-2 paragraphs. Include key points but keep it focused and practical.'
  },
  detailed: {
    name: 'Detailed',
    emoji: '📋',
    description: 'Comprehensive, thorough analysis',
    instruction: 'Provide a comprehensive and detailed response. Include background, analysis, examples, and actionable insights. Be thorough and educational.'
  }
};

/**
 * Global response length state management
 */
class ResponseLengthManager {
  private currentLength: ResponseLength = 'medium'; // Default to medium

  getCurrentLength(): ResponseLength {
    return this.currentLength;
  }

  setLength(length: ResponseLength): boolean {
    if (RESPONSE_LENGTH_CONFIGS[length]) {
      this.currentLength = length;
      return true;
    }
    return false;
  }

  getConfig(): ResponseLengthConfig {
    return RESPONSE_LENGTH_CONFIGS[this.currentLength];
  }

  getLengthInstruction(): string {
    return this.getConfig().instruction;
  }

  getLengthInfo(): string {
    const config = this.getConfig();
    return `${config.emoji} ${config.name} - ${config.description}`;
  }

  getAvailableLengths(): ResponseLengthConfig[] {
    return Object.values(RESPONSE_LENGTH_CONFIGS);
  }

  getNextLength(): ResponseLength {
    const lengths: ResponseLength[] = ['short', 'medium', 'detailed'];
    const currentIndex = lengths.indexOf(this.currentLength);
    return lengths[(currentIndex + 1) % lengths.length];
  }
}

export const globalResponseLength = new ResponseLengthManager();