import type { AuthConfig } from './config';
import type { TokenSet, TokenVault } from './types';
type Fetch = typeof fetch;
interface Discovery { token_endpoint: string; }
interface TokenResponse { access_token: string; refresh_token?: string; expires_in?: number; id_token?: string; }
export class OidcSessionManager {
  constructor(private readonly config: AuthConfig, private readonly vault: TokenVault, private readonly request: Fetch = fetch, private readonly now = () => Date.now()) {}
  async getValidAccessToken(): Promise<string | undefined> { const tokens = await this.vault.loadTokens(); if (!tokens) return undefined; if (tokens.expiresAt - this.now() > 60_000) return tokens.accessToken; return (await this.refresh(tokens)).accessToken; }
  async refresh(tokens: TokenSet): Promise<TokenSet> {
    if (!this.config.issuer || !this.config.clientId) throw new Error('Configuração OIDC obrigatória ausente');
    const discoveryResponse = await this.request(`${this.config.issuer.replace(/\/$/, '')}/.well-known/openid-configuration`); if (!discoveryResponse.ok) throw new Error('Falha ao descobrir provedor OIDC'); const discovery = await discoveryResponse.json() as Discovery;
    const response = await this.request(discovery.token_endpoint, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'refresh_token', client_id: this.config.clientId, refresh_token: tokens.refreshToken }).toString() });
    if (!response.ok) { await this.vault.clearTokens(); throw new Error('Sessão expirada'); }
    const payload = await response.json() as TokenResponse; const rotated: TokenSet = { accessToken: payload.access_token, refreshToken: payload.refresh_token ?? tokens.refreshToken, expiresAt: this.now() + (payload.expires_in ?? 300) * 1000, idToken: payload.id_token ?? tokens.idToken }; await this.vault.saveTokens(rotated); return rotated;
  }
  async logout() { await this.vault.clearTokens(); }
}
export function tokenSetFromExchange(response: { accessToken: string; refreshToken?: string; expiresIn?: number; idToken?: string }, now = Date.now()): TokenSet {
  if (!response.refreshToken) throw new Error('Provedor não retornou refresh token'); return { accessToken: response.accessToken, refreshToken: response.refreshToken, expiresAt: now + (response.expiresIn ?? 300) * 1000, idToken: response.idToken };
}
