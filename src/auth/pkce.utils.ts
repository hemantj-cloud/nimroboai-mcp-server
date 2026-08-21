import crypto from 'node:crypto';

/**
 * PKCE (RFC 7636) Utilities for S256 Challenge & Verifier Generation
 * 
 * Spec Requirements:
 * - Code Challenge Method: S256 only (hard-rejects plain)
 * - Code Verifier length: 43 to 128 characters
 * - Unreserved characters: [A-Z], [a-z], [0-9], "-", ".", "_", "~"
 */
export interface PkcePair {
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256';
  state: string;
}

/**
 * Convert Buffer to Base64URL encoding (RFC 4648 §5)
 */
export function base64UrlEncode(buffer: Buffer): string {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Generates a cryptographically random code verifier (min 43 chars, default 64 chars).
 */
export function generateCodeVerifier(length: number = 64): string {
  if (length < 43 || length > 128) {
    throw new Error('PKCE code_verifier length must be between 43 and 128 characters');
  }
  // Generate random bytes and base64url encode to get safe string
  const byteLength = Math.ceil((length * 3) / 4);
  const randomBytes = crypto.randomBytes(byteLength);
  return base64UrlEncode(randomBytes).substring(0, length);
}

/**
 * Computes SHA-256 hash and encodes as base64url for code_challenge.
 */
export function generateCodeChallenge(verifier: string): string {
  if (!verifier || verifier.length < 43 || verifier.length > 128) {
    throw new Error('PKCE code_verifier must be between 43 and 128 characters to compute S256 challenge');
  }
  const hash = crypto.createHash('sha256').update(verifier, 'ascii').digest();
  return base64UrlEncode(hash);
}

/**
 * Generates a random state string for OAuth CSRF protection.
 */
export function generateState(length: number = 32): string {
  return base64UrlEncode(crypto.randomBytes(length)).substring(0, length);
}

/**
 * Generates complete PKCE pair with S256 method.
 */
export function generatePkcePair(verifierLength: number = 64): PkcePair {
  const codeVerifier = generateCodeVerifier(verifierLength);
  const codeChallenge = generateCodeChallenge(codeVerifier);
  const state = generateState();

  return {
    codeVerifier,
    codeChallenge,
    codeChallengeMethod: 'S256',
    state,
  };
}

/**
 * Verifies if a given code_verifier matches the code_challenge using S256.
 */
export function verifyPkceChallenge(verifier: string, expectedChallenge: string): boolean {
  const computedChallenge = generateCodeChallenge(verifier);
  return crypto.timingSafeEqual(
    Buffer.from(computedChallenge),
    Buffer.from(expectedChallenge)
  );
}
