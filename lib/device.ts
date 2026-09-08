import * as SecureStore from 'expo-secure-store';

const DEVICE_KEY = 'smartvibe_device_id';

function fallbackId() {
  const bytes = Array.from({ length: 16 }, () => Math.floor(Math.random() * 256));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export async function getDeviceId(): Promise<string> {
  const existing = await SecureStore.getItemAsync(DEVICE_KEY);
  if (existing) return existing;
  const generated = globalThis.crypto?.randomUUID?.() ?? fallbackId();
  await SecureStore.setItemAsync(DEVICE_KEY, generated);
  return generated;
}
