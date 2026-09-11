# SMARTVIBE TRADING NETWORK

SMARTVIBE TRADING NETWORK is the unified trading application for live market data, structured market analysis, trading sessions, education, chart intelligence, risk controls and optional broker integrations.

## Primary methodology

The **SmartVibe Primary Methodology** is the final methodology authority of the application. Supporting mechanisms provide evidence and context only. They cannot independently authorize or execute trades.

The methodology evaluates higher-timeframe structure, liquidity, range location, confirmation, risk and execution conditions. When evidence is insufficient or contradictory, the system must prefer `WAIT`, `NO SETUP`, or `REJECTED` rather than fabricate confidence.

## Current architecture

- Expo 54 + Expo Router 6 + React Native
- Supabase Auth with SecureStore-backed sessions
- Supabase Edge Functions for server-side market data, signals, license validation and AI
- No broker credentials or provider secrets in the mobile client
- No paper trading, simulated positions, synthetic P/L, fabricated market prices or demo trading results
- Market instruments are metadata only; live prices must come from the configured backend provider
- Universal supporting intelligence is subordinate to the SmartVibe Primary Methodology
- Live execution is protected by methodology, risk and database-level execution gates

## Development

```bash
npm install
npm run typecheck
npm run test:smartvibe-firewall
npx expo start
```

## Environment

Copy `.env.example` to `.env` locally and provide the SmartVibe Supabase project URL and publishable key. Never commit `.env`, service-role keys, model keys, broker credentials, or other secrets.

## Supabase

The mobile app targets the existing Supabase infrastructure. Existing backend resources must remain intact and isolated from unrelated applications. Server-only credentials such as `SUPABASE_SERVICE_ROLE_KEY` belong only in Edge Function/server environments.

## Live-data rule

The production app must never disguise unavailable, delayed, estimated, simulated or fallback values as live market data. When a provider is unavailable or a quote is stale, the UI must clearly report that condition rather than inventing a price or signal.

## Execution hierarchy

```text
SMARTVIBE TRADING NETWORK
        ↓
SMARTVIBE PRIMARY METHODOLOGY
        ↓
SUPPORTING EVIDENCE
        ↓
SMARTVIBE FINAL DECISION
        ↓
RISK ENGINE
        ↓
EXECUTION SAFETY GATE
        ↓
BROKER ADAPTER
```

A supporting mechanism can never bypass this hierarchy.

## Release gate

Before public distribution, verify:

1. Supabase URL and publishable key are configured in the build environment.
2. Authentication and email-confirmation behavior match the production Auth settings.
3. License validation has its required server-side configuration and expiry rules.
4. Market-data providers return real, timestamped data; no fallback is presented as live.
5. Model credentials remain server-side.
6. iOS/Android application identifiers, icons, splash assets and signing credentials are configured.
7. Run `npm run typecheck`, `npm run test:smartvibe-firewall` and the production Expo build successfully.
8. Rotate any credential that was previously committed to the public repository.

## Security

The repository excludes environment files, dependency directories, archives and editor artifacts. Supabase RLS is enabled on user-owned data, and privileged database functions are restricted from anonymous execution.
