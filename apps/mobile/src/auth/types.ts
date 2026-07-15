export interface TokenSet { accessToken: string; refreshToken: string; expiresAt: number; idToken?: string; }
export interface TokenVault { loadTokens(): Promise<TokenSet | undefined>; saveTokens(tokens: TokenSet): Promise<void>; clearTokens(): Promise<void>; getOrCreateDeviceId(): Promise<string>; }
