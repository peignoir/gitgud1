import { createTool } from '@mastra/core';
import { z } from 'zod';

/**
 * LinkedIn Research Tool
 * Simulates LinkedIn profile research and analysis
 * In production, integrate with LinkedIn API or web scraping
 */
/**
 * Extract LinkedIn username from URL
 */
function extractLinkedInUsername(url: string): string | null {
  try {
    const patterns = [
      /linkedin\.com\/in\/([^/\?]+)/i,
      /linkedin\.com\/pub\/([^/\?]+)/i,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Generate personalized mock data based on LinkedIn URL
 */
function generatePersonalizedMockData(linkedinUrl: string) {
  const username = extractLinkedInUsername(linkedinUrl);
  const name = username 
    ? username.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : 'Founder Profile';
  
  // Note: In production, this would call LinkedIn API or scraping service
  // For now, we return structured data that indicates it's a template
  return {
    profile: {
      name,
      headline: 'Experienced Professional | Tech Builder',
      location: 'Location Not Available',
      experience: [
        {
          title: 'Current or Most Recent Role',
          company: 'Company Name',
          duration: 'Duration',
          description: 'Role description and achievements not available via automated research',
        },
      ],
      education: [
        {
          school: 'Educational Institution',
          degree: 'Degree',
          field: 'Field of Study',
        },
      ],
      skills: ['Skill 1', 'Skill 2', 'Skill 3'],
    },
    analysis: {
      founderPotential: 70,
      strengths: ['Professional background', 'Industry experience'],
      domains: ['Technology', 'Product', 'Business'],
      experience_level: 'experienced' as const,
    },
    dataSource: 'template', // Indicates this is template data
    linkedinUrl,
  };
}

export const linkedinResearchTool = createTool({
  id: 'linkedin-research',
  description: 'Research and analyze a LinkedIn profile to extract founder information, experience, skills, and entrepreneurial potential. Note: Currently returns template data - LinkedIn API integration pending.',
  inputSchema: z.object({
    linkedinUrl: z.string().describe('LinkedIn profile URL to research'),
    depth: z.enum(['basic', 'detailed']).default('detailed').describe('Level of analysis depth'),
  }),
  outputSchema: z.object({
    profile: z.object({
      name: z.string(),
      headline: z.string(),
      location: z.string().optional(),
      experience: z.array(z.object({
        title: z.string(),
        company: z.string(),
        duration: z.string(),
        description: z.string().optional(),
      })),
      education: z.array(z.object({
        school: z.string(),
        degree: z.string().optional(),
        field: z.string().optional(),
      })),
      skills: z.array(z.string()),
    }),
    analysis: z.object({
      founderPotential: z.number().describe('Score 0-100'),
      strengths: z.array(z.string()),
      domains: z.array(z.string()).describe('Recommended startup domains'),
      experience_level: z.enum(['first-time', 'experienced', 'serial']),
    }),
    dataSource: z.string().optional(),
    linkedinUrl: z.string().optional(),
  }),
  execute: async ({ context, data }: any) => {
    const inputData = data || {};
    const { linkedinUrl, depth } = inputData;
    
    // Log the research action
    context.logger?.info('LinkedIn research requested', { linkedinUrl, depth });

    // Validate URL format
    if (!linkedinUrl || !linkedinUrl.includes('linkedin.com')) {
      context.logger?.warn('Invalid LinkedIn URL provided', { linkedinUrl });
      return generatePersonalizedMockData(linkedinUrl || '');
    }

    // Extract username for fallback
    const username = extractLinkedInUsername(linkedinUrl);
    const name = username 
      ? username.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      : 'Founder Profile';

    // Try to fetch the public LinkedIn page
    try {
      const response = await fetch(linkedinUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
      });

      if (response.ok) {
        const html = await response.text();
        
        // Basic parsing of LinkedIn public profile
        // Extract headline
        const headlineMatch = html.match(/<title>([^<]+)<\/title>/);
        const headline = headlineMatch ? headlineMatch[1].replace(' | LinkedIn', '').trim() : 'Professional';
        
        // Extract description/about section (simplified)
        const aboutMatch = html.match(/<meta name="description" content="([^"]+)"/);
        const about = aboutMatch ? aboutMatch[1] : '';
        
        context.logger?.info('Successfully fetched LinkedIn page', { headline });
        
        return {
          profile: {
            name,
            headline,
            location: 'Extracted from profile',
            experience: [
              {
                title: 'See full profile on LinkedIn',
                company: 'LinkedIn profile data extracted',
                duration: '',
                description: about,
              },
            ],
            education: [],
            skills: [],
          },
          analysis: {
            founderPotential: 75,
            strengths: ['Professional background extracted from LinkedIn'],
            domains: ['Based on public profile'],
            experience_level: 'experienced' as const,
          },
          dataSource: 'linkedin-scraped',
          linkedinUrl,
          rawData: {
            headline,
            about,
          },
        };
      }
    } catch (error) {
      context.logger?.warn('Failed to fetch LinkedIn page', { error });
    }

    // Fall back to template data
    context.logger?.info('Returning template data (fetch failed or not accessible)');
    return generatePersonalizedMockData(linkedinUrl);
  },
});
