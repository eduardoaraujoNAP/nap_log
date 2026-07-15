import NextAuth from "next-auth";
import Keycloak from "next-auth/providers/keycloak";

const devBypass = process.env.NODE_ENV === "development" && process.env.DEV_AUTH_BYPASS === "true";

async function refreshAccessToken(token: import("next-auth/jwt").JWT) {
  if (!token.refreshToken || !process.env.AUTH_KEYCLOAK_ISSUER || !process.env.AUTH_KEYCLOAK_ID || !process.env.AUTH_KEYCLOAK_SECRET) return { ...token, tokenError: "RefreshUnavailable" as const };
  try {
    const response = await fetch(`${process.env.AUTH_KEYCLOAK_ISSUER.replace(/\/$/, "")}/protocol/openid-connect/token`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: token.refreshToken, client_id: process.env.AUTH_KEYCLOAK_ID, client_secret: process.env.AUTH_KEYCLOAK_SECRET }) });
    const refreshed = await response.json() as { access_token?: string; expires_in?: number; refresh_token?: string };
    if (!response.ok || !refreshed.access_token) throw new Error("OIDC refresh rejected");
    return { ...token, accessToken: refreshed.access_token, accessTokenExpiresAt: Math.floor(Date.now() / 1000) + (refreshed.expires_in ?? 300), refreshToken: refreshed.refresh_token ?? token.refreshToken, tokenError: undefined };
  } catch { return { ...token, accessToken: undefined, tokenError: "RefreshAccessTokenError" as const }; }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Keycloak({
    clientId: process.env.AUTH_KEYCLOAK_ID,
    clientSecret: process.env.AUTH_KEYCLOAK_SECRET,
    issuer: process.env.AUTH_KEYCLOAK_ISSUER,
    checks: ["pkce", "state"],
  })],
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
        token.accessTokenExpiresAt = account.expires_at;
        token.refreshToken = account.refresh_token;
        token.tenantId = typeof profile?.tenant_id === "string" ? profile.tenant_id : undefined;
        return token;
      }
      if (token.accessTokenExpiresAt && Date.now() < (token.accessTokenExpiresAt - 30) * 1000) return token;
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.sub ?? "";
      return session;
    },
    authorized({ auth: session }) { return devBypass || Boolean(session?.user); },
  },
  pages: { signIn: "/login" },
  trustHost: true,
});

declare module "next-auth" { interface Session { user: { id: string; name?: string | null; email?: string | null; image?: string | null } } }
declare module "next-auth/jwt" { interface JWT { accessToken?: string; accessTokenExpiresAt?: number; refreshToken?: string; tenantId?: string; tokenError?: "RefreshUnavailable" | "RefreshAccessTokenError" } }
