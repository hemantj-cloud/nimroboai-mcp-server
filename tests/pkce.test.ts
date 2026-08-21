import { describe, it, expect } from 'vitest';
import {
  generateCodeVerifier,
  generateCodeChallenge,
  generatePkcePair,
  verifyPkceChallenge,
  base64UrlEncode,
} from '../src/auth/pkce.utils.js';

describe('PKCE S256 Utilities', () => {
  it('should generate valid code_verifier with minimum 43 characters', () => {
    const verifier = generateCodeVerifier(64);
    expect(verifier).toBeDefined();
    expect(verifier.length).toBe(64);
    // Ensure only unreserved characters [A-Z, a-z, 0-9, -, ., _, ~]
    expect(verifier).toMatch(/^[A-Za-z0-9\-_.~]+$/);
  });

  it('should throw if verifier length is less than 43 or greater than 128', () => {
    expect(() => generateCodeVerifier(30)).toThrow(/between 43 and 128/);
    expect(() => generateCodeVerifier(150)).toThrow(/between 43 and 128/);
  });

  it('should calculate correct S256 code_challenge from code_verifier (RFC 7636 Test Vector)', () => {
    // RFC 7636 Appendix B test vector:
    // Code Verifier: dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
    // Expected Challenge: E9Melhoa2OwvFrGMTJguCH5ZwG6Z3Qhp1EIjSbTTTnU
    const testVerifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
    const expectedChallenge = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM';

    const calculatedChallenge = generateCodeChallenge(testVerifier);
    expect(calculatedChallenge).toBe(expectedChallenge);
    expect(verifyPkceChallenge(testVerifier, expectedChallenge)).toBe(true);
  });

  it('should generate a complete PKCE pair with S256 method', () => {
    const pkce = generatePkcePair(64);
    expect(pkce.codeVerifier.length).toBe(64);
    expect(pkce.codeChallengeMethod).toBe('S256');
    expect(pkce.codeChallenge).toBeDefined();
    expect(pkce.state).toBeDefined();
    expect(verifyPkceChallenge(pkce.codeVerifier, pkce.codeChallenge)).toBe(true);
  });

  it('should reject verification if verifier does not match challenge', () => {
    const pkce = generatePkcePair();
    const wrongVerifier = generateCodeVerifier(64);
    expect(verifyPkceChallenge(wrongVerifier, pkce.codeChallenge)).toBe(false);
  });
});
