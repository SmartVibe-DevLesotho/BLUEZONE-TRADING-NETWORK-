import React from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, Text, View } from 'react-native';
import { theme } from '@/theme/tokens';

export const C = theme.colors;

export function Screen({ children }: { children: React.ReactNode }) {
  return <SafeAreaView style={{ flex: 1, backgroundColor: C.surface }}><View style={{ flex: 1, paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.md }}>{children}</View></SafeAreaView>;
}

export function Header({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return <View style={{ marginBottom: theme.spacing.md, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}><View style={{ flex: 1 }}><Text style={{ fontSize: 30, lineHeight: 36, fontWeight: '900', color: C.ink }}>{title}</Text>{subtitle ? <Text style={{ color: C.muted, marginTop: 5, fontSize: 14 }}>{subtitle}</Text> : null}</View>{right}</View>;
}

export function Card({ children, elevated = false }: { children: React.ReactNode; elevated?: boolean }) {
  return <View style={{ backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: theme.radius.lg, padding: theme.spacing.lg, marginVertical: theme.spacing.xs, ...(elevated ? { shadowColor: C.ink, shadowOpacity: 0.09, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 4 } : {}) }}>{children}</View>;
}

export function Button({ title, onPress, variant = 'primary', disabled = false }: { title: string; onPress: () => void; variant?: 'primary' | 'secondary'; disabled?: boolean }) {
  const primary = variant === 'primary';
  return <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => ({ backgroundColor: primary ? C.ink : C.white, borderWidth: primary ? 0 : 1, borderColor: C.border, borderRadius: theme.radius.md, paddingVertical: 15, paddingHorizontal: 18, alignItems: 'center', marginVertical: theme.spacing.xs, opacity: disabled ? 0.45 : pressed ? 0.72 : 1 })}><Text style={{ color: primary ? C.white : C.ink, fontWeight: '800', fontSize: 15 }}>{title}</Text></Pressable>;
}

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'positive' | 'negative' | 'blue' }) {
  const color = tone === 'positive' ? C.green : tone === 'negative' ? C.red : tone === 'blue' ? C.blue : C.muted;
  const backgroundColor = tone === 'positive' ? C.greenSoft : tone === 'negative' ? C.redSoft : tone === 'blue' ? C.blueSoft : C.surface;
  return <View style={{ alignSelf: 'flex-start', backgroundColor, borderRadius: theme.radius.pill, paddingHorizontal: 10, paddingVertical: 5 }}><Text style={{ color, fontWeight: '800', fontSize: 12 }}>{label}</Text></View>;
}

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return <View style={{ alignItems: 'center', paddingVertical: theme.spacing.xl }}><ActivityIndicator color={C.blue} /><Text style={{ color: C.muted, marginTop: 8 }}>{label}</Text></View>;
}
