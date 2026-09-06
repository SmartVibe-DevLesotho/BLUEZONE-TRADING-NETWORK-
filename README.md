# BlueZone Supabase setup

1. Open the Supabase project dashboard.
2. Go to SQL Editor and run `schema.sql`.
3. Deploy the four Edge Functions from this folder using the Supabase dashboard or Supabase CLI:
   - market-data
   - consensus-signals
   - license-validate
   - ai-chat
4. For `ai-chat`, optionally add the `GEMINI_API_KEY` Edge Function secret. The mobile app does not receive this secret.
5. Create license tokens by storing SHA-256 hashes in `public.licenses` (never store plaintext tokens).

No service-role key belongs in the Expo app.
