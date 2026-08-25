import 'dotenv/config';
import { z } from 'zod';

/**
 * Strict Environment Variable Validation Schema
 * Enforces fail-fast startup if any required environment variable is missing or malformed.
 */
const EnvSchema = z.object({
  // =============================================================================
  // Server & OAuth 2.1 Configuration
  // =============================================================================
  RESOURCE_URI: z
    .string({ required_error: 'RESOURCE_URI is required' })
    .url('RESOURCE_URI must be a valid URL (e.g. https://awli-smartdocs-6a46596f-awlis-org-f974e39c.dev.nitrocloud.ai/mcp)'),
  AUTH_SERVER_URL: z
    .string({ required_error: 'AUTH_SERVER_URL is required' })
    .url('AUTH_SERVER_URL must be a valid URL (e.g. https://dev-a5xfe584t2l5t0nr.us.auth0.com)'),
  OAUTH_REQUIRED: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => val === 'true'),
  JWKS_URI: z
    .string()
    .url('JWKS_URI must be a valid URL')
    .optional(),
  TOKEN_AUDIENCE: z.string().optional(),
  TOKEN_ISSUER: z.string().optional(),

  // Dynamic Client Registration & OAuth Credentials
  OAUTH_ENABLE_CLIENT_REGISTRATION: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => val === 'true'),
  OAUTH_CLIENT_ID: z.string().optional(),
  OAUTH_CLIENT_SECRET: z.string().optional(),

  // Token Introspection (Optional)
  INTROSPECTION_ENDPOINT: z.string().optional(),
  INTROSPECTION_CLIENT_SECRET: z.string().optional(),

  // =============================================================================
  // Nimrobo API Integration Settings (with defaults for standalone OAuth execution)
  // =============================================================================
  NIMROBO_API_BASE_URL: z
    .string()
    .url('NIMROBO_API_BASE_URL must be a valid URL')
    .optional()
    .default('https://app.nimroboai.com'),
  NIMROBO_CLIENT_ID: z.string().optional(),
  NIMROBO_AUTH_URL: z
    .string()
    .url('NIMROBO_AUTH_URL must be a valid URL')
    .optional(),
  NIMROBO_TOKEN_URL: z
    .string()
    .url('NIMROBO_TOKEN_URL must be a valid URL')
    .optional(),
  NIMROBO_REDIRECT_URI: z
    .string()
    .url('NIMROBO_REDIRECT_URI must be a valid URL')
    .optional()
    .default('https://mcp.nitrostack.dev/oauth/callback'),
  NIMROBO_SCOPE: z.string().optional().default('user:read'),
  NIMROBO_ACCESS_TOKEN: z.string().optional(),
  NIMROBO_MOCK_MODE: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => val !== 'false'),
});

export type ValidatedEnv = z.infer<typeof EnvSchema>;

export interface NimroboConfig {
  // OAuth 2.1 & Server Settings
  resourceUri: string;
  authServerUrl: string;
  oauthRequired: boolean;
  jwksUri?: string;
  tokenAudience: string;
  tokenIssuer?: string;
  oauthEnableClientRegistration: boolean;
  oauthClientId?: string;
  oauthClientSecret?: string;
  introspectionEndpoint?: string;
  introspectionClientSecret?: string;

  // Nimrobo API Settings
  apiBaseUrl: string;
  clientId: string;
  authUrl: string;
  tokenUrl: string;
  redirectUri: string;
  scope: string;
  codeChallengeMethod: 'S256';
  tokenLifetimeDays: number;
  accessToken?: string;
  isMockMode: boolean;
}

/**
 * Loads, validates, and freezes application configuration with fail-fast enforcement.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): NimroboConfig {
  const result = EnvSchema.safeParse(env);

  if (!result.success) {
    const errorDetails = result.error.errors
      .map((err) => `  - [${err.path.join('.')}]: ${err.message}`)
      .join('\n');

    const errorMessage = `\n❌ FATAL: Nimrobo MCP Server environment configuration error (Fail-Fast):\n${errorDetails}\n\n👉 Please configure all required environment variables in your .env file or deployment environment.\n`;

    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  const parsed = result.data;
  const clientId = parsed.NIMROBO_CLIENT_ID || parsed.OAUTH_CLIENT_ID || 'nitrostack_mcp';
  const authUrl = parsed.NIMROBO_AUTH_URL || `${parsed.AUTH_SERVER_URL}/oauth/authorize`;
  const tokenUrl = parsed.NIMROBO_TOKEN_URL || `${parsed.AUTH_SERVER_URL}/oauth/token`;
  const clientSecret = parsed.OAUTH_CLIENT_SECRET || parsed.INTROSPECTION_CLIENT_SECRET;

  return Object.freeze({
    resourceUri: parsed.RESOURCE_URI,
    authServerUrl: parsed.AUTH_SERVER_URL,
    oauthRequired: parsed.OAUTH_REQUIRED ?? false,
    jwksUri: parsed.JWKS_URI,
    tokenAudience: parsed.TOKEN_AUDIENCE || parsed.RESOURCE_URI,
    tokenIssuer: parsed.TOKEN_ISSUER || (parsed.AUTH_SERVER_URL ? `${parsed.AUTH_SERVER_URL}/` : undefined),
    oauthEnableClientRegistration: parsed.OAUTH_ENABLE_CLIENT_REGISTRATION ?? false,
    oauthClientId: parsed.OAUTH_CLIENT_ID,
    oauthClientSecret: clientSecret,
    introspectionEndpoint: parsed.INTROSPECTION_ENDPOINT,
    introspectionClientSecret: clientSecret,

    apiBaseUrl: parsed.NIMROBO_API_BASE_URL,
    clientId,
    authUrl,
    tokenUrl,
    redirectUri: parsed.NIMROBO_REDIRECT_URI,
    scope: parsed.NIMROBO_SCOPE,
    codeChallengeMethod: 'S256' as const,
    tokenLifetimeDays: 30,
    accessToken: parsed.NIMROBO_ACCESS_TOKEN || undefined,
    isMockMode: parsed.NIMROBO_MOCK_MODE ?? true,
  });
}

export const nimroboConfig: NimroboConfig = loadConfig();
