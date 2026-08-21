import { McpApp, Module, ConfigModule, OAuthModule } from '@nitrostack/core';
import { NimroboModule } from './modules/nimrobo/nimrobo.module.js';
import { SystemHealthCheck } from './health/system.health.js';
import { nimroboConfig } from './config/nimrobo.config.js';

/**
 * Root Application Module for Nimrobo MCP Server
 * 
 * Implements:
 * - Phase 1: Nimrobo Outcome Analytics & User Profile
 * - Phase 2: Local Mac Outcome Run Dispatcher
 * - OAuth 2.0 PKCE / Bearer Authentication compliant with Nimrobo specification
 */
@McpApp({
  module: AppModule,
  server: {
    name: 'nimrobo-mcp-server',
    version: '1.0.0',
  },
  logging: {
    level: 'info',
  },
})
@Module({
  name: 'app',
  description: 'Nimrobo MCP Server - Outcome Analytics & Local Outcome Run Dispatcher',
  imports: [
    ConfigModule.forRoot(),

    // OAuth 2.1 authentication configuration sourced from validated nimroboConfig
    OAuthModule.forRoot({
      // Set OAUTH_REQUIRED=true in production to enforce auth fail-closed
      required: nimroboConfig.oauthRequired,

      // Resource URI (Public identity of the MCP server or cloud API)
      resourceUri: nimroboConfig.resourceUri,

      // Nimrobo Authorization Server
      authorizationServers: [
        nimroboConfig.authServerUrl,
      ],

      // Allowed scopes (spec allows user:read for nitrostack_mcp client)
      scopesSupported: [
        nimroboConfig.scope,
      ],

      // Token Introspection endpoint (if validating opaque tokens via OAuth server)
      tokenIntrospectionEndpoint: nimroboConfig.introspectionEndpoint,
      tokenIntrospectionClientId: nimroboConfig.clientId,
      tokenIntrospectionClientSecret: nimroboConfig.introspectionClientSecret,

      audience: nimroboConfig.tokenAudience,
      issuer: nimroboConfig.tokenIssuer || nimroboConfig.authServerUrl,

      customValidation: async (_tokenPayload) => {
        return true;
      },
    }),

    NimroboModule,
  ],
  providers: [
    SystemHealthCheck,
  ],
})
export class AppModule {}
