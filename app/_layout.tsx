import { Stack } from 'expo-router';
import { TradingProvider } from '@/context/TradingContext';

export default function RootLayout() {
  return <TradingProvider><Stack screenOptions={{ headerShown:false }} /></TradingProvider>;
}
