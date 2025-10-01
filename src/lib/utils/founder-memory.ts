/**
 * Founder Memory Referential
 * 
 * Stores and manages everything Guddy learns about the founder:
 * - Personal info (name, location, background)
 * - Professional history (companies, roles, exits)
 * - Skills and expertise
 * - Preferences and patterns
 * - Behavioral insights
 */

export interface FounderMemory {
  // Identity
  name?: string;
  linkedinUrl?: string;
  location?: string;
  
  // Professional Background
  companies: CompanyInfo[];
  education: EducationInfo[];
  skills: string[];
  expertise: string[];
  
  // Founder Profile
  archetype?: 'Builder' | 'Visionary' | 'Operator' | 'Researcher';
  bio?: string; // Generated bio (summary)
  
  // Behavioral Patterns (learned from interactions)
  patterns: {
    workStyle?: string; // e.g., "ships fast", "overthinks scope"
    strengths?: string[];
    challenges?: string[];
    preferences?: string[]; // e.g., "prefers coding at night"
  };
  
  // Interaction History
  insights: string[]; // Key insights Guddy has learned
  lastUpdated: string;
}

export interface CompanyInfo {
  name: string;
  role: string;
  years: string; // e.g., "2015-2020" or "2020-present"
  description?: string;
  outcome?: string; // e.g., "Acquired by Techstars", "Raised $2M"
  impact?: string; // What they achieved
}

export interface EducationInfo {
  school: string;
  degree?: string;
  field?: string;
  years?: string;
}

export interface StartupMemory {
  // Core Idea
  name?: string;
  tagline?: string;
  description?: string;
  problem?: string;
  solution?: string;
  
  // Business Model
  customer?: string;
  market?: string;
  opportunity?: string;
  
  // Progress
  stage?: 'idea' | 'prototype' | 'mvp' | 'launched' | 'scaling';
  milestones: Milestone[];
  
  // Vibe Code Challenge
  challenge?: {
    startedAt?: string;
    completedAt?: string;
    artifact?: string; // What they built
    demo?: string; // Video URL
    fiveLiner?: string;
  };
  
  // 3-Week Sprint
  sprint?: {
    week: number;
    okrs: OKR[];
    progress: string[];
  };
  
  // Insights & Decisions
  pivots: string[]; // Track pivots/changes
  decisions: string[]; // Key decisions made
  blockers: string[]; // Current blockers
  
  lastUpdated: string;
}

export interface Milestone {
  date: string;
  description: string;
  type: 'product' | 'customer' | 'funding' | 'team' | 'other';
}

export interface OKR {
  objective: string;
  keyResults: string[];
  status: 'not-started' | 'in-progress' | 'completed' | 'blocked';
}

/**
 * Memory Storage (localStorage + API sync)
 */
const FOUNDER_MEMORY_KEY = 'founder-memory';
const STARTUP_MEMORY_KEY = 'startup-memory';

export class MemoryManager {
  // --- FOUNDER MEMORY ---
  
