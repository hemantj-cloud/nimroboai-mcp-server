import { describe, it, expect, beforeEach } from 'vitest';
import { OAuthService } from '../src/services/oauth.service.js';
import { NimroboClientService } from '../src/services/nimrobo-client.service.js';

describe('NimroboClientService (Mock Mode)', () => {
  let oauthService: OAuthService;
  let clientService: NimroboClientService;

  beforeEach(() => {
    oauthService = new OAuthService();
    clientService = new NimroboClientService(oauthService);
  });

  it('should fetch user profile', async () => {
    const profile = await clientService.getUserProfile();
    expect(profile).toBeDefined();
    expect(profile.id).toBe('usr_nimrobo_pilot_01');
    expect(profile.email).toContain('@nimroboai.com');
  });

  it('should fetch all outcomes', async () => {
    const outcomes = await clientService.getOutcomes();
    expect(outcomes.length).toBeGreaterThan(0);
    expect(outcomes[0].id).toBe('out_checkout_conversion');
  });

  it('should filter outcomes by status and limit', async () => {
    const activeOutcomes = await clientService.getOutcomes({ status: 'active' });
    expect(activeOutcomes.every((o) => o.status === 'active')).toBe(true);

    const limited = await clientService.getOutcomes({ limit: 1 });
    expect(limited.length).toBe(1);
  });

  it('should fetch outcome analytics for an outcome ID', async () => {
    const analytics = await clientService.getOutcomeAnalytics('out_checkout_conversion', '30d');
    expect(analytics.outcome_id).toBe('out_checkout_conversion');
    expect(analytics.summary.relative_lift_percent).toBeGreaterThan(0);
    expect(analytics.timeline.length).toBeGreaterThan(0);
  });

  it('should fetch outcome runs and filter by outcome_id', async () => {
    const runs = await clientService.getOutcomeRuns({ outcome_id: 'out_checkout_conversion' });
    expect(runs.length).toBeGreaterThan(0);
    expect(runs.every((r) => r.outcome_id === 'out_checkout_conversion')).toBe(true);
  });

  it('should fetch run status for an existing run ID', async () => {
    const run = await clientService.getRunStatus('run_20260820_01', true);
    expect(run.id).toBe('run_20260820_01');
    expect(run.status).toBe('completed');
    expect(run.steps.length).toBeGreaterThan(0);
  });

  it('should dispatch an outcome run with local_mac environment', async () => {
    const dispatched = await clientService.dispatchOutcomeRun({
      outcome_id: 'out_checkout_conversion',
      hypothesis: 'Test hypothesis from vitest',
      target_environment: 'local_mac',
      dry_run: false,
    });

    expect(dispatched.id).toBeDefined();
    expect(dispatched.outcome_id).toBe('out_checkout_conversion');
    expect(dispatched.target_environment).toBe('local_mac');
    expect(dispatched.status).toBe('running');
  });

  it('should handle dry_run dispatch', async () => {
    const dispatched = await clientService.dispatchOutcomeRun({
      outcome_id: 'out_checkout_conversion',
      hypothesis: 'Dry run test',
      dry_run: true,
    });

    expect(dispatched.status).toBe('completed');
  });
});
