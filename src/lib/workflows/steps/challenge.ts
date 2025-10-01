import { createStep } from '@mastra/core';
import { z } from 'zod';
import { ChallengeArtifactsSchema, ChallengeOutputSchema, HouseClassificationSchema } from '../schemas';

// Step 4: Challenge - 60-90 minute vibe coding session
export const challengeStep = createStep({
  id: 'challenge',
  inputSchema: z.object({
    userId: z.string(),
    challengeMode: z.enum(['event', 'home']),
    house: HouseClassificationSchema,
    artifacts: z.object({
      videoUrl: z.string().url().optional(),
      fiveLiner: z.string().optional(),
      githubRepo: z.string().url().optional(),
      githubCommit: z.string().optional(),
    }).optional(),
  }),
  outputSchema: ChallengeOutputSchema,

  execute: async ({ input, context }) => {
    const { userId, challengeMode, house, artifacts } = input;

    // Process challenge completion
    const challengeArtifacts: z.infer<typeof ChallengeArtifactsSchema> = {
      mode: challengeMode,
      videoUrl: artifacts?.videoUrl,
      fiveLiner: artifacts?.fiveLiner,
      githubRepo: artifacts?.githubRepo,
      githubCommit: artifacts?.githubCommit,
      completedAt: new Date(),
    };

    // Validate artifacts based on requirements
    const hasMinimumArtifacts = artifacts?.fiveLiner && artifacts?.fiveLiner.length <= 500;

    if (!hasMinimumArtifacts) {
      throw new Error('Challenge requires at least a 5-liner description (max 500 characters)');
    }

    // Store challenge completion in working memory
    if (context.memory) {
      await context.memory.updateWorkingMemory({
        resourceId: userId,
        key: 'challenge',
        value: challengeArtifacts
      });

      await context.memory.updateWorkingMemory({
        resourceId: userId,
        key: 'stage',
        value: 'sprint'
      });

      // Store completion timestamp for sprint scheduling
      await context.memory.updateWorkingMemory({
        resourceId: userId,
        key: 'challengeCompletedAt',
        value: new Date().toISOString()
      });
    }

    context.logger?.info('Challenge completed', {
      userId,
      mode: challengeMode,
      hasVideo: !!artifacts?.videoUrl,
      hasGithub: !!artifacts?.githubRepo
    });

    return {
      userId,
      artifacts: challengeArtifacts,
      house,
      phase: 'sprint' as const,
    };
  },
});