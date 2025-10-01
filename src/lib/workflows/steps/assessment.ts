import { createStep } from '@mastra/core';
import { z } from 'zod';
import { openai } from '@ai-sdk/openai';
import { FounderAssessmentSchema, AssessmentOutputSchema } from '../schemas';

// Step 2: Assessment - Analyze LinkedIn and generate founder profile
export const assessmentStep = createStep({
  id: 'assessment',
  inputSchema: z.object({
    userId: z.string(),
    linkedinUrl: z.string().url().optional(),
    conversationData: z.array(z.object({
      question: z.string(),
      answer: z.string(),
    })).optional(),
  }),
  outputSchema: AssessmentOutputSchema,

  execute: async ({ input, context }) => {
    const { userId, linkedinUrl, conversationData } = input;

    // Simulate LinkedIn analysis (integrate with existing API)
    const linkedinData = linkedinUrl ? {
      experience: ['Serial entrepreneur', 'Tech industry veteran'],
      skills: ['Leadership', 'Strategic Planning', 'Product Development'],
      education: ['Computer Science', 'Business Administration'],
      summary: 'Experienced founder with multiple successful exits',
    } : undefined;

    // Create assessment data
    const assessment: z.infer<typeof FounderAssessmentSchema> = {
      userId,
      profile: { userId },
      linkedinData,
      responses: conversationData?.reduce((acc, item) => ({
        ...acc,
        [item.question]: item.answer
      }), {}),
    };

    // Generate bio using GPT-5 with YC founder tone
    const bioPrompt = `
As a post-exit YC founder and mentor, write a compelling founder bio based on this profile data:

LinkedIn Data: ${JSON.stringify(linkedinData, null, 2)}
Conversation Data: ${JSON.stringify(conversationData, null, 2)}

Write in a candid, founder-to-founder tone. Reference relevant research when appropriate (Kauffman Foundation, Harvard Business School, Stanford studies).

Be authentic and human - avoid buzzwords. Focus on:
- What makes this founder unique
- Their journey and key experiences
- Why they're positioned for success
- Specific achievements and learnings

Keep it conversational but professional. 2-3 paragraphs max.
    `.trim();

    try {
      // Generate bio using GPT model
      const model = openai('gpt-4o'); // Use GPT-4 for now, upgrade to GPT-5 when available
      const bioResult = await model.generateText({
        prompt: bioPrompt,
        temperature: 0.7,
        maxTokens: 800,
      });

      const generatedBio = bioResult.text;

      // Store assessment in working memory
      if (context.memory) {
        await context.memory.updateWorkingMemory({
          resourceId: userId,
          key: 'assessment',
          value: assessment
        });

        await context.memory.updateWorkingMemory({
          resourceId: userId,
          key: 'generatedBio',
          value: generatedBio
        });

        await context.memory.updateWorkingMemory({
          resourceId: userId,
          key: 'stage',
          value: 'profile'
        });
      }

      context.logger?.info('Assessment completed', { userId, bioLength: generatedBio.length });

      return {
        userId,
        assessment,
        generatedBio,
        phase: 'profile' as const,
      };

    } catch (error) {
      context.logger?.error('Assessment failed', { userId, error });
      throw error;
    }
  },
});