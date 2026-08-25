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
      expect(authorizationUrl).toContain('/oauth/authorize');
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

  describe('McpApplicationFactory Tool Registration & Widget Binding', () => {
    it('should discover and register tools when bootstrapping AppModule', async () => {
      const { McpApplicationFactory } = await import('@nitrostack/core');
      const { AppModule } = await import('../src/app.module.js');

      const server: any = await McpApplicationFactory.create(AppModule);
      expect(server).toBeDefined();
      const tools = server.tools instanceof Map ? Array.from(server.tools.values()) : Array.isArray(server.tools) ? server.tools : Object.values(server.tools);
      const registeredToolNames = tools.map((t: any) => t.name || t.definition?.name);
      expect(registeredToolNames).toContain('get_user_profile');
      expect(registeredToolNames).toContain('get_outcomes');
      expect(registeredToolNames).toContain('get_outcome_analytics');
      expect(registeredToolNames).toContain('get_outcome_runs');
      expect(registeredToolNames).toContain('get_run_status');
      expect(registeredToolNames).toContain('dispatch_outcome_run');
      expect(tools.length).toBe(6);
    });

    it('should have @Widget metadata attached to all 6 tools', async () => {
      const { getWidgetMetadata } = await import('@nitrostack/core');
      const { OutcomeAnalyticsTools } = await import('../src/modules/nimrobo/outcome-analytics.tools.js');
      const { OutcomeDispatcherTools } = await import('../src/modules/nimrobo/outcome-dispatcher.tools.js');

      expect(getWidgetMetadata(OutcomeAnalyticsTools.prototype, 'getUserProfile')?.route).toBe('user-profile');
      expect(getWidgetMetadata(OutcomeAnalyticsTools.prototype, 'getOutcomes')?.route).toBe('outcomes-catalog');
      expect(getWidgetMetadata(OutcomeAnalyticsTools.prototype, 'getOutcomeAnalytics')?.route).toBe('outcome-analytics');
      expect(getWidgetMetadata(OutcomeAnalyticsTools.prototype, 'getOutcomeRuns')?.route).toBe('outcome-runs');
      expect(getWidgetMetadata(OutcomeAnalyticsTools.prototype, 'getRunStatus')?.route).toBe('run-status');
      expect(getWidgetMetadata(OutcomeDispatcherTools.prototype, 'dispatchOutcomeRun')?.route).toBe('dispatch-result');
    });

    it('should have all 6 widgets defined in widget-manifest.json', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const manifestPath = path.resolve(__dirname, '../src/widgets/widget-manifest.json');
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

      expect(manifest.widgets).toBeDefined();
      expect(manifest.widgets.length).toBe(6);

      const uris = manifest.widgets.map((w: any) => w.uri);
      expect(uris).toContain('/user-profile');
      expect(uris).toContain('/outcomes-catalog');
      expect(uris).toContain('/outcome-analytics');
      expect(uris).toContain('/outcome-runs');
      expect(uris).toContain('/run-status');
      expect(uris).toContain('/dispatch-result');
    });
  });
});

