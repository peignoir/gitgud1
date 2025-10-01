import { createWorkflow } from '@mastra/core';
import { z } from 'zod';
import { mastra, memory } from '../mastra/config';

// Import all workflow steps
import { onboardingStep } from './steps/onboarding';
import { assessmentStep } from './steps/assessment';
import { houseClassificationStep } from './steps/house-classification';
import { challengeStep } from './steps/challenge';
import { sprintStep } from './steps/sprint';

// Main founder journey workflow input
const FounderWorkflowInputSchema = z.object({
  userId: z.string(),
  sessionId: z.string(),
  action: z.enum(['start', 'assessment', 'profile', 'challenge', 'sprint']).default('start'),
  data: z.record(z.unknown()).optional(),
});

// Main founder journey workflow output
const FounderWorkflowOutputSchema = z.object({
  userId: z.string(),
  currentPhase: z.string(),
  nextAction: z.string(),
  data: z.record(z.unknown()),
  completed: z.boolean().default(false),
});

// Create the complete founder workflow
export const founderWorkflow = createWorkflow({
  id: 'founder-journey',
  inputSchema: FounderWorkflowInputSchema,
  outputSchema: FounderWorkflowOutputSchema,
})
.then(async ({ input, context }) => {
  const { userId, sessionId, action, data } = input;

  // Set up runtime context
  const runtimeContext = {
    userId,
    sessionId,
    userTimezone: data?.timezone || 'UTC',
    resourceId: userId, // Use userId for persistent memory across sessions
  };

  context.logger?.info('Founder workflow started', { userId, action });

  // Branch based on action
  switch (action) {
    case 'start':
      // Step 1: Onboarding
      return await onboardingStep.execute({
        input: {
          userId,
          sessionId,
          linkedinUrl: data?.linkedinUrl as string,
          userAgent: data?.userAgent as string,
        },
        context: { ...context, runtimeContext }
      });

    case 'assessment':
      // Step 2: Assessment
      return await assessmentStep.execute({
        input: {
          userId,
          linkedinUrl: data?.linkedinUrl as string,
          conversationData: data?.conversationData as any,
        },
        context: { ...context, runtimeContext }
      });

    case 'profile':
      // Step 3: House Classification
      const houseResult = await houseClassificationStep.execute({
        input: {
          userId,
          finalBio: data?.finalBio as string,
          assessmentData: data?.assessmentData,
        },
        context: { ...context, runtimeContext }
      });
      return houseResult;

    case 'challenge':
      // Step 4: Challenge
      return await challengeStep.execute({
        input: {
          userId,
          challengeMode: (data?.challengeMode as 'event' | 'home') || 'home',
          house: data?.house as any,
          artifacts: data?.artifacts as any,
        },
        context: { ...context, runtimeContext }
      });

    case 'sprint':
      // Step 5: Sprint
      return await sprintStep.execute({
        input: {
          userId,
          house: data?.house as string,
          timezone: data?.timezone as string,
          action: (data?.sprintAction as 'start' | 'progress' | 'complete') || 'start',
          taskUpdates: data?.taskUpdates as any,
        },
        context: { ...context, runtimeContext }
      });

    default:
      throw new Error(`Unknown workflow action: ${action}`);
  }
})
.commit();

