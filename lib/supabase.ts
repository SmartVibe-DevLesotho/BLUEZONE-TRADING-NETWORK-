import { createClient, type SupportedStorage } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Expo Web must use browser localStorage. SecureStore is a native storage API
// and its delete implementation is not available in the web runtime.
const webStorage: SupportedStorage = {
  getItem: async (keyName) => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(keyName);
  },
  setItem: async (keyName, value) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(keyName, value);
  },
  removeItem: async (keyName) => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(keyName);
  },
};

const nativeStorage: SupportedStorage = {
  getItem: (keyName) => SecureStore.getItemAsync(keyName),
  setItem: (keyName, value) => SecureStore.setItemAsync(keyName, value),
  removeItem: (keyName) => SecureStore.deleteItemAsync(keyName),
};

const authStorage = Platform.OS === 'web' ? webStorage : nativeStorage;

export const supabase = url && key
  ? createClient(url, key, {
      auth: {
        storage: authStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;
