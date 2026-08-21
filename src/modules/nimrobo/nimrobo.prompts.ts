import { PromptDecorator as Prompt, ExecutionContext, z, Injectable } from '@nitrostack/core';
import { NimroboClientService } from '../../services/nimrobo-client.service.js';

@Injectable({ deps: [NimroboClientService] })
export class NimroboPrompts {
  constructor(private nimroboClient: NimroboClientService) {}

  @Prompt({
    name: 'analyze_outcome_performance',
    description: 'Generates a detailed prompt to analyze the historical performance and ROI of a Nimrobo outcome.',
    arguments: [
      {
        name: 'outcome_id',
        description: 'The outcome ID to analyze (e.g. out_checkout_conversion)',
        required: true,
      },
      {
        name: 'time_range',
        description: 'Time window (7d, 30d, 90d, all)',
        required: false,
      },
    ],
  })
  async analyzeOutcomePerformance(
    args: { outcome_id: string; time_range?: string },
    _ctx: ExecutionContext
  ) {
    const analytics = await this.nimroboClient.getOutcomeAnalytics(
      args.outcome_id,
      args.time_range || '30d'
    );

    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Please analyze the performance metrics for Nimrobo Outcome "${analytics.outcome_name}" (${analytics.outcome_id}):

Summary:
- Baseline: ${analytics.summary.baseline}
- Current: ${analytics.summary.current}
- Relative Lift: +${analytics.summary.relative_lift_percent}%
- Statistically Significant: ${analytics.summary.is_statistically_significant ? 'Yes' : 'No'}
- Confidence Level: ${analytics.summary.confidence_level}%
- Total Runs: ${analytics.summary.total_runs} (Successful: ${analytics.summary.successful_runs})

Please provide:
1. An executive summary of the performance trend.
2. Statistical validation and confidence interpretation.
3. Top recommendations for the next experiment hypothesis to maximize the outcome.`,
          },
        },
      ],
    };
  }

  @Prompt({
    name: 'plan_outcome_experiment',
    description: 'Assists in formulating a structured experiment hypothesis and parameters for an Outcome run.',
    arguments: [
      {
        name: 'outcome_id',
        description: 'Target outcome ID',
        required: true,
      },
      {
        name: 'optimization_goal',
        description: 'What specific improvement or change to test',
        required: true,
      },
    ],
  })
  async planOutcomeExperiment(
    args: { outcome_id: string; optimization_goal: string },
    _ctx: ExecutionContext
  ) {
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `I want to plan an experiment for Outcome "${args.outcome_id}" targeting: "${args.optimization_goal}".

Please structure a concrete experiment specification:
1. Hypothesis formulation: "If we [action], then [target metric] will increase by [expected delta] because [rationale]."
2. Key parameters to test.
3. Measurement cohort size and minimum observation duration.
4. Suggested dispatch payload for "dispatch_outcome_run".`,
          },
        },
      ],
    };
  }
}