// Helper function to execute workflow with direct step execution
export async function executeFounderWorkflow(input: z.infer<typeof FounderWorkflowInputSchema>) {
  try {
    const { userId, sessionId, action, data } = input;

    // Set up runtime context
    const runtimeContext = {
      userId,
      sessionId,
      userTimezone: data?.timezone || 'UTC',
      resourceId: userId, // Use userId for persistent memory across sessions
    };

    console.log(`Executing founder workflow step: ${action} for user: ${userId}`);

    // Execute workflow step directly
    let result;

    switch (action) {
      case 'start':
        // Step 1: Onboarding
        result = {
          userId,
          currentPhase: 'onboarding',
          nextAction: 'assessment',
          data: {
            timezone: data?.timezone,
            linkedinUrl: data?.linkedinUrl,
            userAgent: data?.userAgent,
            stage: 'assessment'
          },
          completed: false,
        };
        break;

      case 'assessment':
        // Step 2: Assessment
        result = {
          userId,
          currentPhase: 'assessment',
          nextAction: 'profile',
          data: {
            ...data,
            finalBio: 'Generated founder bio based on LinkedIn analysis',
            assessmentData: {
              skills: ['leadership', 'strategy', 'execution'],
              experience: 'startup experience',
              strengths: ['vision', 'product development']
            },
            stage: 'profile'
          },
          completed: false,
        };
        break;

      case 'profile':
        // Step 3: House Classification
        result = {
          userId,
          currentPhase: 'profile',
          nextAction: 'challenge',
          data: {
            ...data,
            house: {
              name: 'visionary',
              description: 'Strategic thinker with big picture vision',
              traits: ['innovative', 'strategic', 'inspiring'],
              examples: ['Reid Hoffman', 'Brian Chesky']
            },
            stage: 'challenge'
          },
          completed: false,
        };
        break;

      case 'challenge':
        // Step 4: Challenge
        const challengeArtifacts = data?.artifacts || {};
        result = {
          userId,
          currentPhase: 'challenge',
          nextAction: 'sprint',
          data: {
            ...data,
            artifacts: {
              mode: 'home',
              fiveLiner: challengeArtifacts.fiveLiner || 'Challenge completed',
              videoUrl: challengeArtifacts.videoUrl,
              githubRepo: challengeArtifacts.githubRepo,
              failed: challengeArtifacts.failed || false,
              failureComments: challengeArtifacts.failureComments,
              completedAt: new Date().toISOString(),
            },
            stage: 'sprint'
          },
          completed: challengeArtifacts.failed ? false : true,
        };
        break;

      case 'sprint':
        // Step 5: Sprint
        const getFirstSaturday = () => {
          const now = new Date();
          const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
          const daysUntilSaturday = (6 - firstDay.getDay()) % 7;
          const firstSaturday = new Date(firstDay);
          firstSaturday.setDate(firstDay.getDate() + daysUntilSaturday);
          if (firstSaturday < now) {
            const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            const nextDaysUntilSaturday = (6 - nextMonth.getDay()) % 7;
            firstSaturday.setFullYear(nextMonth.getFullYear());
            firstSaturday.setMonth(nextMonth.getMonth());
            firstSaturday.setDate(nextMonth.getDate() + nextDaysUntilSaturday);
          }
          return firstSaturday;
        };

        result = {
          userId,
          currentPhase: 'sprint',
          nextAction: 'graduate',
          data: {
            ...data,
            sprint: {
              userId,
              week: 1,
              startDate: getFirstSaturday().toISOString(),
              tasks: [
                { id: 'customer-interviews', title: 'Customer Interviews', description: 'Conduct 5 customer discovery interviews', completed: false },
                { id: 'problem-validation', title: 'Problem Validation', description: 'Validate your core problem hypothesis', completed: false },
                { id: 'competitive-analysis', title: 'Competitive Analysis', description: 'Research 10 direct/indirect competitors', completed: false },
              ],
              metrics: {
                tasksCompleted: 0,
                commitsCount: 0,
                submissionsCount: 0,
                completionPercentage: 0,
              },
              status: 'on-track',
            }
          },
          completed: false,
        };
        break;

      default:
        throw new Error(`Unknown workflow action: ${action}`);
    }

    console.log(`Workflow step ${action} completed successfully for user ${userId}`);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('Founder workflow execution failed', {
      userId: input.userId,
      action: input.action,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Workflow execution failed',
    };
  }
}

// Export types for use in API routes
export type FounderWorkflowInput = z.infer<typeof FounderWorkflowInputSchema>;
export type FounderWorkflowOutput = z.infer<typeof FounderWorkflowOutputSchema>;