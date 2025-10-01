import { createTool } from '@mastra/core';
import { z } from 'zod';

/**
 * Founder Assessment Tool
 * Evaluates founder potential and provides detailed analysis
 */
export const founderAssessmentTool = createTool({
  id: 'founder-assessment',
  description: 'Assess founder potential based on profile, experience, and market fit. Determines if venture-backable or bootstrap-ready.',
  inputSchema: z.object({
    profile: z.object({
      experience: z.array(z.object({
        title: z.string(),
        company: z.string(),
        duration: z.string().optional(),
      })).optional(),
      education: z.array(z.object({
        school: z.string(),
        degree: z.string().optional(),
      })).optional(),
      skills: z.array(z.string()).optional(),
    }),
    domains: z.array(z.string()).optional(),
    marketData: z.string().optional(),
  }),
  outputSchema: z.object({
    assessment: z.object({
      overallScore: z.number().describe('0-100 score'),
      category: z.enum(['vc-backable', 'bootstrap', 'hybrid']),
      reasoning: z.string(),
      strengths: z.array(z.string()),
      gaps: z.array(z.string()),
      recommendations: z.array(z.string()),
    }),
    founderArchetype: z.object({
      type: z.enum(['builder', 'visionary', 'operator', 'researcher']),
      description: z.string(),
      famousExamples: z.array(z.string()),
    }),
  }),
  execute: async ({ context, data }: any) => {
    const inputData = data || {};
    const { profile, domains } = inputData;
    
    context.logger?.info('Assessing founder potential', { domains });

    // TODO: Use LLM for sophisticated analysis
    // For now, return structured assessment
    
    return {
      assessment: {
        overallScore: 82,
        category: 'vc-backable',
        reasoning: 'Strong technical background with product experience. Domain expertise in high-growth market.',
        strengths: [
          'Technical execution capability',
          'Product development experience',
          'Domain knowledge',
        ],
        gaps: [
          'Sales and go-to-market experience',
          'Team building at scale',
        ],
        recommendations: [
          'Focus on customer discovery in first 30 days',
          'Consider technical co-founder with complementary skills',
          'Build MVP to validate market demand',
        ],
      },
      founderArchetype: {
        type: 'builder',
        description: 'Technical founder who excels at building products and solving complex problems',
        famousExamples: ['Mark Zuckerberg', 'Larry Page', 'Patrick Collison'],
      },
    };
  },
});
