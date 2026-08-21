import { describe, it, expect, beforeEach } from 'vitest';
import { OAuthService } from '../src/services/oauth.service.js';
import { NimroboClientService } from '../src/services/nimrobo-client.service.js';
import { OutcomeAnalyticsTools } from '../src/modules/nimrobo/outcome-analytics.tools.js';
import { OutcomeDispatcherTools } from '../src/modules/nimrobo/outcome-dispatcher.tools.js';
import { NimroboPrompts } from '../src/modules/nimrobo/nimrobo.prompts.js';
import { NimroboResources } from '../src/modules/nimrobo/nimrobo.resources.js';

describe('NitroStack MCP Tools & Capabilities', () => {
  let oauthService: OAuthService;
  let clientService: NimroboClientService;
  let analyticsTools: OutcomeAnalyticsTools;
  let dispatcherTools: OutcomeDispatcherTools;
  let prompts: NimroboPrompts;
  let resources: NimroboResources;

  const mockCtx: any = {
    auth: {
      subject: 'usr_test',
      scopes: ['user:read'],
    },
  };

  beforeEach(() => {
    oauthService = new OAuthService();
    clientService = new NimroboClientService(oauthService);
    analyticsTools = new OutcomeAnalyticsTools(clientService);
    dispatcherTools = new OutcomeDispatcherTools(clientService);
    prompts = new NimroboPrompts(clientService);
    resources = new NimroboResources(clientService);
  });

  describe('OAuthService', () => {
    it('should generate valid authorization URL matching specs', () => {
      const { authorizationUrl, pkce } = oauthService.getAuthorizationUrl();
      expect(authorizationUrl).toContain('https://app.nimroboai.com/oauth/authorize');
      expect(authorizationUrl).toContain('client_id=nitrostack_mcp');
      expect(authorizationUrl).toContain('response_type=code');
      expect(authorizationUrl).toContain('scope=user%3Aread');
      expect(authorizationUrl).toContain('code_challenge_method=S256');
      expect(authorizationUrl).toContain(`code_challenge=${encodeURIComponent(pkce.codeChallenge)}`);
    });

    it('should exchange code for token in mock mode', async () => {
      const { pkce } = oauthService.getAuthorizationUrl();
      const token = await oauthService.exchangeCodeForToken({
        code: 'auth_code_12345',
        codeVerifier: pkce.codeVerifier,
      });

      expect(token.access_token).toBeDefined();
      expect(token.token_type).toBe('Bearer');
      expect(oauthService.getAccessToken()).toBe(token.access_token);
      expect(oauthService.isTokenExpired()).toBe(false);
    });
  });

  describe('OutcomeAnalyticsTools', () => {
    it('should execute get_user_profile tool', async () => {
      const res = await analyticsTools.getUserProfile({}, mockCtx);
      expect(res.success).toBe(true);
      expect(res.data.id).toBe('usr_nimrobo_pilot_01');
    });

    it('should execute get_outcomes tool', async () => {
      const res = await analyticsTools.getOutcomes({ status: 'active' }, mockCtx);
      expect(res.success).toBe(true);
      expect(res.count).toBeGreaterThan(0);
      expect(res.outcomes[0].id).toBeDefined();
    });

    it('should execute get_outcome_analytics tool', async () => {
      const res = await analyticsTools.getOutcomeAnalytics(
        { outcome_id: 'out_checkout_conversion', time_range: '30d' },
        mockCtx
      );
      expect(res.success).toBe(true);
      expect(res.analytics.summary.baseline).toBeDefined();
    });

    it('should execute get_outcome_runs tool', async () => {
      const res = await analyticsTools.getOutcomeRuns({ limit: 5 }, mockCtx);
      expect(res.success).toBe(true);
      expect(res.runs.length).toBeGreaterThan(0);
    });

    it('should execute get_run_status tool', async () => {
      const res = await analyticsTools.getRunStatus({ run_id: 'run_20260820_01', include_logs: true }, mockCtx);
      expect(res.success).toBe(true);
      expect(res.run.id).toBe('run_20260820_01');
      expect(res.run.steps.length).toBeGreaterThan(0);
    });
  });

  describe('OutcomeDispatcherTools', () => {
    it('should dispatch an outcome run via tool', async () => {
      const res = await dispatcherTools.dispatchOutcomeRun(
        {
          outcome_id: 'out_checkout_conversion',
          hypothesis: 'Test hypothesis',
          target_environment: 'local_mac',
        },
        mockCtx
      );
      expect(res.success).toBe(true);
      expect(res.run.id).toBeDefined();
      expect(res.run.target_environment).toBe('local_mac');
    });
  });

  describe('Prompts and Resources', () => {
    it('should generate analyze_outcome_performance prompt', async () => {
      const prompt = await prompts.analyzeOutcomePerformance(
        { outcome_id: 'out_checkout_conversion' },
        mockCtx
      );
      expect(prompt.messages[0].content.text).toContain('Checkout Funnel Conversion Rate');
    });

    it('should generate plan_outcome_experiment prompt', async () => {
      const prompt = await prompts.planOutcomeExperiment(
        { outcome_id: 'out_checkout_conversion', optimization_goal: 'Reduce step 2 dropoff' },
        mockCtx
      );
      expect(prompt.messages[0].content.text).toContain('Hypothesis formulation');
    });

    it('should return outcomes catalog resource', async () => {
      const catalog = await resources.getOutcomesCatalog(mockCtx);
      expect(catalog.contents[0].uri).toBe('nimrobo://outcomes/catalog');
      expect(catalog.contents[0].mimeType).toBe('application/json');
    });
  });
});
