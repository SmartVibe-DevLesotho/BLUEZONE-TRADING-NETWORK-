# BlueZone Trading Network — Native Expo

Native iOS/Android trading companion built with Expo, React Native, TypeScript and Supabase.

## Current architecture

Expo mobile app → Supabase Auth/Database/Edge Functions → free public market data.

Automatic MT5 execution is intentionally disabled in this $0 phone-first version. Paper trading and signal generation work without a laptop. MT5 can be added later through a broker-supported execution/VPS layer.

## Supabase setup

1. Open your Supabase project.
2. SQL Editor → run `supabase/schema.sql`.
3. Deploy the functions under `supabase/functions/`.
4. Put your Supabase URL and publishable key in `.env`.
5. Start Expo with `npx expo start`.

Never put a service-role key, database password, JWT secret, or broker secret in Expo.

## First launch flow

License → Risk Disclaimer → Supabase Auth → 7-tab workspace.

The app uses a local SecureStore flag for the license/risk gates and Supabase for authentication/backend data.
