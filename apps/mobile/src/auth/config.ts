export interface AuthConfig { issuer?: string; clientId?: string; apiUrl?: string; devBypass: boolean; tenantId?: string; }
export function authConfigFromEnv(env: Record<string, string | undefined> = process.env, development = typeof __DEV__ !== 'undefined' && __DEV__): AuthConfig {
  const devBypass = development && env.EXPO_PUBLIC_DEV_AUTH_BYPASS === 'true';
  return { issuer: env.EXPO_PUBLIC_OIDC_ISSUER, clientId: env.EXPO_PUBLIC_OIDC_CLIENT_ID, apiUrl: env.EXPO_PUBLIC_API_URL, devBypass, tenantId: devBypass ? env.EXPO_PUBLIC_TENANT_ID ?? env.TENANT_ID : undefined };
}
export function requireOidcConfig(config: AuthConfig): asserts config is AuthConfig & { issuer: string; clientId: string; apiUrl: string } {
  if (config.devBypass) return;
  if (!config.issuer || !config.clientId || !config.apiUrl) throw new Error('Configuração OIDC obrigatória ausente');
}
