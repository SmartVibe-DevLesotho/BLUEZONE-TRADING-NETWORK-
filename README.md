# BlueZone Trading Network

BlueZone Trading Network is a portrait-first Expo/React Native trading companion for live market data, trading sessions, consensus signals, education, broker information and optional MT5 integrations.

## Current architecture

- Expo 54 + Expo Router 6 + React Native
- Supabase Auth with SecureStore-backed sessions
- Supabase Edge Functions for server-side market data, consensus signals, license validation and AI
- No broker credentials or provider secrets in the mobile client
- Paper-trading state is explicitly simulated; the client does not claim to place broker orders
- Market instruments are metadata only; live prices must come from the configured backend provider

## Development

```bash
npm install
npm run typecheck
npx expo start
```

## Environment

Copy `.env.example` to `.env` locally and provide the BlueZone Supabase project URL and publishable key. Never commit `.env`, service-role keys, Gemini keys, broker credentials, or other secrets.

## Supabase

The mobile app targets the existing **BlueZone Trading Network** Supabase project. BlueZone resources must remain isolated from unrelated applications. Server-only credentials such as `SUPABASE_SERVICE_ROLE_KEY` and `GEMINI_API_KEY` belong only in Edge Function/server environments.

The existing backend currently exposes active Edge Functions including `market-data`, `consensus-signals`, `license-validate`, and `ai-chat`. Additional BlueZone platform functions may exist in Supabase and should not be removed merely because they are not part of the mobile repository.

## Release gate

Before public distribution, verify:

1. Supabase URL and publishable key are configured in the build environment.
2. Authentication and email-confirmation behavior match the production Auth settings.
3. License validation has its required server-side configuration and expiry rules.
4. Market-data and consensus providers return real, timestamped data; no fallback is presented as live.
5. AI provider credentials remain server-side.
6. iOS/Android application identifiers, icons, splash assets and signing credentials are configured.
7. Run `npm run typecheck` and an Expo production build successfully.
8. Rotate any credential that was previously committed to the public repository.

## Security

The repository intentionally excludes environment files, dependency directories, archives and editor artifacts. Supabase RLS is enabled on user-owned data, and privileged database functions are restricted from anonymous execution.

Developer: SmartVibes Lesotho