  static getFounderMemory(): FounderMemory {
    const stored = localStorage.getItem(FOUNDER_MEMORY_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return this.getDefaultFounderMemory();
  }
  
  static saveFounderMemory(memory: Partial<FounderMemory>): void {
    const current = this.getFounderMemory();
    const updated = {
      ...current,
      ...memory,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(FOUNDER_MEMORY_KEY, JSON.stringify(updated));
    console.log('💾 [Founder Memory] Saved:', Object.keys(memory));
  }
  
  static updateFounderPattern(pattern: string, value: string): void {
    const memory = this.getFounderMemory();
    memory.patterns = {
      ...memory.patterns,
      [pattern]: value,
    };
    this.saveFounderMemory(memory);
  }
  
  static addFounderInsight(insight: string): void {
    const memory = this.getFounderMemory();
    if (!memory.insights.includes(insight)) {
      memory.insights.push(insight);
      this.saveFounderMemory(memory);
    }
  }
  
  // --- STARTUP MEMORY ---
  
  static getStartupMemory(): StartupMemory {
    const stored = localStorage.getItem(STARTUP_MEMORY_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return this.getDefaultStartupMemory();
  }
  
  static saveStartupMemory(memory: Partial<StartupMemory>): void {
    const current = this.getStartupMemory();
    const updated = {
      ...current,
      ...memory,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(STARTUP_MEMORY_KEY, JSON.stringify(updated));
    console.log('💾 [Startup Memory] Saved:', Object.keys(memory));
  }
  
  static addStartupMilestone(milestone: Milestone): void {
    const memory = this.getStartupMemory();
    memory.milestones.push(milestone);
    this.saveStartupMemory(memory);
  }
  
  static addStartupPivot(pivot: string): void {
    const memory = this.getStartupMemory();
    memory.pivots.push(pivot);
    this.saveStartupMemory(memory);
  }
  
  static addStartupBlocker(blocker: string): void {
    const memory = this.getStartupMemory();
    if (!memory.blockers.includes(blocker)) {
      memory.blockers.push(blocker);
      this.saveStartupMemory(memory);
    }
  }
  
  // --- CONTEXT BUILDING ---
  
  static buildFounderContext(): string {
    const memory = this.getFounderMemory();
    
    let context = `FOUNDER PROFILE:\n`;
    context += `Name: ${memory.name || 'Unknown'}\n`;
    context += `Archetype: ${memory.archetype || 'Builder'}\n`;
    
    if (memory.companies.length > 0) {
      context += `\nPast Companies:\n`;
      memory.companies.forEach(c => {
        context += `- ${c.name} (${c.role}, ${c.years})${c.outcome ? ' - ' + c.outcome : ''}\n`;
      });
    }
    
    if (memory.education.length > 0) {
      context += `\nEducation:\n`;
      memory.education.forEach(e => {
        context += `- ${e.school}${e.degree ? ', ' + e.degree : ''}${e.field ? ' in ' + e.field : ''}\n`;
      });
    }
    
    if (memory.skills.length > 0) {
      context += `\nSkills: ${memory.skills.join(', ')}\n`;
    }
    
    if (memory.patterns.workStyle) {
      context += `\nWork Style: ${memory.patterns.workStyle}\n`;
    }
    
    if (memory.patterns.strengths && memory.patterns.strengths.length > 0) {
      context += `Strengths: ${memory.patterns.strengths.join(', ')}\n`;
    }
    
    if (memory.patterns.challenges && memory.patterns.challenges.length > 0) {
      context += `Challenges: ${memory.patterns.challenges.join(', ')}\n`;
    }
    
    if (memory.insights.length > 0) {
      context += `\nKey Insights:\n`;
      memory.insights.slice(-5).forEach(insight => {
        context += `- ${insight}\n`;
      });
    }
    
    return context;
  }
  
  static buildStartupContext(): string {
    const memory = this.getStartupMemory();
    
    if (!memory.name && !memory.description) {
      return 'STARTUP: Not yet defined';
    }
    
    let context = `STARTUP INFO:\n`;
    context += `Name: ${memory.name || 'Unnamed'}\n`;
    if (memory.tagline) context += `Tagline: ${memory.tagline}\n`;
    if (memory.problem) context += `Problem: ${memory.problem}\n`;
    if (memory.solution) context += `Solution: ${memory.solution}\n`;
    if (memory.customer) context += `Customer: ${memory.customer}\n`;
    
    context += `Stage: ${memory.stage || 'idea'}\n`;
    
    if (memory.milestones.length > 0) {
      context += `\nMilestones:\n`;
      memory.milestones.slice(-3).forEach(m => {
        context += `- ${m.date}: ${m.description}\n`;
      });
    }
    
    if (memory.blockers.length > 0) {
      context += `\nCurrent Blockers:\n`;
      memory.blockers.forEach(b => {
        context += `- ${b}\n`;
      });
    }
    
    if (memory.pivots.length > 0) {
      context += `\nPivots/Changes:\n`;
      memory.pivots.forEach(p => {
        context += `- ${p}\n`;
      });
    }
    
    return context;
  }
  
  static buildFullContext(): string {
    return `
${this.buildFounderContext()}

---

${this.buildStartupContext()}
`.trim();
  }
  
  // --- RESET ---
  
  static resetAll(): void {
    localStorage.removeItem(FOUNDER_MEMORY_KEY);
    localStorage.removeItem(STARTUP_MEMORY_KEY);
    console.log('🗑️ [Memory] All memory cleared');
  }
  
  // --- DEFAULTS ---
  
  private static getDefaultFounderMemory(): FounderMemory {
    return {
      companies: [],
      education: [],
      skills: [],
      expertise: [],
      patterns: {},
      insights: [],
      lastUpdated: new Date().toISOString(),
    };
  }
  
  private static getDefaultStartupMemory(): StartupMemory {
    return {
      milestones: [],
      pivots: [],
      decisions: [],
      blockers: [],
      lastUpdated: new Date().toISOString(),
    };
  }
}
