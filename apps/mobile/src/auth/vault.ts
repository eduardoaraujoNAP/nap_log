import { createUuid } from '../utils/id';
import type { TokenSet, TokenVault } from './types';
const TOKEN_KEY = 'nap-log.oidc.tokens'; const DEVICE_KEY = 'nap-log.device-id';
export class SecureTokenVault implements TokenVault {
  async loadTokens() { const SecureStore = await import('expo-secure-store'); const value = await SecureStore.getItemAsync(TOKEN_KEY); return value ? JSON.parse(value) as TokenSet : undefined; }
  async saveTokens(tokens: TokenSet) { const SecureStore = await import('expo-secure-store'); await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify(tokens), { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY }); }
  async clearTokens() { const SecureStore = await import('expo-secure-store'); await SecureStore.deleteItemAsync(TOKEN_KEY); }
  async getOrCreateDeviceId() { const SecureStore = await import('expo-secure-store'); const existing = await SecureStore.getItemAsync(DEVICE_KEY); if (existing) return existing; const id = createUuid(); await SecureStore.setItemAsync(DEVICE_KEY, id, { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY }); return id; }
}
export class MemoryTokenVault implements TokenVault {
  tokens?: TokenSet; deviceId?: string;
  async loadTokens() { return this.tokens; } async saveTokens(value: TokenSet) { this.tokens = value; } async clearTokens() { this.tokens = undefined; }
  async getOrCreateDeviceId() { return this.deviceId ??= createUuid(); }
}
export function createTokenVault(platform: string): TokenVault { return platform === 'web' || platform === 'test' ? new MemoryTokenVault() : new SecureTokenVault(); }
