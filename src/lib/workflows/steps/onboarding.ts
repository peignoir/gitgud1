import { createStep } from '@mastra/core';
import { z } from 'zod';
import { UserProfileSchema, OnboardingOutputSchema, WorkflowContextSchema } from '../schemas';

// Step 1: Onboarding - Capture timezone and basic profile
export const onboardingStep = createStep({
  id: 'onboarding',
  inputSchema: z.object({
    userId: z.string(),
    sessionId: z.string(),
    linkedinUrl: z.string().url().optional(),
    userAgent: z.string().optional(), // for timezone detection
  }),
  outputSchema: OnboardingOutputSchema,

  execute: async ({ input, context }) => {
    const { userId, sessionId, linkedinUrl, userAgent } = input;

    // Detect timezone from browser (fallback to UTC)
    const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

    // Store basic profile info in working memory
    const profile: z.infer<typeof UserProfileSchema> = {
      userId,
      timezone: detectedTimezone,
      linkedinUrl,
    };

    // Update working memory with initial profile
    if (context.memory) {
      await context.memory.updateWorkingMemory({
        resourceId: userId,
        key: 'profile',
        value: profile
      });

      await context.memory.updateWorkingMemory({
        resourceId: userId,
        key: 'stage',
        value: 'assessment'
      });

      await context.memory.updateWorkingMemory({
        resourceId: userId,
        key: 'timezone',
        value: detectedTimezone
      });
    }

    context.logger?.info('Onboarding completed', { userId, timezone: detectedTimezone });

    return {
      userId,
      timezone: detectedTimezone,
      profile,
      phase: 'assessment' as const,
    };
  },
});