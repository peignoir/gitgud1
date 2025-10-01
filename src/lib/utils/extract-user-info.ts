/**
 * Extract user information from conversation text
 *
 * This utility detects personal info shared during chat and structures it
 * for storage in Mastra memory.
 */

export interface ExtractedUserInfo {
  personalInfo?: {
    location?: string;
    timezone?: string;
    interests?: string[];
    skills?: string[];
  };
  professionalInfo?: {
    currentRole?: string;
    currentCompany?: string;
    pastCompanies?: string[];
    yearsOfExperience?: number;
  };
  founderInfo?: {
    ideaDescription?: string;
    targetMarket?: string;
    stage?: string; // idea, building, launched, etc.
    cofounderStatus?: string; // solo, looking, has cofounder
  };
  preferences?: {
    workingHours?: string;
    communicationStyle?: string;
    goals?: string[];
  };
}

/**
 * Extract structured user info from conversation text
 * Uses pattern matching to identify key information shared by the user
 */
export function extractUserInfo(text: string): ExtractedUserInfo | null {
  const info: ExtractedUserInfo = {};
  let hasInfo = false;

  // Location detection
  const locationPatterns = [
    /I(?:'m| am) (?:based |located |living |from )?(?:in |at )?([A-Z][a-z]+(?:,?\s+[A-Z][a-z]+)*)/i,
    /I live in ([A-Z][a-z]+(?:,?\s+[A-Z][a-z]+)*)/i,
    /(?:based|located) in ([A-Z][a-z]+(?:,?\s+[A-Z][a-z]+)*)/i,
  ];

  for (const pattern of locationPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      info.personalInfo = info.personalInfo || {};
      info.personalInfo.location = match[1].trim();
      hasInfo = true;
      break;
    }
  }

  // Current role/company
  const rolePatterns = [
    /I(?:'m| am) (?:a |an |the )?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+at\s+([A-Z][a-zA-Z0-9\s]+)/i,
    /I work as (?:a |an |the )?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+at\s+([A-Z][a-zA-Z0-9\s]+)/i,
    /currently (?:working|employed) at ([A-Z][a-zA-Z0-9\s]+)/i,
  ];

  for (const pattern of rolePatterns) {
    const match = text.match(pattern);
    if (match) {
      info.professionalInfo = info.professionalInfo || {};
      if (match[2]) {
        info.professionalInfo.currentRole = match[1]?.trim();
        info.professionalInfo.currentCompany = match[2].trim();
      } else {
        info.professionalInfo.currentCompany = match[1]?.trim();
      }
      hasInfo = true;
      break;
    }
  }

  // Startup/idea description
  const ideaPatterns = [
    /(?:I'm building|building|working on|creating) (?:a |an )?([^.!?]+)/i,
    /(?:my|our) (?:startup|company|product) (?:is |does |helps )?([^.!?]+)/i,
    /(?:we're|I'm) (?:creating|developing|launching) (?:a |an )?([^.!?]+)/i,
  ];

  for (const pattern of ideaPatterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[1].length > 10 && match[1].length < 200) {
      info.founderInfo = info.founderInfo || {};
      info.founderInfo.ideaDescription = match[1].trim();
      hasInfo = true;
      break;
    }
  }

  // Target market
  const marketPatterns = [
    /(?:targeting|for|serving) ([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+and\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)?)/i,
    /(?:our|my) target (?:market|audience|customers?) (?:is |are )?([^.!?]+)/i,
  ];

  for (const pattern of marketPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      info.founderInfo = info.founderInfo || {};
      info.founderInfo.targetMarket = match[1].trim();
      hasInfo = true;
      break;
    }
  }

  // Skills mentioned
  const skillPatterns = [
    /I(?:'m| am) (?:good at|experienced in|skilled in|proficient in) ([^.!?]+)/i,
    /I know ([^.!?]+)/i,
    /I can ([^.!?]+)/i,
  ];

  for (const pattern of skillPatterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[1].length < 100) {
      info.personalInfo = info.personalInfo || {};
      info.personalInfo.skills = info.personalInfo.skills || [];
      info.personalInfo.skills.push(match[1].trim());
      hasInfo = true;
      break;
    }
  }

  // Goals
  const goalPatterns = [
    /(?:my goal is|I want to|I'm trying to|I hope to) ([^.!?]+)/i,
    /(?:planning to|aiming to|goal of) ([^.!?]+)/i,
  ];

  for (const pattern of goalPatterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[1].length > 10 && match[1].length < 200) {
      info.preferences = info.preferences || {};
      info.preferences.goals = info.preferences.goals || [];
      info.preferences.goals.push(match[1].trim());
      hasInfo = true;
      break;
    }
  }

  return hasInfo ? info : null;
}

/**
 * Format extracted info as a memory string for Mastra
 */
export function formatUserInfoForMemory(info: ExtractedUserInfo): string {
  const parts: string[] = [];

  if (info.personalInfo) {
    const { location, skills } = info.personalInfo;
    if (location) parts.push(`Location: ${location}`);
    if (skills && skills.length > 0) parts.push(`Skills: ${skills.join(', ')}`);
  }

  if (info.professionalInfo) {
    const { currentRole, currentCompany, pastCompanies } = info.professionalInfo;
    if (currentRole && currentCompany) {
      parts.push(`Current: ${currentRole} at ${currentCompany}`);
    } else if (currentCompany) {
      parts.push(`Working at: ${currentCompany}`);
    }
    if (pastCompanies && pastCompanies.length > 0) {
      parts.push(`Past companies: ${pastCompanies.join(', ')}`);
    }
  }

  if (info.founderInfo) {
    const { ideaDescription, targetMarket, stage, cofounderStatus } = info.founderInfo;
    if (ideaDescription) parts.push(`Building: ${ideaDescription}`);
    if (targetMarket) parts.push(`Target market: ${targetMarket}`);
    if (stage) parts.push(`Stage: ${stage}`);
    if (cofounderStatus) parts.push(`Cofounder status: ${cofounderStatus}`);
  }

  if (info.preferences) {
    const { goals } = info.preferences;
    if (goals && goals.length > 0) parts.push(`Goals: ${goals.join(', ')}`);
  }

  return parts.join('\n');
}
