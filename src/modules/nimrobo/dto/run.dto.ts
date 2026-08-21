import { z } from 'zod';

export const RunStatusSchema = z.enum(['pending', 'running', 'completed', 'failed', 'cancelled']);
export type RunStatus = z.infer<typeof RunStatusSchema>;

export const RunStepSchema = z.object({
  step_number: z.number().describe('Sequence index of the step'),
  name: z.string().describe('Step identifier or action title'),
  status: RunStatusSchema,
  started_at: z.string().optional(),
  completed_at: z.string().optional(),
  details: z.record(z.any()).optional(),
  logs: z.array(z.string()).default([]),
});

export const OutcomeRunSchema = z.object({
  id: z.string().describe('Unique run execution ID (e.g. run_20260821_01)'),
  outcome_id: z.string().describe('Associated outcome ID'),
  status: RunStatusSchema.describe('Current execution status of the run'),
  target_environment: z.enum(['local_mac', 'cloud', 'staging']).default('local_mac'),
  parameters: z.record(z.any()).default({}).describe('Parameters supplied for this experiment/run'),
  hypothesis: z.string().optional().describe('Experiment hypothesis being tested'),
  actions_executed: z.array(z.string()).default([]).describe('List of agent actions executed'),
  metric_before: z.number().optional().describe('Metric value measured before run'),
  metric_after: z.number().optional().describe('Metric value measured after run'),
  started_at: z.string().describe('ISO timestamp of execution start'),
  completed_at: z.string().optional().describe('ISO timestamp of execution end'),
  duration_seconds: z.number().optional().describe('Run duration in seconds'),
  error: z.string().optional().describe('Error message if status is failed'),
  steps: z.array(RunStepSchema).default([]),
});

export type OutcomeRun = z.infer<typeof OutcomeRunSchema>;

export const DispatchRunInputSchema = z.object({
  outcome_id: z.string().describe('Outcome ID to execute a run for'),
  parameters: z.record(z.any()).optional().describe('Optional key-value parameters to pass to the agent'),
  hypothesis: z.string().optional().describe('Hypothesis or goal for this specific outcome experiment'),
  target_environment: z.enum(['local_mac', 'cloud']).default('local_mac').describe('Where the run should execute'),
  dry_run: z.boolean().default(false).describe('Simulate the run execution without applying actual modifications'),
});

export type DispatchRunInput = z.infer<typeof DispatchRunInputSchema>;
