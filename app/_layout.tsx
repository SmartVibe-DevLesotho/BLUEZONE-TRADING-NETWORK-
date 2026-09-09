import { Stack } from 'expo-router';
import { TradingProvider } from '@/context/TradingContext';
import { Text, TextInput } from 'react-native';
import { C } from '@/components/ui';

const textDefaults = { color: C.ink };
const inputDefaults = { color: C.ink };
(Text as any).defaultProps = { ...(Text as any).defaultProps, style: textDefaults };
(TextInput as any).defaultProps = { ...(TextInput as any).defaultProps, style: inputDefaults, placeholderTextColor: C.muted };

export default function RootLayout() {
  return <TradingProvider><Stack screenOptions={{ headerShown:false }} /></TradingProvider>;
}
