import { Injectable } from '@nitrostack/core';
import axios, { AxiosInstance } from 'axios';
import { nimroboConfig, NimroboConfig } from '../config/nimrobo.config.js';
import { OAuthService } from './oauth.service.js';
import {
  DispatchRunInput,
  Outcome,
  OutcomeAnalytics,
  OutcomeRun,
  UserProfile,
  UserProfileSchema,
  OutcomeSchema,
  OutcomeAnalyticsSchema,
  OutcomeRunSchema,
} from '../modules/nimrobo/dto/index.js';
import {
  mockUserProfile,
  mockOutcomes,
  mockOutcomeAnalytics,
  mockOutcomeRuns,
} from '../modules/nimrobo/mocks/mock-data.js';

@Injectable({ deps: [OAuthService] })
export class NimroboClientService {
  private config: NimroboConfig;
  private http: AxiosInstance;

  constructor(private oauthService: OAuthService) {
    this.config = nimroboConfig;
    this.http = axios.create({
      baseURL: this.config.apiBaseUrl,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    // Request interceptor to inject Bearer token
    this.http.interceptors.request.use((req) => {
      const token = this.oauthService.getAccessToken() || this.config.accessToken;
      if (token) {
        req.headers.Authorization = `Bearer ${token}`;
      }
      return req;
    });
  }

  /**
   * Fetch authenticated user profile (GET /api/v1/user/profile)
   */
  async getUserProfile(): Promise<UserProfile> {
    if (this.config.isMockMode && !this.oauthService.getAccessToken() && !this.config.accessToken) {
      return mockUserProfile;
    }

    try {
      const response = await this.http.get('/api/v1/user/profile');
      return UserProfileSchema.parse(response.data);
    } catch (error: any) {
      if (this.config.isMockMode) {
        return mockUserProfile;
      }
      this.handleHttpError(error, 'Failed to fetch user profile');
    }
  }

  /**
   * List available outcomes and metadata (GET /api/v1/outcomes)
   */
  async getOutcomes(filter?: { status?: string; tag?: string; limit?: number }): Promise<Outcome[]> {
    if (this.config.isMockMode && !this.oauthService.getAccessToken() && !this.config.accessToken) {
      let result = [...mockOutcomes];
      if (filter?.status) {
        result = result.filter((o) => o.status === filter.status);
      }
      if (filter?.tag) {
        result = result.filter((o) => o.tags.includes(filter.tag!));
      }
      if (filter?.limit) {
        result = result.slice(0, filter.limit);
      }
      return result;
    }

    try {
      const response = await this.http.get('/api/v1/outcomes', {
        params: filter,
      });
      const data = Array.isArray(response.data) ? response.data : response.data.outcomes || [];
      return data.map((item: any) => OutcomeSchema.parse(item));
    } catch (error: any) {
      if (this.config.isMockMode) {
        return mockOutcomes;
      }
      this.handleHttpError(error, 'Failed to fetch outcomes');
    }
  }

  /**
   * Retrieve outcome metrics and analytics (GET /api/v1/outcomes/:id/analytics)
   */
  async getOutcomeAnalytics(
    outcomeId: string,
    timeRange: string = '30d',
    metrics?: string[]
  ): Promise<OutcomeAnalytics> {
    if (this.config.isMockMode && !this.oauthService.getAccessToken() && !this.config.accessToken) {
      const mock = mockOutcomeAnalytics[outcomeId] || {
        outcome_id: outcomeId,
        outcome_name: `Outcome (${outcomeId})`,
        time_range: timeRange as any,
        summary: {
          baseline: 10.0,
          current: 13.5,
          absolute_change: 3.5,
          relative_lift_percent: 35.0,
          is_statistically_significant: true,
          confidence_level: 95.0,
          total_runs: 5,
          successful_runs: 4,
        },
        timeline: [
          { date: '2026-08-01', value: 10.0, sample_size: 500 },
          { date: '2026-08-15', value: 13.5, sample_size: 650 },
        ],
      };
      return mock;
    }

    try {
      const response = await this.http.get(`/api/v1/outcomes/${outcomeId}/analytics`, {
        params: {
          time_range: timeRange,
          metrics: metrics?.join(','),
        },
      });
      return OutcomeAnalyticsSchema.parse(response.data);
    } catch (error: any) {
      if (this.config.isMockMode) {
        return mockOutcomeAnalytics[outcomeId] || mockOutcomeAnalytics['out_checkout_conversion'];
      }
      this.handleHttpError(error, `Failed to fetch analytics for outcome: ${outcomeId}`);
    }
  }

  /**
   * Retrieve historical runs and results (GET /api/v1/outcomes/:id/runs or GET /api/v1/runs)
   */
  async getOutcomeRuns(filter?: { outcome_id?: string; status?: string; limit?: number }): Promise<OutcomeRun[]> {
    if (this.config.isMockMode && !this.oauthService.getAccessToken() && !this.config.accessToken) {
      let runs = [...mockOutcomeRuns];
      if (filter?.outcome_id) {
        runs = runs.filter((r) => r.outcome_id === filter.outcome_id);
      }
      if (filter?.status) {
        runs = runs.filter((r) => r.status === filter.status);
      }
      if (filter?.limit) {
        runs = runs.slice(0, filter.limit);
      }
      return runs;
    }

    try {
      const endpoint = filter?.outcome_id
        ? `/api/v1/outcomes/${filter.outcome_id}/runs`
        : '/api/v1/runs';

      const response = await this.http.get(endpoint, {
        params: {
          status: filter?.status,
          limit: filter?.limit,
        },
      });

      const data = Array.isArray(response.data) ? response.data : response.data.runs || [];
      return data.map((item: any) => OutcomeRunSchema.parse(item));
    } catch (error: any) {
      if (this.config.isMockMode) {
        return mockOutcomeRuns;
      }
      this.handleHttpError(error, 'Failed to fetch outcome runs');
    }
  }

  /**
   * Check status and logs for a specific run (GET /api/v1/runs/:id)
   */
  async getRunStatus(runId: string, includeLogs: boolean = true): Promise<OutcomeRun> {
    if (this.config.isMockMode && !this.oauthService.getAccessToken() && !this.config.accessToken) {
      const found = mockOutcomeRuns.find((r) => r.id === runId);
      if (found) {
        if (!includeLogs) {
          return {
            ...found,
            steps: found.steps.map((s) => ({ ...s, logs: [] })),
          };
        }
        return found;
      }

      // Generate a mock response for custom run IDs in mock mode
      return {
        id: runId,
        outcome_id: 'out_checkout_conversion',
        status: 'running',
        target_environment: 'local_mac',
        parameters: {},
        actions_executed: ['Local execution in progress'],
        started_at: new Date().toISOString(),
        steps: [
          {
            step_number: 1,
            name: 'Local Bridge Initialization',
            status: 'completed',
            logs: includeLogs ? ['Connected to local Mac execution daemon'] : [],
          },
        ],
      };
    }

    try {
      const response = await this.http.get(`/api/v1/runs/${runId}`, {
        params: { include_logs: includeLogs },
      });
      return OutcomeRunSchema.parse(response.data);
    } catch (error: any) {
      if (this.config.isMockMode) {
        const found = mockOutcomeRuns.find((r) => r.id === runId);
        if (found) return found;
      }
      this.handleHttpError(error, `Failed to fetch status for run: ${runId}`);
    }
  }

  /**
   * Dispatch a new Outcome Run (POST /api/v1/runs/dispatch)
   */
  async dispatchOutcomeRun(input: DispatchRunInput): Promise<OutcomeRun> {
    if (this.config.isMockMode && !this.oauthService.getAccessToken() && !this.config.accessToken) {
      const newRunId = `run_${Date.now()}_local`;
      const dispatchedRun: OutcomeRun = {
        id: newRunId,
        outcome_id: input.outcome_id,
        status: input.dry_run ? 'completed' : 'running',
        target_environment: input.target_environment || 'local_mac',
        parameters: input.parameters || {},
        hypothesis: input.hypothesis || 'Automated experiment dispatched via MCP client',
        actions_executed: input.dry_run
          ? ['Dry run validated parameters successfully']
          : ['Dispatched to local Mac daemon execution bridge', 'Experiment agent started'],
        started_at: new Date().toISOString(),
        steps: [
          {
            step_number: 1,
            name: 'Local Bridge Dispatch',
            status: 'completed',
            started_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
            logs: [
              `Target Environment: ${input.target_environment || 'local_mac'}`,
              `Dry Run: ${input.dry_run}`,
              'Run spawned successfully.',
            ],
          },
        ],
      };
      return dispatchedRun;
    }

    try {
      const response = await this.http.post('/api/v1/runs/dispatch', input);
      return OutcomeRunSchema.parse(response.data);
    } catch (error: any) {
      if (this.config.isMockMode) {
        return {
          id: `run_${Date.now()}_fallback`,
          outcome_id: input.outcome_id,
          status: 'running',
          target_environment: input.target_environment,
          parameters: input.parameters || {},
          started_at: new Date().toISOString(),
          actions_executed: ['Dispatched successfully (offline fallback)'],
          steps: [],
        };
      }
      this.handleHttpError(error, `Failed to dispatch outcome run for outcome: ${input.outcome_id}`);
    }
  }

  private handleHttpError(error: any, contextMsg: string): never {
    const status = error.response?.status;
    const details = error.response?.data?.message || error.response?.data?.error || error.message;

    if (status === 401) {
      throw new Error(
        `${contextMsg}: Unauthorized (401). Please check your Bearer token or re-run the OAuth authorization flow.`
      );
    }
    if (status === 403) {
      throw new Error(
        `${contextMsg}: Forbidden (403). Insufficient permissions or scope. Required scope: ${this.config.scope}.`
      );
    }
    if (status === 404) {
      throw new Error(`${contextMsg}: Resource not found (404). Details: ${details}`);
    }

    throw new Error(`${contextMsg}: ${details} (HTTP ${status || 'Network Error'})`);
  }
}
