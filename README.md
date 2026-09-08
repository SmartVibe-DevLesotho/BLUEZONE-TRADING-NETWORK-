# SmartVibe Trading Network

SmartVibe Trading Network is a portrait-first Expo/React Native trading application for live market data, trading sessions, the SmartVibe Trading Strategy, consensus analysis, education, broker information and optional MT5 integrations.

## Main strategy

**SmartVibe Trading Strategy** is the primary methodology of the application. Its A & V framework is applied across the premium methodology experience:

- Higher-timeframe direction from Daily or 4H
- BUY setup: identify the break of A's highs, then look for an FVG or Order Block entry; target the closest high
- SELL setup: identify the break of V's lows, then look for an FVG or Order Block entry; target the closest low
- Entries require the defined structural/liquidity sequence; absence of confirmation means no trade setup

This methodology is educational and does not guarantee outcomes.

## Current architecture

- Expo 54 + Expo Router 6 + React Native
- Supabase Auth with SecureStore-backed sessions
- Supabase Edge Functions for server-side market data, consensus signals, license validation and AI
- No broker credentials or provider secrets in the mobile client
- No paper trading, simulated positions, synthetic P/L, fabricated market prices or demo trading results
- Market instruments are metadata only; live prices must come from the configured backend provider

## Development

```bash
npm install
npm run typecheck
npx expo start
```

## Environment

Copy `.env.example` to `.env` locally and provide the SmartVibe Supabase project URL and publishable key. Never commit `.env`, service-role keys, Gemini keys, broker credentials, or other secrets.

## Supabase

The mobile app targets the existing Supabase infrastructure. Existing backend resources must remain intact and isolated from unrelated applications. Server-only credentials such as `SUPABASE_SERVICE_ROLE_KEY` and `GEMINI_API_KEY` belong only in Edge Function/server environments.

The existing backend exposes active Edge Functions including `market-data`, `consensus-signals`, `license-validate`, and `ai-chat`. Additional platform functions may exist in Supabase and should not be removed merely because they are not part of the mobile repository.

## Live-data rule

The production app must never disguise unavailable, delayed, estimated, simulated or fallback values as live market data. When a provider is unavailable or a quote is stale, the UI must clearly report that condition rather than inventing a price or signal.

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
