# Mobile

Aplicativo Expo/React Native inicial para o motorista. O login e os dados são demonstrativos.

## Arquitetura offline

As telas dependem de `LocalStore`, não de uma biblioteca concreta. Android e iOS usam `SQLiteLocalStore` com `expo-sqlite`, migrações transacionais por `PRAGMA user_version` e persistência de atividades, metadados e outbox. Web/SSR e testes usam `MemoryStore`; SQLCipher poderá substituir apenas o adaptador. `LocationTracker` reserva a integração futura com tarefas de localização em background sem levar APIs nativas ao domínio.

```sh
pnpm install
pnpm --filter @nap-log/mobile start
pnpm --filter @nap-log/mobile test
```

## Autenticação

O runtime normal usa Authorization Code com PKCE contra o issuer OIDC configurado em `.env` (consulte `.env.example`). Tokens e o identificador estável do dispositivo ficam no Secure Store; o refresh token é substituído quando o provedor fizer rotação. O cliente envia `Authorization: Bearer` e nunca registra tokens.

`EXPO_PUBLIC_DEV_AUTH_BYPASS=true` habilita o login demonstrativo e o header `x-tenant-id` somente quando `__DEV__` também for verdadeiro. Builds de produção exigem `EXPO_PUBLIC_OIDC_ISSUER`, `EXPO_PUBLIC_OIDC_CLIENT_ID` e `EXPO_PUBLIC_API_URL`.
