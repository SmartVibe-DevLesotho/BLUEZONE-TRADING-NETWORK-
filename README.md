# BlueZone Trading Network

BlueZone Trading Network is a portrait-first Expo/React Native trading companion for market data, session tools, consensus signals, education, broker information and optional MT5 automation integrations.

## Development

```bash
npm install
npx expo start
```

## Environment

Copy `.env.example` to `.env` locally and provide the Supabase project URL and publishable key. Never commit `.env`, service-role keys, API secrets, or other credentials.

## Supabase

The app uses the existing BlueZone Supabase backend. Keep BlueZone resources isolated from unrelated applications. Server-only secrets such as `GEMINI_API_KEY` and Supabase service-role credentials belong only in Edge Function/server environments.

## Production checks

Before release, verify authentication, license validation, market-data providers, consensus signals, AI provider configuration, secure storage, and all native build identifiers. Run TypeScript checks and an Expo production build before distribution.

Developer: SmartVibes Lesotho
