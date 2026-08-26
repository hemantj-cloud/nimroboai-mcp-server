import { describe, it, expect } from 'vitest';
import { loadConfig } from '../src/config/nimrobo.config.js';

describe('Config Loader & Fail-Fast Validation', () => {
  const validOAuthEnv: NodeJS.ProcessEnv = {
    OAUTH_REQUIRED: 'true',
    RESOURCE_URI: 'https://awli-smartdocs-6a46596f-awlis-org-f974e39c.dev.nitrocloud.ai/mcp',
    AUTH_SERVER_URL: 'https://dev-a5xfe584t2l5t0nr.us.auth0.com',
    JWKS_URI: 'https://dev-a5xfe584t2l5t0nr.us.auth0.com/.well-known/jwks.json',
    TOKEN_AUDIENCE: 'https://awli-smartdocs-6a46596f-awlis-org-f974e39c.dev.nitrocloud.ai/mcp',
    TOKEN_ISSUER: 'https://dev-a5xfe584t2l5t0nr.us.auth0.com/',
    OAUTH_ENABLE_CLIENT_REGISTRATION: 'true',
    OAUTH_CLIENT_ID: 'eyeIVVGNW7xwIRk1GO0hjjl1B9iVUOAM',
    OAUTH_CLIENT_SECRET: 'zfBugZK8zr2EGlxbNUE4BMnKNki14cwZSh-cwol3Z-LsY2odu-FTX8R-5YmkestX',
  };

  it('should successfully load and validate OAuth 2.1 environment configuration', () => {
    const config = loadConfig(validOAuthEnv);
    expect(config.resourceUri).toBe('https://awli-smartdocs-6a46596f-awlis-org-f974e39c.dev.nitrocloud.ai/mcp');
    expect(config.authServerUrl).toBe('https://dev-a5xfe584t2l5t0nr.us.auth0.com');
    expect(config.jwksUri).toBe('https://dev-a5xfe584t2l5t0nr.us.auth0.com/.well-known/jwks.json');
    expect(config.tokenAudience).toBe('https://awli-smartdocs-6a46596f-awlis-org-f974e39c.dev.nitrocloud.ai/mcp');
    expect(config.tokenIssuer).toBe('https://dev-a5xfe584t2l5t0nr.us.auth0.com/');
    expect(config.oauthRequired).toBe(true);
    expect(config.oauthEnableClientRegistration).toBe(true);
    expect(config.oauthClientId).toBe('eyeIVVGNW7xwIRk1GO0hjjl1B9iVUOAM');
    expect(config.oauthClientSecret).toBe('zfBugZK8zr2EGlxbNUE4BMnKNki14cwZSh-cwol3Z-LsY2odu-FTX8R-5YmkestX');
    expect(config.clientId).toBe('eyeIVVGNW7xwIRk1GO0hjjl1B9iVUOAM');
  });

  it('should apply fallback defaults when optional nimrobo settings are omitted', () => {
    const config = loadConfig(validOAuthEnv);
    expect(config.apiBaseUrl).toBe('https://app.nimroboai.com');
    expect(config.redirectUri).toBe('https://mcp.nitrostack.dev/oauth/callback');
    expect(config.scope).toBe('user:read');
    expect(config.isMockMode).toBe(true);
  });

  it('should fail fast if RESOURCE_URI is missing', () => {
    const invalidEnv = { ...validOAuthEnv };
    delete invalidEnv.RESOURCE_URI;

    expect(() => loadConfig(invalidEnv)).toThrow(/RESOURCE_URI is required/);
  });

  it('should fail fast if AUTH_SERVER_URL is missing', () => {
    const invalidEnv = { ...validOAuthEnv };
    delete invalidEnv.AUTH_SERVER_URL;

    expect(() => loadConfig(invalidEnv)).toThrow(/AUTH_SERVER_URL is required/);
  });

  it('should fail fast if URL is not a valid URL format', () => {
    const invalidEnv = {
      ...validOAuthEnv,
      JWKS_URI: 'not-a-valid-url',
    };

    expect(() => loadConfig(invalidEnv)).toThrow(/JWKS_URI must be a valid URL/);
  });
});
