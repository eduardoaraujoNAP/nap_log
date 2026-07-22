# Mobile

Aplicativo Expo/React Native offline-first para o motorista. Em operação normal, as atividades são carregadas da API conforme o claim OIDC `driver_id` e persistidas localmente.

## Arquitetura offline

As telas dependem de `LocalStore`, não de uma biblioteca concreta. Android e iOS usam `SQLiteLocalStore` com `expo-sqlite`, migrações transacionais por `PRAGMA user_version` e persistência de atividades, metadados e outbox. Web/SSR e testes usam `MemoryStore`; SQLCipher poderá substituir apenas o adaptador. `LocationTracker` reserva a integração futura com tarefas de localização em background sem levar APIs nativas ao domínio.

```sh
pnpm install
pnpm --filter @nap-log/mobile start
pnpm --filter @nap-log/mobile test
```

## Autenticação

O runtime normal usa Authorization Code com PKCE contra o issuer OIDC configurado em `.env` (consulte `.env.example`). Tokens e o identificador estável do dispositivo ficam no Secure Store; o refresh token é substituído quando o provedor fizer rotação. O cliente envia `Authorization: Bearer` e nunca registra tokens.

`EXPO_PUBLIC_DEV_AUTH_BYPASS=true` habilita o login demonstrativo e os headers `x-tenant-id` e `x-driver-id` somente quando `__DEV__` também for verdadeiro. Nesse modo, configure `EXPO_PUBLIC_TENANT_ID` e `EXPO_PUBLIC_DRIVER_ID` com registros existentes. Builds de produção exigem `EXPO_PUBLIC_OIDC_ISSUER`, `EXPO_PUBLIC_OIDC_CLIENT_ID` e `EXPO_PUBLIC_API_URL`.

O cliente mobile do Keycloak deve incluir no access token o claim UUID `driver_id`, pertencente ao mesmo tenant do claim `tenant_id`.
