import { z } from 'zod';

export const OutcomeStatusSchema = z.enum(['active', 'paused', 'archived', 'draft']);
export type OutcomeStatus = z.infer<typeof OutcomeStatusSchema>;

export const OutcomeSchema = z.object({
  id: z.string().describe('Unique identifier for the outcome (e.g. out_checkout_conversion)'),
  name: z.string().describe('Descriptive name of the outcome'),
  description: z.string().describe('Detailed description and goal of the outcome'),
  status: OutcomeStatusSchema.describe('Current lifecycle status of the outcome'),
  target_metric: z.string().describe('Key metric being optimized (e.g. conversion_rate, latency_ms)'),
  baseline_value: z.number().describe('Baseline performance value before optimization'),
  current_value: z.number().describe('Current achieved performance value'),
  unit: z.string().describe('Measurement unit (% or ms or count)'),
  created_at: z.string().describe('Creation timestamp'),
  updated_at: z.string().describe('Last updated timestamp'),
  tags: z.array(z.string()).default([]).describe('Classification tags'),
});

export type Outcome = z.infer<typeof OutcomeSchema>;

export const TimeRangeSchema = z.enum(['7d', '30d', '90d', 'all']).default('30d');
export type TimeRange = z.infer<typeof TimeRangeSchema>;

export const MetricDataPointSchema = z.object({
  date: z.string().describe('Date / bucket ISO string'),
  value: z.number().describe('Metric value at point in time'),
  sample_size: z.number().describe('Number of sessions or observations'),
  confidence_lower: z.number().optional().describe('Lower bound of confidence interval (95%)'),
  confidence_upper: z.number().optional().describe('Upper bound of confidence interval (95%)'),
});

export const OutcomeAnalyticsSchema = z.object({
  outcome_id: z.string().describe('Outcome ID'),
  outcome_name: z.string().describe('Outcome name'),
  time_range: TimeRangeSchema,
  summary: z.object({
    baseline: z.number().describe('Baseline value'),
    current: z.number().describe('Current value'),
    absolute_change: z.number().describe('Absolute difference'),
    relative_lift_percent: z.number().describe('Relative improvement percentage'),
    is_statistically_significant: z.boolean().describe('Whether improvement is statistically significant'),
    confidence_level: z.number().describe('Confidence level percentage, e.g. 97.5%'),
    total_runs: z.number().describe('Total runs executed for this outcome'),
    successful_runs: z.number().describe('Total successful runs'),
  }),
  timeline: z.array(MetricDataPointSchema).describe('Historical time series data points'),
});

export type OutcomeAnalytics = z.infer<typeof OutcomeAnalyticsSchema>;
