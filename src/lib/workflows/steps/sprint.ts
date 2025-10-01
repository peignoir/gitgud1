import { createStep } from '@mastra/core';
import { z } from 'zod';
import { SprintProgressSchema } from '../schemas';

// Helper function to find the first Saturday of the month
function getFirstSaturdayOfMonth(timezone: string): Date {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);

  // Find first Saturday (0 = Sunday, 6 = Saturday)
  const daysUntilSaturday = (6 - firstDay.getDay()) % 7;
  const firstSaturday = new Date(firstDay);
  firstSaturday.setDate(firstDay.getDate() + daysUntilSaturday);

  // If first Saturday has passed, get next month's first Saturday
  if (firstSaturday < now) {
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nextDaysUntilSaturday = (6 - nextMonth.getDay()) % 7;
    firstSaturday.setFullYear(nextMonth.getFullYear());
    firstSaturday.setMonth(nextMonth.getMonth());
    firstSaturday.setDate(nextMonth.getDate() + nextDaysUntilSaturday);
  }

  return firstSaturday;
}

// Generate week tasks based on house and week number
function generateWeeklyTasks(house: string, week: number) {
  const baseTasks = {
    1: [
      { id: 'customer-interviews', title: 'Customer Interviews', description: 'Conduct 5 customer discovery interviews' },
      { id: 'problem-validation', title: 'Problem Validation', description: 'Validate your core problem hypothesis' },
      { id: 'competitive-analysis', title: 'Competitive Analysis', description: 'Research 10 direct/indirect competitors' },
    ],
    2: [
      { id: 'mvp-prototype', title: 'MVP Prototype', description: 'Build a minimal viable prototype' },
      { id: 'user-testing', title: 'User Testing', description: 'Test prototype with 10+ users' },
      { id: 'iteration', title: 'Iteration', description: 'Implement feedback and iterate' },
    ],
    3: [
      { id: 'go-to-market', title: 'Go-to-Market Strategy', description: 'Develop GTM plan and first marketing materials' },
      { id: 'metrics', title: 'Metrics Dashboard', description: 'Set up tracking for key metrics' },
      { id: 'next-steps', title: 'Next Phase Planning', description: 'Plan next 90 days and funding strategy' },
    ]
  };

  // House-specific task modifications
  const houseTasks = {
    visionary: week === 1 ? [
      { id: 'vision-doc', title: 'Vision Document', description: 'Create compelling vision and mission statements' }
    ] : [],
    operator: week === 2 ? [
      { id: 'processes', title: 'Process Documentation', description: 'Document key operational processes' }
    ] : [],
    technologist: week === 2 ? [
      { id: 'tech-architecture', title: 'Technical Architecture', description: 'Design scalable technical architecture' }
    ] : [],
    communicator: week === 3 ? [
      { id: 'content-strategy', title: 'Content Strategy', description: 'Develop content marketing strategy' }
    ] : [],
    builder: week === 1 ? [
      { id: 'rapid-prototype', title: 'Rapid Prototype', description: 'Build and test quick prototypes' }
    ] : [],
  };

  return [
    ...baseTasks[week as keyof typeof baseTasks] || [],
    ...houseTasks[house as keyof typeof houseTasks] || [],
  ].map(task => ({ ...task, completed: false }));
}

