import { describe, it, expect } from 'vitest';
import { loadConfig } from '../src/config/nimrobo.config.js';

describe('Config Loader & Fail-Fast Validation', () => {
  const validMockEnv: NodeJS.ProcessEnv = {
    NIMROBO_API_BASE_URL: 'https://app.nimroboai.com',
    NIMROBO_CLIENT_ID: 'nitrostack_mcp',
    NIMROBO_AUTH_URL: 'https://app.nimroboai.com/oauth/authorize',
    NIMROBO_TOKEN_URL: 'https://app.nimroboai.com/api/oauth/token',
    NIMROBO_REDIRECT_URI: 'https://mcp.nitrostack.dev/oauth/callback',
    NIMROBO_SCOPE: 'user:read',
    NIMROBO_MOCK_MODE: 'true',
    OAUTH_REQUIRED: 'false',
    RESOURCE_URI: 'https://app.nimroboai.com',
    AUTH_SERVER_URL: 'https://app.nimroboai.com',
  };

  it('should successfully load and validate valid environment configuration', () => {
    const config = loadConfig(validMockEnv);
    expect(config.apiBaseUrl).toBe('https://app.nimroboai.com');
    expect(config.clientId).toBe('nitrostack_mcp');
    expect(config.scope).toBe('user:read');
    expect(config.isMockMode).toBe(true);
    expect(config.oauthRequired).toBe(false);
  });

  it('should fail fast if NIMROBO_API_BASE_URL is missing', () => {
    const invalidEnv = { ...validMockEnv };
    delete invalidEnv.NIMROBO_API_BASE_URL;

    expect(() => loadConfig(invalidEnv)).toThrow(/NIMROBO_API_BASE_URL is required/);
  });

  it('should fail fast if NIMROBO_CLIENT_ID is missing', () => {
    const invalidEnv = { ...validMockEnv };
    delete invalidEnv.NIMROBO_CLIENT_ID;

    expect(() => loadConfig(invalidEnv)).toThrow(/NIMROBO_CLIENT_ID is required/);
  });

  it('should fail fast if URL is not a valid URL format', () => {
    const invalidEnv = {
      ...validMockEnv,
      NIMROBO_AUTH_URL: 'not-a-valid-url',
    };

    expect(() => loadConfig(invalidEnv)).toThrow(/NIMROBO_AUTH_URL must be a valid URL/);
  });

  it('should fail fast if RESOURCE_URI or AUTH_SERVER_URL is missing', () => {
    const invalidEnv = { ...validMockEnv };
    delete invalidEnv.RESOURCE_URI;

    expect(() => loadConfig(invalidEnv)).toThrow(/RESOURCE_URI is required/);
  });
});
