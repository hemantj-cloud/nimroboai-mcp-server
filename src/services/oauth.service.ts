import { Injectable } from '@nitrostack/core';
import axios from 'axios';
import { nimroboConfig, NimroboConfig } from '../config/nimrobo.config.js';
import { generatePkcePair, PkcePair, verifyPkceChallenge } from '../auth/pkce.utils.js';
import { OAuthTokenResponse, OAuthTokenResponseSchema } from '../modules/nimrobo/dto/auth.dto.js';

export interface StoredToken {
  accessToken: string;
  tokenType: string;
  expiresAt: number; // Unix timestamp in ms
  scope: string;
}

@Injectable()
export class OAuthService {
  private config: NimroboConfig;
  private currentToken?: StoredToken;
  private pendingPkcePairs: Map<string, PkcePair> = new Map(); // state -> PkcePair

  constructor() {
    this.config = nimroboConfig;
    if (this.config.accessToken) {
      // If configured directly via env, set 30 day lifetime
      this.setAccessToken(this.config.accessToken, 30 * 24 * 60 * 60, this.config.scope);
    }
  }

  /**
   * Generates authorization URL with PKCE S256 parameters.
   */
  getAuthorizationUrl(customRedirectUri?: string): { authorizationUrl: string; pkce: PkcePair } {
    const pkce = generatePkcePair();
    const redirectUri = customRedirectUri || this.config.redirectUri;

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      scope: this.config.scope,
      code_challenge: pkce.codeChallenge,
      code_challenge_method: this.config.codeChallengeMethod,
      state: pkce.state,
    });

    const authorizationUrl = `${this.config.authUrl}?${params.toString()}`;
    this.pendingPkcePairs.set(pkce.state, pkce);

    return { authorizationUrl, pkce };
  }

  /**
   * Exchanges authorization code for access token using code_verifier (PKCE S256).
   */
  async exchangeCodeForToken(params: {
    code: string;
    codeVerifier?: string;
    state?: string;
    redirectUri?: string;
  }): Promise<OAuthTokenResponse> {
    let verifier = params.codeVerifier;

    if (!verifier && params.state && this.pendingPkcePairs.has(params.state)) {
      verifier = this.pendingPkcePairs.get(params.state)!.codeVerifier;
    }

    if (!verifier) {
      throw new Error('PKCE code_verifier is required to complete token exchange (S256 enforcement)');
    }

    const payload = {
      grant_type: 'authorization_code',
      client_id: this.config.clientId,
      code: params.code,
      redirect_uri: params.redirectUri || this.config.redirectUri,
      code_verifier: verifier,
    };

    try {
      const response = await axios.post<OAuthTokenResponse>(
        this.config.tokenUrl,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          timeout: 15000,
        }
      );

      const parsed = OAuthTokenResponseSchema.parse(response.data);
      this.setAccessToken(parsed.access_token, parsed.expires_in, parsed.scope);
      if (params.state) {
        this.pendingPkcePairs.delete(params.state);
      }
      return parsed;
    } catch (error: any) {
      if (this.config.isMockMode) {
        // Mock fallback for offline test environments
        const mockToken: OAuthTokenResponse = {
          access_token: `mock_tok_${Date.now()}_nimrobo_bearer`,
          token_type: 'Bearer',
          expires_in: 30 * 24 * 60 * 60, // 30 days
          scope: this.config.scope,
        };
        this.setAccessToken(mockToken.access_token, mockToken.expires_in, mockToken.scope);
        return mockToken;
      }

      const errMsg = error.response?.data?.error_description || error.response?.data?.error || error.message;
      throw new Error(`Nimrobo OAuth token exchange failed: ${errMsg}`);
    }
  }

  /**
   * Sets and caches the active access token with expiration time.
   */
  setAccessToken(accessToken: string, expiresInSeconds: number = 30 * 24 * 60 * 60, scope: string = 'user:read'): void {
    this.currentToken = {
      accessToken,
      tokenType: 'Bearer',
      expiresAt: Date.now() + expiresInSeconds * 1000,
      scope,
    };
  }

  /**
   * Retrieves active access token if valid and not expired.
   */
  getAccessToken(): string | undefined {
    if (!this.currentToken) return undefined;
    if (this.isTokenExpired()) {
      return undefined;
    }
    return this.currentToken.accessToken;
  }

  /**
   * Checks if current token has expired (with 60-second buffer).
   */
  isTokenExpired(): boolean {
    if (!this.currentToken) return true;
    return Date.now() > this.currentToken.expiresAt - 60000;
  }

  /**
   * Gets current token details.
   */
  getTokenDetails(): StoredToken | undefined {
    return this.currentToken;
  }
}
