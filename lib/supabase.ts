import { createClient, type SupportedStorage } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const secureStorage: SupportedStorage = {
  getItem: (keyName) => SecureStore.getItemAsync(keyName),
  setItem: (keyName, value) => SecureStore.setItemAsync(keyName, value),
  removeItem: (keyName) => SecureStore.deleteItemAsync(keyName),
};

export const supabase = url && key
  ? createClient(url, key, {
      auth: { storage: secureStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
    })
  : null;
