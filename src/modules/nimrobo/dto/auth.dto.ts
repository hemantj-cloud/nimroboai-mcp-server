import { z } from 'zod';

export const OAuthTokenResponseSchema = z.object({
  access_token: z.string().describe('Opaque Bearer access token'),
  token_type: z.literal('Bearer').default('Bearer'),
  expires_in: z.number().describe('Token expiration time in seconds (typically 30 days = 2592000s)'),
  scope: z.string().describe('Granted scope, e.g., user:read'),
});

export type OAuthTokenResponse = z.infer<typeof OAuthTokenResponseSchema>;

export const UserProfileSchema = z.object({
  id: z.string().describe('Unique user ID in Nimrobo'),
  email: z.string().email().describe('User email address'),
  name: z.string().describe('User display name'),
  organization: z.string().optional().describe('Organization name'),
  role: z.string().optional().describe('User role (admin, member, etc.)'),
  plan: z.string().optional().describe('Active subscription plan'),
  created_at: z.string().describe('ISO timestamp of user creation'),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;
