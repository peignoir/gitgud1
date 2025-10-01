import { createWorkflow } from '@mastra/core';
import { z } from 'zod';
import { mastra, memory } from '../mastra/config';

/**
 * FOUNDER JOURNEY WORKFLOW
 * 
 * A clean, modular workflow with 6 phases:
 * 1. Welcome - Fun introduction
 * 2. Discovery - LinkedIn + web research
 * 3. Profile - Bio generation and editing
 * 4. Challenge - 60-90 min vibe code challenge
 * 5. Evaluation - VC-backable vs Bootstrap assessment
 * 6. Sprint - 3-week personalized program
 * 
 * Each phase uses specialized agents and branches based on outcomes
 */

// Input schema for the workflow
const FounderJourneyInputSchema = z.object({
  userId: z.string(),
  phase: z.enum(['welcome', 'discovery', 'profile', 'challenge', 'evaluation', 'sprint']),
  data: z.record(z.unknown()).optional(),
});

// Output schema for the workflow
const FounderJourneyOutputSchema = z.object({
  success: z.boolean(),
  phase: z.string(),
  nextPhase: z.string().optional(),
  data: z.record(z.unknown()),
  message: z.string().optional(),
});

/**
 * Main Founder Journey Workflow
 * Uses .branch() for clean phase routing and agent selection
 */
