import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const DEVICE_KEY = 'smartvibe_device_id';

function fallbackId() {
  const bytes = Array.from({ length: 16 }, () => Math.floor(Math.random() * 256));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function webGet(): string | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage.getItem(DEVICE_KEY) : null;
  } catch {
    return null;
  }
}

function webSet(value: string) {
  try {
    if (typeof window !== 'undefined') window.localStorage.setItem(DEVICE_KEY, value);
  } catch {
    // Continue with the in-memory generated ID when browser storage is unavailable.
  }
}

export async function getDeviceId(): Promise<string> {
  // expo-secure-store's native API is not a valid persistence backend for the
  // Expo web build. On web, use browser storage instead of calling SecureStore,
  // which can surface getValueWithKeyAsync/setValueWithKeyAsync errors.
  if (Platform.OS === 'web') {
    const existing = webGet();
    if (existing) return existing;
    const generated = globalThis.crypto?.randomUUID?.() ?? fallbackId();
    webSet(generated);
    return generated;
  }

  const existing = await SecureStore.getItemAsync(DEVICE_KEY);
  if (existing) return existing;
  const generated = globalThis.crypto?.randomUUID?.() ?? fallbackId();
  await SecureStore.setItemAsync(DEVICE_KEY, generated);
  return generated;
}
