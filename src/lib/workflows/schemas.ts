import { z } from 'zod';

// Common schemas for founder workflow
export const UserProfileSchema = z.object({
  userId: z.string(),
  name: z.string().optional(),
  email: z.string().email().optional(),
  timezone: z.string().optional(),
  linkedinUrl: z.string().url().optional(),
  githubUrl: z.string().url().optional(),
});

export const FounderAssessmentSchema = z.object({
  userId: z.string(),
  profile: UserProfileSchema,
  linkedinData: z.object({
    experience: z.array(z.string()),
    skills: z.array(z.string()),
    education: z.array(z.string()),
    summary: z.string().optional(),
  }).optional(),
  responses: z.record(z.string(), z.unknown()).optional(),
});

export const HouseClassificationSchema = z.object({
  house: z.enum(['visionary', 'operator', 'technologist', 'communicator', 'builder']),
  reasoning: z.string(),
  traits: z.array(z.string()),
  confidence: z.number().min(0).max(1),
});

export const ChallengeArtifactsSchema = z.object({
  mode: z.enum(['event', 'home']),
  videoUrl: z.string().url().optional(),
  fiveLiner: z.string().max(500).optional(),
  githubRepo: z.string().url().optional(),
  githubCommit: z.string().optional(),
  duration: z.number().optional(), // minutes spent
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
});

export const SprintProgressSchema = z.object({
  userId: z.string(),
  week: z.number().min(1).max(3),
  startDate: z.date(),
  tasks: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    completed: z.boolean().default(false),
    completedAt: z.date().optional(),
  })),
  metrics: z.object({
    tasksCompleted: z.number().default(0),
    commitsCount: z.number().default(0),
    submissionsCount: z.number().default(0),
    completionPercentage: z.number().min(0).max(100).default(0),
  }),
  status: z.enum(['on-track', 'behind', 'excelling']).default('on-track'),
});

export const WorkflowContextSchema = z.object({
  userId: z.string(),
  sessionId: z.string(),
  userTimezone: z.string(),
  currentPhase: z.enum(['onboarding', 'assessment', 'profile', 'challenge', 'sprint']),
  resourceId: z.string().optional(), // for persistent memory across sessions
});

// Output schemas for each workflow step
export const OnboardingOutputSchema = z.object({
  userId: z.string(),
  timezone: z.string(),
  profile: UserProfileSchema,
  phase: z.literal('assessment'),
});

export const AssessmentOutputSchema = z.object({
  userId: z.string(),
  assessment: FounderAssessmentSchema,
  generatedBio: z.string(),
  phase: z.literal('profile'),
});

export const ProfileOutputSchema = z.object({
  userId: z.string(),
  finalBio: z.string(),
  house: HouseClassificationSchema,
  phase: z.literal('challenge'),
});

export const ChallengeOutputSchema = z.object({
  userId: z.string(),
  artifacts: ChallengeArtifactsSchema,
  house: HouseClassificationSchema,
  phase: z.literal('sprint'),
});