export const founderJourneyWorkflow = createWorkflow({
  id: 'founder-journey',
  inputSchema: FounderJourneyInputSchema,
  outputSchema: FounderJourneyOutputSchema,
})
  // Step 1: Initialize runtime context and memory
  .then(async ({ input, context }) => {
    const { userId, phase, data } = input;

    // Set up runtime context for memory
    const runtimeContext = {
      userId,
      resourceId: userId,
      sessionId: data?.sessionId as string || `session-${Date.now()}`,
    };

    context.logger?.info('Founder journey started', { userId, phase });

    return {
      userId,
      phase,
      data: data || {},
      runtimeContext,
    };
  })

  // Step 2: Branch based on phase
  .branch(({ result }) => {
    return result.phase;
  }, {
    // PHASE 1: WELCOME
    welcome: {
      then: async ({ result, context }) => {
        context.logger?.info('Welcome phase', { userId: result.userId });

        // Simple welcome message - can be enhanced with personalization
        return {
          success: true,
          phase: 'welcome',
          nextPhase: 'discovery',
          data: {
            ...result.data,
            welcomeMessage: `
🚀 **Welcome to GitGud!**

You're about to embark on an exciting journey to validate your founder potential and startup idea.

Here's what's ahead:
1. **Discovery** (5 min) - We'll research your LinkedIn and market
2. **Profile** (5 min) - Create your founder bio
3. **Challenge** (60-90 min) - Vibe code challenge to prove you can ship
4. **Evaluation** (5 min) - Get assessed by our AI VC
5. **Sprint** (3 weeks) - Personalized program with OKRs and community

**Ready to get started?** Let's discover who you are as a founder! 🎯
            `.trim(),
          },
          message: 'Welcome phase completed',
        };
      }
    },

    // PHASE 2: DISCOVERY
    discovery: {
      then: async ({ result, context }) => {
        context.logger?.info('Discovery phase', { userId: result.userId });

        const researcherAgent = mastra.getAgent('researcher');
        if (!researcherAgent) {
          throw new Error('Researcher agent not found');
        }

        // Use researcher agent to analyze LinkedIn and market
        const linkedinUrl = result.data.linkedinUrl as string;
        
        const prompt = `
Research this founder:
LinkedIn: ${linkedinUrl || 'Not provided - use mock data'}

Please:
1. Use linkedin-research tool to analyze their profile
2. Use web-research tool to investigate their domain expertise
3. Provide a comprehensive summary of their background and market fit
        `.trim();

        // Generate with streaming support
        const researchResult = await researcherAgent.generate(prompt, {
          resourceId: result.runtimeContext.resourceId,
        });

        return {
          success: true,
          phase: 'discovery',
          nextPhase: 'profile',
          data: {
            ...result.data,
            research: {
              summary: researchResult.text,
              timestamp: new Date().toISOString(),
            },
          },
          message: 'Discovery completed',
        };
      }
    },

    // PHASE 3: PROFILE
    profile: {
      then: async ({ result, context }) => {
        context.logger?.info('Profile phase', { userId: result.userId });

        const profilerAgent = mastra.getAgent('profiler');
        if (!profilerAgent) {
          throw new Error('Profiler agent not found');
        }

        // Generate founder bio based on research
        const research = result.data.research as any;
        
        const prompt = `
Based on this research, create a compelling founder bio:

${research?.summary || 'Create a sample founder bio'}

Requirements:
- 2-3 paragraphs
- Identify their founder archetype (Builder/Visionary/Operator/Researcher)
- Highlight unique strengths
- Position them for startup success

Then ask if they'd like to edit anything.
        `.trim();

        const profileResult = await profilerAgent.generate(prompt, {
          resourceId: result.runtimeContext.resourceId,
        });

        return {
          success: true,
          phase: 'profile',
          nextPhase: 'challenge',
          data: {
            ...result.data,
            profile: {
              bio: profileResult.text,
              timestamp: new Date().toISOString(),
            },
          },
          message: 'Profile created',
        };
      }
    },

    // PHASE 4: CHALLENGE
    challenge: {
      then: async ({ result, context }) => {
        context.logger?.info('Challenge phase', { userId: result.userId });

        const coachAgent = mastra.getAgent('coach');
        if (!coachAgent) {
          throw new Error('Coach agent not found');
        }

        // Coach provides guidance during challenge
        const challengeMode = result.data.challengeMode || 'start';
        
        let prompt = '';
        if (challengeMode === 'start') {
          prompt = `
A founder is starting their 60-90 minute vibe code challenge.

Their profile:
${(result.data.profile as any)?.bio || 'Experienced founder'}

Guide them through:
1. What are they building? (existing idea or help them find one)
2. Set up the timer and deliverables expectations
3. Encourage them to focus on shipping, not perfection

Be energetic and supportive! 🚀
          `.trim();
        } else if (challengeMode === 'coaching') {
          const userMessage = result.data.userMessage as string;
          prompt = `
During vibe code challenge. Founder says: "${userMessage}"

Provide quick, actionable coaching. Keep it short and focused.
          `.trim();
        } else if (challengeMode === 'submit') {
          prompt = `
Challenge time is up! Remind them to submit:
1. Video link (1:30 max) - demo + proof of work
2. 5-liner - problem, solution, customer, opportunity, what to test next

Get these artifacts to move to evaluation phase.
          `.trim();
        }

        const coachResult = await coachAgent.generate(prompt, {
          resourceId: result.runtimeContext.resourceId,
        });

        return {
          success: true,
          phase: 'challenge',
          nextPhase: result.data.artifacts ? 'evaluation' : 'challenge',
          data: {
            ...result.data,
            coachResponse: coachResult.text,
          },
          message: 'Challenge in progress',
        };
      }
    },

    // PHASE 5: EVALUATION
    evaluation: {
      then: async ({ result, context }) => {
        context.logger?.info('Evaluation phase', { userId: result.userId });

        const evaluatorAgent = mastra.getAgent('evaluator');
        if (!evaluatorAgent) {
          throw new Error('Evaluator agent not found');
        }

        // Evaluate founder submission
        const artifacts = result.data.artifacts as any;
        
        const prompt = `
Evaluate this founder's submission:

**Founder Profile:**
${(result.data.profile as any)?.bio || 'Not provided'}

**Challenge Artifacts:**
- Video: ${artifacts?.videoUrl || 'Not provided'}
- 5-liner: ${artifacts?.fiveLiner || 'Not provided'}
- GitHub/Code: ${artifacts?.codeUrl || 'Not provided'}

Use your evaluation framework to:
1. Score them (0-100)
2. Determine: VC-backable, Bootstrap, or Pivot Needed
3. Provide honest feedback and next steps

Be tough but fair. This is a real investment decision.
        `.trim();

        const evalResult = await evaluatorAgent.generate(prompt, {
          resourceId: result.runtimeContext.resourceId,
        });

        return {
          success: true,
          phase: 'evaluation',
          nextPhase: 'sprint',
          data: {
            ...result.data,
            evaluation: {
              feedback: evalResult.text,
              timestamp: new Date().toISOString(),
            },
          },
          message: 'Evaluation completed',
        };
      }
    },

    // PHASE 6: SPRINT
    sprint: {
      then: async ({ result, context }) => {
        context.logger?.info('Sprint phase', { userId: result.userId });

        const mentorAgent = mastra.getAgent('mentor');
        if (!mentorAgent) {
          throw new Error('Mentor agent not found');
        }

        // Mentor guides through 3-week program
        const sprintAction = result.data.sprintAction || 'setup';
        const evaluation = result.data.evaluation as any;
        
        let prompt = '';
        if (sprintAction === 'setup') {
          prompt = `
Set up the 3-week sprint program for this founder.

**Their Evaluation:**
${evaluation?.feedback || 'VC-backable track'}

**Time Commitment:**
${result.data.timeCommitment || '10-15'} hours/week

Create Week 1 OKRs (3 objectives, measurable and realistic).
Explain the sprint structure and community features.
        `.trim();
        } else if (sprintAction === 'checkin') {
          const userUpdate = result.data.userUpdate as string;
          prompt = `
Weekly check-in. Founder update: "${userUpdate}"

Provide mentorship:
- Celebrate wins
- Address blockers
- Adjust OKRs if needed
- Share relevant startup wisdom
          `.trim();
        } else if (sprintAction === 'complete') {
          prompt = `
3-week sprint completed! Provide:
- Overall assessment of progress
- Next steps (fundraising or growth strategy)
- Introduction to community and alumni network
          `.trim();
        }

        const mentorResult = await mentorAgent.generate(prompt, {
          resourceId: result.runtimeContext.resourceId,
        });

        return {
          success: true,
          phase: 'sprint',
          nextPhase: result.data.weekNumber === 3 ? 'graduate' : 'sprint',
          data: {
            ...result.data,
            mentorResponse: mentorResult.text,
          },
          message: 'Sprint in progress',
        };
      }
    },
  })

  // Final step: Commit the workflow
  .commit();

/**
 * Helper function to execute workflow with better error handling
 */
export async function executeFounderJourney(input: z.infer<typeof FounderJourneyInputSchema>) {
  try {
    const result = await founderJourneyWorkflow.execute({
      input,
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('Founder journey workflow error:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      phase: input.phase,
    };
  }
}

// Export types
export type FounderJourneyInput = z.infer<typeof FounderJourneyInputSchema>;
export type FounderJourneyOutput = z.infer<typeof FounderJourneyOutputSchema>;
