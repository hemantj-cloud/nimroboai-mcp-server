import { describe, it, expect, beforeEach } from 'vitest';
import { OAuthModule } from '@nitrostack/core';
import { OAuthGuard, createScopeGuard } from '../src/guards/oauth.guard.js';

describe('OAuth Enforcement & ScopeGuard Integration Tests', () => {
  let oauthGuard: OAuthGuard;

  beforeEach(() => {
    oauthGuard = new OAuthGuard();
    (OAuthModule as any).config = null;
  });

  describe('When OAuth is NOT required (OAUTH_REQUIRED=false / Unconfigured)', () => {
    beforeEach(() => {
      // Simulate unconfigured or required=false
      (OAuthModule as any).config = {
        required: false,
        resourceUri: 'https://test.api/mcp',
        authorizationServers: ['https://auth.test.com'],
      };
    });

    it('OAuthGuard should allow request without token', async () => {
      const emptyContext: any = { metadata: {} };
      const result = await oauthGuard.canActivate(emptyContext);
      expect(result).toBe(true);
      expect(emptyContext.auth).toBeUndefined();
    });

    it('OAuthGuard should allow request even with invalid/malformed token', async () => {
      const contextWithInvalidToken: any = {
        metadata: { authorization: 'Bearer invalid_random_token' },
      };
      const result = await oauthGuard.canActivate(contextWithInvalidToken);
      expect(result).toBe(true);
    });

    it('createScopeGuard should allow request without scopes when OAuth is not required', async () => {
      const AdminScopeGuard = createScopeGuard(['admin', 'write']);
      const scopeGuard = new AdminScopeGuard();
      const emptyContext: any = { metadata: {}, auth: undefined };

      const result = await scopeGuard.canActivate(emptyContext);
      expect(result).toBe(true);
    });
  });

  describe('When OAuth is ENFORCED (OAUTH_REQUIRED=true)', () => {
    beforeEach(() => {
      (OAuthModule as any).config = {
        required: true,
        resourceUri: 'https://test.api/mcp',
        authorizationServers: ['https://auth.test.com'],
        audience: 'https://test.api/mcp',
        allowInsecureTokenDecode: true,
      };
    });

    it('OAuthGuard should reject request when no token is provided', async () => {
      const emptyContext: any = { metadata: {} };
      await expect(oauthGuard.canActivate(emptyContext)).rejects.toThrow(
        /OAuth token required/i
      );
    });

    it('createScopeGuard should reject when required scope is missing', async () => {
      const AdminScopeGuard = createScopeGuard(['admin']);
      const scopeGuard = new AdminScopeGuard();
      const contextWithUserScopeOnly: any = {
        auth: {
          subject: 'usr_123',
          scopes: ['read'],
        },
      };

      await expect(scopeGuard.canActivate(contextWithUserScopeOnly)).rejects.toThrow(
        /Insufficient scope/i
      );
    });

    it('createScopeGuard should pass when all required scopes are present', async () => {
      const AdminScopeGuard = createScopeGuard(['admin', 'read']);
      const scopeGuard = new AdminScopeGuard();
      const contextWithAdminScope: any = {
        auth: {
          subject: 'usr_admin',
          scopes: ['admin', 'read', 'write'],
        },
      };

      const result = await scopeGuard.canActivate(contextWithAdminScope);
      expect(result).toBe(true);
    });
  });
});
