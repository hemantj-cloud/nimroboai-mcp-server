import 'dotenv/config';
import { z } from 'zod';

/**
 * Strict Environment Variable Validation Schema
 * Enforces fail-fast startup if any required environment variable is missing or malformed.
 */
const EnvSchema = z.object({
  NIMROBO_API_BASE_URL: z
    .string({ required_error: 'NIMROBO_API_BASE_URL is required' })
    .url('NIMROBO_API_BASE_URL must be a valid URL (e.g. https://app.nimroboai.com)'),
  NIMROBO_CLIENT_ID: z
    .string({ required_error: 'NIMROBO_CLIENT_ID is required' })
    .min(1, 'NIMROBO_CLIENT_ID cannot be empty (e.g. nitrostack_mcp)'),
  NIMROBO_AUTH_URL: z
    .string({ required_error: 'NIMROBO_AUTH_URL is required' })
    .url('NIMROBO_AUTH_URL must be a valid URL (e.g. https://app.nimroboai.com/oauth/authorize)'),
  NIMROBO_TOKEN_URL: z
    .string({ required_error: 'NIMROBO_TOKEN_URL is required' })
    .url('NIMROBO_TOKEN_URL must be a valid URL (e.g. https://app.nimroboai.com/api/oauth/token)'),
  NIMROBO_REDIRECT_URI: z
    .string({ required_error: 'NIMROBO_REDIRECT_URI is required' })
    .url('NIMROBO_REDIRECT_URI must be a valid URL (e.g. https://mcp.nitrostack.dev/oauth/callback)'),
  NIMROBO_SCOPE: z
    .string({ required_error: 'NIMROBO_SCOPE is required' })
    .min(1, 'NIMROBO_SCOPE cannot be empty (e.g. user:read)'),
  NIMROBO_ACCESS_TOKEN: z.string().optional(),
  NIMROBO_MOCK_MODE: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => val === 'true'),
  OAUTH_REQUIRED: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => val === 'true'),
  RESOURCE_URI: z
    .string({ required_error: 'RESOURCE_URI is required' })
    .url('RESOURCE_URI must be a valid URL (e.g. https://app.nimroboai.com)'),
  AUTH_SERVER_URL: z
    .string({ required_error: 'AUTH_SERVER_URL is required' })
    .url('AUTH_SERVER_URL must be a valid URL (e.g. https://app.nimroboai.com)'),
  TOKEN_ISSUER: z.string().optional(),
  TOKEN_AUDIENCE: z.string().optional(),
  INTROSPECTION_ENDPOINT: z.string().optional(),
  INTROSPECTION_CLIENT_SECRET: z.string().optional(),
});

export type ValidatedEnv = z.infer<typeof EnvSchema>;

export interface NimroboConfig {
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
  oauthRequired: boolean;
  resourceUri: string;
  authServerUrl: string;
  tokenIssuer?: string;
  tokenAudience?: string;
  introspectionEndpoint?: string;
  introspectionClientSecret?: string;
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

  return Object.freeze({
    apiBaseUrl: parsed.NIMROBO_API_BASE_URL,
    clientId: parsed.NIMROBO_CLIENT_ID,
    authUrl: parsed.NIMROBO_AUTH_URL,
    tokenUrl: parsed.NIMROBO_TOKEN_URL,
    redirectUri: parsed.NIMROBO_REDIRECT_URI,
    scope: parsed.NIMROBO_SCOPE,
    codeChallengeMethod: 'S256' as const,
    tokenLifetimeDays: 30,
    accessToken: parsed.NIMROBO_ACCESS_TOKEN || undefined,
    isMockMode: parsed.NIMROBO_MOCK_MODE ?? false,
    oauthRequired: parsed.OAUTH_REQUIRED ?? false,
    resourceUri: parsed.RESOURCE_URI,
    authServerUrl: parsed.AUTH_SERVER_URL,
    tokenIssuer: parsed.TOKEN_ISSUER,
    tokenAudience: parsed.TOKEN_AUDIENCE,
    introspectionEndpoint: parsed.INTROSPECTION_ENDPOINT,
    introspectionClientSecret: parsed.INTROSPECTION_CLIENT_SECRET,
  });
}

export const nimroboConfig: NimroboConfig = loadConfig();
