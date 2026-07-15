import { describe, expect, it } from 'vitest'; import { authConfigFromEnv, requireOidcConfig } from './config';
describe('auth config', () => {
  it('rejects missing production configuration', () => expect(() => requireOidcConfig(authConfigFromEnv({}, false))).toThrow('Configuração OIDC obrigatória ausente'));
  it('allows demo bypass only in development', () => { expect(authConfigFromEnv({ EXPO_PUBLIC_DEV_AUTH_BYPASS: 'true' }, false).devBypass).toBe(false); expect(authConfigFromEnv({ EXPO_PUBLIC_DEV_AUTH_BYPASS: 'true' }, true).devBypass).toBe(true); });
});
