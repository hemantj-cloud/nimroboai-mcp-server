#!/usr/bin/env node
/**
 * Nimrobo AI MCP Server
 * 
 * Outcome Analytics & Local Outcome Run Dispatcher
 * Built with NitroStack Framework (@nitrostack/core)
 * 
 * Compliant with:
 * - Model Context Protocol (MCP) specification
 * - Nimrobo OAuth 2.0 PKCE (S256) & Bearer Token Authentication
 */

import 'dotenv/config';
import { McpApplicationFactory } from '@nitrostack/core';
import { AppModule } from './app.module.js';
import { nimroboConfig } from './config/nimrobo.config.js';

async function bootstrap() {
  try {
    console.error('🚀 Starting Nimrobo MCP Server (NitroStack)...');
    console.error(`   Resource URI: ${nimroboConfig.resourceUri}`);
    console.error(`   Auth Server:  ${nimroboConfig.authServerUrl}`);
    console.error(`   Client ID:    ${nimroboConfig.clientId}`);
    console.error(`   Scope:        ${nimroboConfig.scope}`);
    console.error(`   PKCE Method:  ${nimroboConfig.codeChallengeMethod}`);
    console.error(`   Mock Mode:    ${nimroboConfig.isMockMode ? 'ENABLED (Offline/Sandbox)' : 'DISABLED (Live Endpoints)'}`);
    console.error(`   OAuth Guard:  ${nimroboConfig.oauthRequired ? 'ENFORCED (OAUTH_REQUIRED=true)' : 'PERMISSIVE (Dev Mode)'}\n`);

    // Create the MCP application
    const server = await McpApplicationFactory.create(AppModule);

    // Start the server
    await server.start();
    console.error('✅ Nimrobo MCP Server successfully started and ready for MCP client connections.\n');
  } catch (error) {
    console.error('❌ Failed to start Nimrobo MCP Server:', error);
    process.exit(1);
  }
}

// Start application
bootstrap();
