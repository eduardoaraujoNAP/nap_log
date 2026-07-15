# NAP Log Web

Painel Next.js protegido por OIDC/Keycloak via Auth.js. O fluxo usa Authorization Code com PKCE e state. A sessão é um JWT criptografado em cookie `httpOnly`; o access token permanece no cookie server-side e não faz parte do objeto de sessão enviado ao navegador.

## Variáveis de ambiente

| Variável | Uso |
| --- | --- |
| `AUTH_SECRET` | Segredo forte usado para criptografar e validar a sessão |
| `AUTH_KEYCLOAK_ID` | Client ID OIDC do painel |
| `AUTH_KEYCLOAK_SECRET` | Client secret OIDC |
| `AUTH_KEYCLOAK_ISSUER` | Issuer do realm, por exemplo `https://sso.exemplo/realms/nap-log` |
| `AUTH_URL` | URL pública do painel usada nos callbacks Auth.js |
| `NEXT_PUBLIC_API_URL` | URL server-side da API logística, incluindo `/v1` |
| `DEV_AUTH_BYPASS` | Aceito somente quando `NODE_ENV=development`; use `true` para bypass local |
| `DEV_DEMO_TENANT_ID` | UUID explícito enviado como tenant apenas durante o bypass local |

No Keycloak, cadastre `${AUTH_URL}/api/auth/callback/keycloak` como redirect URI. Em produção, `DEV_AUTH_BYPASS` é ignorado mesmo que esteja definido. O proxy same-origin adiciona `Authorization: Bearer` no servidor; o access token e o tenant não são expostos ao JavaScript cliente.