// Step 5: Sprint - 3-week program with weekly gates
export const sprintStep = createStep({
  id: 'sprint',
  inputSchema: z.object({
    userId: z.string(),
    house: z.string(),
    timezone: z.string(),
    action: z.enum(['start', 'progress', 'complete']).default('start'),
    taskUpdates: z.array(z.object({
      taskId: z.string(),
      completed: z.boolean(),
    })).optional(),
  }),
  outputSchema: z.object({
    userId: z.string(),
    sprint: SprintProgressSchema,
    nextAction: z.enum(['wait', 'continue', 'graduate']),
    waitUntil: z.date().optional(),
  }),

  execute: async ({ input, context }) => {
    const { userId, house, timezone, action, taskUpdates } = input;

    // Get existing sprint progress from memory
    let existingSprint = null;
    if (context.memory) {
      try {
        const sprintData = await context.memory.getWorkingMemory({
          resourceId: userId,
          key: 'sprint'
        });
        existingSprint = sprintData ? SprintProgressSchema.parse(sprintData) : null;
      } catch (error) {
        context.logger?.warn('Could not parse existing sprint data', { userId, error });
      }
    }

    if (action === 'start' && !existingSprint) {
      // Initialize new sprint
      const startDate = getFirstSaturdayOfMonth(timezone);
      const week1Tasks = generateWeeklyTasks(house, 1);

      const newSprint: z.infer<typeof SprintProgressSchema> = {
        userId,
        week: 1,
        startDate,
        tasks: week1Tasks,
        metrics: {
          tasksCompleted: 0,
          commitsCount: 0,
          submissionsCount: 0,
          completionPercentage: 0,
        },
        status: 'on-track',
      };

      if (context.memory) {
        await context.memory.updateWorkingMemory({
          resourceId: userId,
          key: 'sprint',
          value: newSprint
        });
      }

      const now = new Date();
      const waitUntil = startDate > now ? startDate : undefined;

      context.logger?.info('Sprint initialized', {
        userId,
        startDate: startDate.toISOString(),
        week: 1,
        tasksCount: week1Tasks.length
      });

      return {
        userId,
        sprint: newSprint,
        nextAction: waitUntil ? 'wait' : 'continue',
        waitUntil,
      };
    }

    if (action === 'progress' && existingSprint) {
      // Update task progress
      if (taskUpdates) {
        existingSprint.tasks.forEach(task => {
          const update = taskUpdates.find(u => u.taskId === task.id);
          if (update && update.completed !== task.completed) {
            task.completed = update.completed;
            if (update.completed) {
              task.completedAt = new Date();
            }
          }
        });
      }

      // Recalculate metrics
      const completedTasks = existingSprint.tasks.filter(t => t.completed).length;
      existingSprint.metrics.tasksCompleted = completedTasks;
      existingSprint.metrics.completionPercentage =
        Math.round((completedTasks / existingSprint.tasks.length) * 100);

      // Determine status
      const weekProgress = existingSprint.metrics.completionPercentage;
      existingSprint.status = weekProgress >= 80 ? 'excelling' :
                             weekProgress >= 50 ? 'on-track' : 'behind';

      // Check if week is complete and advance
      let nextAction: 'wait' | 'continue' | 'graduate' = 'continue';
      let waitUntil: Date | undefined;

      if (weekProgress >= 80 && existingSprint.week < 3) {
        // Advance to next week
        existingSprint.week += 1;
        existingSprint.tasks = generateWeeklyTasks(house, existingSprint.week);
        existingSprint.metrics.tasksCompleted = 0;
        existingSprint.metrics.completionPercentage = 0;

        // Calculate next Saturday
        const nextWeekStart = new Date(existingSprint.startDate);
        nextWeekStart.setDate(nextWeekStart.getDate() + (existingSprint.week - 1) * 7);

        const now = new Date();
        if (nextWeekStart > now) {
          waitUntil = nextWeekStart;
          nextAction = 'wait';
        }
      } else if (existingSprint.week === 3 && weekProgress >= 80) {
        nextAction = 'graduate';
      }

      if (context.memory) {
        await context.memory.updateWorkingMemory({
          resourceId: userId,
          key: 'sprint',
          value: existingSprint
        });
      }

      context.logger?.info('Sprint progress updated', {
        userId,
        week: existingSprint.week,
        completionPercentage: existingSprint.metrics.completionPercentage,
        status: existingSprint.status,
        nextAction
      });

      return {
        userId,
        sprint: existingSprint,
        nextAction,
        waitUntil,
      };
    }

    throw new Error(`Invalid sprint action: ${action}`);
  },
});