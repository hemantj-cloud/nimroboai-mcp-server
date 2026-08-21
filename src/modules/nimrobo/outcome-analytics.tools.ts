import {
  ToolDecorator as Tool,
  Widget,
  ExecutionContext,
  z,
  UseGuards,
  Injectable,
} from '@nitrostack/core';
import { OAuthGuard } from '../../guards/oauth.guard.js';
import { NimroboClientService } from '../../services/nimrobo-client.service.js';

@Injectable({ deps: [NimroboClientService] })
export class OutcomeAnalyticsTools {
  constructor(private nimroboClient: NimroboClientService) {}

  @Tool({
    name: 'get_user_profile',
    description:
      'Fetches the authenticated user profile, organization, and account details from Nimrobo Cloud (GET /api/v1/user/profile).',
    inputSchema: z.object({}),
    examples: {
      request: {},
      response: {
        id: 'usr_nimrobo_pilot_01',
        email: 'pilot.user@nimroboai.com',
        name: 'Nimrobo AI Engineer',
        organization: 'NitroStack Enterprise Pilot',
        role: 'admin',
        plan: 'enterprise',
        created_at: '2026-01-15T08:00:00Z',
      },
    },
  })
  @Widget('user-profile')
  @UseGuards(OAuthGuard)
  async getUserProfile(_input: {}, _ctx: ExecutionContext) {
    const profile = await this.nimroboClient.getUserProfile();
    return {
      success: true,
      data: profile,
    };
  }

  @Tool({
    name: 'get_outcomes',
    description:
      'Lists available optimization outcomes, their IDs, target metrics, baseline values, and current statuses.',
    inputSchema: z.object({
      status: z
        .enum(['active', 'paused', 'archived', 'draft'])
        .optional()
        .describe('Filter outcomes by status (active, paused, archived, draft)'),
      tag: z
        .string()
        .optional()
        .describe('Filter outcomes by tag (e.g. conversion, checkout, onboarding, performance)'),
      limit: z
        .number()
        .min(1)
        .max(100)
        .default(20)
        .optional()
        .describe('Maximum number of outcomes to return'),
    }),
    examples: {
      request: { status: 'active', limit: 10 },
      response: {
        total: 2,
        outcomes: [
          {
            id: 'out_checkout_conversion',
            name: 'Checkout Funnel Conversion Rate',
            status: 'active',
            target_metric: 'checkout_conversion_rate',
            baseline_value: 3.42,
            current_value: 4.88,
            unit: '%',
          },
        ],
      },
    },
  })
  @Widget('outcomes-catalog')
  @UseGuards(OAuthGuard)
  async getOutcomes(
    input: { status?: 'active' | 'paused' | 'archived' | 'draft'; tag?: string; limit?: number },
    _ctx: ExecutionContext
  ) {
    const outcomes = await this.nimroboClient.getOutcomes(input);
    return {
      success: true,
      count: outcomes.length,
      outcomes,
    };
  }

  @Tool({
    name: 'get_outcome_analytics',
    description:
      'Retrieves detailed performance metrics, conversion lifts, statistical significance, and timeline data for a specific outcome.',
    inputSchema: z.object({
      outcome_id: z
        .string()
        .describe('The unique identifier of the outcome (e.g. out_checkout_conversion)'),
      time_range: z
        .enum(['7d', '30d', '90d', 'all'])
        .default('30d')
        .optional()
        .describe('Time window for analytics metrics (7d, 30d, 90d, all)'),
      metrics: z
        .array(z.string())
        .optional()
        .describe('Optional subset of metrics to retrieve'),
    }),
    examples: {
      request: {
        outcome_id: 'out_checkout_conversion',
        time_range: '30d',
      },
      response: {
        outcome_id: 'out_checkout_conversion',
        outcome_name: 'Checkout Funnel Conversion Rate',
        time_range: '30d',
        summary: {
          baseline: 3.42,
          current: 4.88,
          relative_lift_percent: 42.69,
          is_statistically_significant: true,
          confidence_level: 98.4,
        },
      },
    },
  })
  @Widget('outcome-analytics')
  @UseGuards(OAuthGuard)
  async getOutcomeAnalytics(
    input: { outcome_id: string; time_range?: '7d' | '30d' | '90d' | 'all'; metrics?: string[] },
    _ctx: ExecutionContext
  ) {
    const analytics = await this.nimroboClient.getOutcomeAnalytics(
      input.outcome_id,
      input.time_range || '30d',
      input.metrics
    );
    return {
      success: true,
      analytics,
    };
  }

  @Tool({
    name: 'get_outcome_runs',
    description:
      'Retrieves historical runs and experiment results for outcomes, including parameters tested, duration, and measured before/after metrics.',
    inputSchema: z.object({
      outcome_id: z
        .string()
        .optional()
        .describe('Filter runs by specific outcome ID'),
      status: z
        .enum(['pending', 'running', 'completed', 'failed', 'cancelled'])
        .optional()
        .describe('Filter runs by status'),
      limit: z
        .number()
        .min(1)
        .max(50)
        .default(10)
        .optional()
        .describe('Maximum number of runs to return'),
    }),
    examples: {
      request: { outcome_id: 'out_checkout_conversion', limit: 5 },
      response: {
        count: 2,
        runs: [
          {
            id: 'run_20260820_01',
            outcome_id: 'out_checkout_conversion',
            status: 'completed',
            target_environment: 'local_mac',
            hypothesis: 'Auto-expanding 1-click payment decreases friction',
            metric_before: 4.52,
            metric_after: 4.88,
          },
        ],
      },
    },
  })
  @Widget('outcome-runs')
  @UseGuards(OAuthGuard)
  async getOutcomeRuns(
    input: {
      outcome_id?: string;
      status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
      limit?: number;
    },
    _ctx: ExecutionContext
  ) {
    const runs = await this.nimroboClient.getOutcomeRuns(input);
    return {
      success: true,
      count: runs.length,
      runs,
    };
  }

  @Tool({
    name: 'get_run_status',
    description:
      'Checks the real-time execution status, step progression, executed actions, and diagnostic logs for a specific run ID.',
    inputSchema: z.object({
      run_id: z
        .string()
        .describe('The unique identifier of the run (e.g. run_20260820_01)'),
      include_logs: z
        .boolean()
        .default(true)
        .optional()
        .describe('Whether to include detailed step logs in the response'),
    }),
    examples: {
      request: { run_id: 'run_20260820_01', include_logs: true },
      response: {
        id: 'run_20260820_01',
        status: 'completed',
        steps: [
          { step_number: 1, name: 'Local Initialization', status: 'completed' },
          { step_number: 2, name: 'Agent Action Execution', status: 'completed' },
        ],
      },
    },
  })
  @Widget('run-status')
  @UseGuards(OAuthGuard)
  async getRunStatus(
    input: { run_id: string; include_logs?: boolean },
    _ctx: ExecutionContext
  ) {
    const run = await this.nimroboClient.getRunStatus(
      input.run_id,
      input.include_logs !== false
    );
    return {
      success: true,
      run,
    };
  }
}
