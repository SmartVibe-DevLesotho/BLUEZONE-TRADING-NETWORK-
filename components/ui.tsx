import React from 'react';
import { Pressable, SafeAreaView, Text, View } from 'react-native';
import { theme } from '@/theme/tokens';

export const C = theme.colors;

export function Screen({ children }: { children: React.ReactNode }) {
  return <SafeAreaView style={{ flex: 1, backgroundColor: C.white }}><View style={{ flex: 1, paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.md }}>{children}</View></SafeAreaView>;
}

export function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  return <View style={{ marginBottom: theme.spacing.md }}><Text style={{ fontSize: 30, lineHeight: 36, fontWeight: '900', color: C.ink }}>{title}</Text>{subtitle ? <Text style={{ color: C.muted, marginTop: 5, fontSize: 14 }}>{subtitle}</Text> : null}</View>;
}

export function Card({ children, elevated = false }: { children: React.ReactNode; elevated?: boolean }) {
  return <View style={{ backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: theme.radius.lg, padding: theme.spacing.lg, marginVertical: theme.spacing.xs, ...(elevated ? { shadowColor: C.ink, shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 3 } : {}) }}>{children}</View>;
}

export function Button({ title, onPress, variant = 'primary' }: { title: string; onPress: () => void; variant?: 'primary' | 'secondary' }) {
  const primary = variant === 'primary';
  return <Pressable onPress={onPress} style={({ pressed }) => ({ backgroundColor: primary ? C.ink : C.white, borderWidth: primary ? 0 : 1, borderColor: C.border, borderRadius: theme.radius.md, paddingVertical: 15, paddingHorizontal: 18, alignItems: 'center', marginVertical: theme.spacing.xs, opacity: pressed ? 0.75 : 1 })}><Text style={{ color: primary ? C.white : C.ink, fontWeight: '800', fontSize: 15 }}>{title}</Text></Pressable>;
}

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'positive' | 'negative' | 'blue' }) {
  const color = tone === 'positive' ? C.green : tone === 'negative' ? C.red : tone === 'blue' ? C.blue : C.muted;
  return <View style={{ alignSelf: 'flex-start', backgroundColor: tone === 'blue' ? C.blueSoft : C.white, borderRadius: theme.radius.pill, paddingHorizontal: 10, paddingVertical: 5 }}><Text style={{ color, fontWeight: '800', fontSize: 12 }}>{label}</Text></View>;
}
