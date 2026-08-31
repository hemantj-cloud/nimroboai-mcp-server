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
 * - OAuth 2.1 PKCE / Bearer Authentication & JWKS verification
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

    // Conditionally load OAuth 2.1 authentication only when OAUTH_REQUIRED=true
    ...(nimroboConfig.oauthRequired
      ? [
          OAuthModule.forRoot({
            required: true,
            resourceUri: nimroboConfig.resourceUri,
            authorizationServers: [nimroboConfig.authServerUrl],
            scopesSupported: [nimroboConfig.scope],
            jwksUri: nimroboConfig.jwksUri,
            enableClientRegistration: nimroboConfig.oauthEnableClientRegistration,
            staticClientId: nimroboConfig.oauthClientId,
            staticClientSecret: nimroboConfig.oauthClientSecret,
            tokenIntrospectionEndpoint: nimroboConfig.introspectionEndpoint,
            tokenIntrospectionClientId: nimroboConfig.oauthClientId || nimroboConfig.clientId,
            tokenIntrospectionClientSecret: nimroboConfig.introspectionClientSecret,
            audience: nimroboConfig.tokenAudience,
            issuer: nimroboConfig.tokenIssuer || nimroboConfig.authServerUrl,
            customValidation: async (_tokenPayload) => {
              return true;
            },
          }),
        ]
      : []),

    NimroboModule,
  ],
  providers: [
    SystemHealthCheck,
  ],
})
export class AppModule {}
