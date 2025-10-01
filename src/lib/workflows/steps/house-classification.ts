import { createStep } from '@mastra/core';
import { z } from 'zod';
import { openai } from '@ai-sdk/openai';
import { HouseClassificationSchema, ProfileOutputSchema } from '../schemas';

// House definitions based on Steve Blank archetypes
const FOUNDER_HOUSES = {
  visionary: {
    name: 'Visionary',
    description: 'Big-picture thinkers who see the future and inspire others to build it',
    traits: ['strategic thinking', 'future-focused', 'inspirational leadership', 'risk tolerance'],
    examples: 'Elon Musk, Steve Jobs, Jeff Bezos'
  },
  operator: {
    name: 'Operator',
    description: 'Execution-focused leaders who turn vision into scalable reality',
    traits: ['process optimization', 'team building', 'operational excellence', 'results-driven'],
    examples: 'Sheryl Sandberg, Tim Cook, Satya Nadella'
  },
  technologist: {
    name: 'Technologist',
    description: 'Deep technical experts who solve complex problems through innovation',
    traits: ['technical depth', 'problem-solving', 'R&D mindset', 'engineering leadership'],
    examples: 'Linus Torvalds, John Carmack, Brendan Eich'
  },
  communicator: {
    name: 'Communicator',
    description: 'Master storytellers who build movements and connect with audiences',
    traits: ['storytelling', 'community building', 'brand development', 'user empathy'],
    examples: 'Brian Chesky, Stewart Butterfield, Drew Houston'
  },
  builder: {
    name: 'Builder',
    description: 'Hands-on creators who bootstrap and iterate rapidly from first principles',
    traits: ['rapid prototyping', 'resourcefulness', 'customer focus', 'iteration speed'],
    examples: 'David Heinemeier Hansson, Jason Fried, Tobias Lütke'
  }
} as const;

// Step 3: House Classification - Assign founder to archetype house
export const houseClassificationStep = createStep({
  id: 'house-classification',
  inputSchema: z.object({
    userId: z.string(),
    finalBio: z.string(),
    assessmentData: z.any().optional(),
  }),
  outputSchema: ProfileOutputSchema,

  execute: async ({ input, context }) => {
    const { userId, finalBio, assessmentData } = input;

    // Create classification prompt with house definitions
    const classificationPrompt = `
As an expert in founder archetypes and Steve Blank's customer development methodology, classify this founder into one of five houses:

HOUSE DEFINITIONS:
${Object.entries(FOUNDER_HOUSES).map(([key, house]) =>
  `${house.name}: ${house.description}
  Key traits: ${house.traits.join(', ')}
  Examples: ${house.examples}`
).join('\n\n')}

FOUNDER PROFILE:
Bio: ${finalBio}

Assessment Data: ${JSON.stringify(assessmentData, null, 2)}

Return a JSON object with:
{
  "house": "one of: visionary, operator, technologist, communicator, builder",
  "reasoning": "2-3 sentence explanation of why this classification fits",
  "traits": ["array", "of", "3-4", "key", "traits", "that", "led", "to", "this", "classification"],
  "confidence": 0.85
}

Focus on evidence from their background, experience, and communication style. Be specific about what makes them fit this archetype.
    `.trim();

    try {
      const model = openai('gpt-4o');
      const classificationResult = await model.generateText({
        prompt: classificationPrompt,
        temperature: 0.3, // Lower temperature for more consistent classification
        maxTokens: 600,
      });

      // Parse the JSON response
      let houseClassification: z.infer<typeof HouseClassificationSchema>;
      try {
        const parsed = JSON.parse(classificationResult.text);
        houseClassification = HouseClassificationSchema.parse(parsed);
      } catch (parseError) {
        context.logger?.warn('Failed to parse house classification, using fallback', { userId, error: parseError });
        // Fallback classification
        houseClassification = {
          house: 'builder',
          reasoning: 'Classified as Builder based on general entrepreneurial profile',
          traits: ['resourceful', 'hands-on', 'customer-focused'],
          confidence: 0.5
        };
      }

      // Store house classification in working memory
      if (context.memory) {
        await context.memory.updateWorkingMemory({
          resourceId: userId,
          key: 'house',
          value: houseClassification
        });

        await context.memory.updateWorkingMemory({
          resourceId: userId,
          key: 'stage',
          value: 'challenge'
        });
      }

      context.logger?.info('House classification completed', {
        userId,
        house: houseClassification.house,
        confidence: houseClassification.confidence
      });

      return {
        userId,
        finalBio,
        house: houseClassification,
        phase: 'challenge' as const,
      };

    } catch (error) {
      context.logger?.error('House classification failed', { userId, error });
      throw error;
    }
  },
});