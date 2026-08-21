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
export class OutcomeDispatcherTools {
  constructor(private nimroboClient: NimroboClientService) {}

  @Tool({
    name: 'dispatch_outcome_run',
    description:
      'Dispatches a new outcome experiment run to execute locally on the user Mac (via local bridge/daemon) or cloud environment.',
    inputSchema: z.object({
      outcome_id: z
        .string()
        .describe('The unique identifier of the target outcome (e.g. out_checkout_conversion)'),
      hypothesis: z
        .string()
        .optional()
        .describe('Specific hypothesis, optimization idea, or test plan for this run'),
      parameters: z
        .record(z.any())
        .optional()
        .describe('Key-value parameters/configuration to pass to the execution agent'),
      target_environment: z
        .enum(['local_mac', 'cloud'])
        .default('local_mac')
        .optional()
        .describe('Execution environment: "local_mac" (default, executes on user Mac) or "cloud"'),
      dry_run: z
        .boolean()
        .default(false)
        .optional()
        .describe('Simulate the run validation and checks without executing real modifications'),
    }),
    examples: {
      request: {
        outcome_id: 'out_checkout_conversion',
        hypothesis: 'Optimize button hierarchy to improve checkout completion',
        parameters: { variant: 'prominent_cta', animation: true },
        target_environment: 'local_mac',
        dry_run: false,
      },
      response: {
        success: true,
        run: {
          id: 'run_20260821_123456',
          outcome_id: 'out_checkout_conversion',
          status: 'running',
          target_environment: 'local_mac',
        },
      },
    },
  })
  @Widget('dispatch-result')
  @UseGuards(OAuthGuard)
  async dispatchOutcomeRun(
    input: {
      outcome_id: string;
      hypothesis?: string;
      parameters?: Record<string, any>;
      target_environment?: 'local_mac' | 'cloud';
      dry_run?: boolean;
    },
    _ctx: ExecutionContext
  ) {
    const run = await this.nimroboClient.dispatchOutcomeRun({
      outcome_id: input.outcome_id,
      hypothesis: input.hypothesis,
      parameters: input.parameters,
      target_environment: input.target_environment || 'local_mac',
      dry_run: input.dry_run || false,
    });

    return {
      success: true,
      message: input.dry_run
        ? 'Outcome run dry run completed successfully'
        : `Outcome run dispatched successfully to ${input.target_environment || 'local_mac'}`,
      run,
    };
  }
}
