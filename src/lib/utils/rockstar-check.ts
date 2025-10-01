/**
 * Rockstar Check Utility
 *
 * Determines if a founder is "famous" by researching their background using AI.
 * Famous founders get a red star ⭐ on their profile.
 */

import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

export interface RockstarCheckResult {
  isFamous: boolean;
  famousReason?: string;
  confidenceScore?: number; // 0-100
  notableAchievements?: string[];
}

/**
 * Check if a founder is famous using AI research
 *
 * Searches for the founder online using their name, bio, and LinkedIn
 * to determine if they have notable achievements or fame.
 */
export async function checkIfRockstar(params: {
  name?: string;
  bio?: string;
  linkedinUrl?: string;
  email?: string;
}): Promise<RockstarCheckResult> {
  const { name, bio, linkedinUrl, email } = params;

  // Skip if no useful data
  if (!name && !bio && !linkedinUrl) {
    return { isFamous: false };
  }

  try {
    // Build research prompt
    const prompt = `You are a VC analyst researching if a founder is "famous" or notable in the startup/tech world.

Research the following founder and determine if they are famous or have notable achievements:

${name ? `Name: ${name}` : ''}
${email ? `Email: ${email}` : ''}
${linkedinUrl ? `LinkedIn: ${linkedinUrl}` : ''}
${bio ? `Bio:\n${bio}` : ''}

A founder is considered "famous" if they:
1. Founded/co-founded a company that raised $10M+ in funding
2. Had a successful exit (acquisition or IPO)
3. Are well-known in their industry (frequent speaker, thought leader, large following)
4. Have significant media coverage or awards
5. Previously worked at a famous startup in a senior role (not just any employee)
6. Have a strong reputation in the startup ecosystem

IMPORTANT:
- Being an early employee at a big company does NOT make them famous (e.g., "worked at Google" is not enough)
- Having a LinkedIn or Twitter does NOT make them famous
- Normal startup experience is NOT enough
- Be STRICT - only mark as famous if they have truly notable achievements

Based on the information provided, evaluate if this founder is famous.

Respond in JSON format:
{
  "isFamous": true/false,
  "confidenceScore": 0-100,
  "famousReason": "brief reason why they are famous (2-3 sentences max)",
  "notableAchievements": ["achievement 1", "achievement 2", ...]
}

If NOT famous, set isFamous to false and confidenceScore to 0.`;

    console.log('🔍 [Rockstar Check] Starting research for:', name || email || 'unknown');

    // Use GPT-4o for research (cheaper and faster than GPT-5)
    const result = await generateText({
      model: openai('gpt-4o'),
      prompt,
      temperature: 0.3, // Low temperature for factual analysis
    });

    // Parse JSON response
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('⚠️ [Rockstar Check] No JSON found in response');
      return { isFamous: false };
    }

    const parsed = JSON.parse(jsonMatch[0]);

    console.log('✅ [Rockstar Check] Result:', {
      name: name || 'unknown',
      isFamous: parsed.isFamous,
      confidence: parsed.confidenceScore,
    });

    return {
      isFamous: parsed.isFamous || false,
      famousReason: parsed.famousReason,
      confidenceScore: parsed.confidenceScore || 0,
      notableAchievements: parsed.notableAchievements || [],
    };

  } catch (error) {
    console.error('❌ [Rockstar Check] Error:', error);
    return { isFamous: false };
  }
}

/**
 * Quick check using only bio text (no AI call)
 * Looks for obvious signals of fame
 */
export function quickRockstarCheck(bio: string): boolean {
  if (!bio) return false;

  const famousSignals = [
    /\b(founded|co-founded)\b.*\b(acquired|IPO|raised.*\$\d+[MmBb])/i,
    /\b(YC|Y Combinator|Techstars|500 Startups)\b/i,
    /\b(Forbes|TechCrunch|Wired|WSJ|New York Times)\b.*\b(featured|interviewed|profile)/i,
    /\b(keynote|speaker).*\b(conference|summit|TED)/i,
    /\b(exit|acquisition)\b.*\$\d+[MmBb]/i,
    /\b(unicorn|decacorn)\b/i,
  ];

  return famousSignals.some(pattern => pattern.test(bio));
}
