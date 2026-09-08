import React from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, Text, View } from 'react-native';
import { theme } from '@/theme/tokens';

export const C = theme.colors;

export function Screen({ children }: { children: React.ReactNode }) {
  return <SafeAreaView style={{ flex: 1, backgroundColor: C.surface }}><View style={{ flex: 1, paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.md }}>{children}</View></SafeAreaView>;
}

export function Header({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return <View style={{ marginBottom: theme.spacing.md, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}><View style={{ flex: 1 }}><Text style={{ fontSize: 30, lineHeight: 36, fontWeight: '900', color: C.ink, letterSpacing: -0.7 }}>{title}</Text>{subtitle ? <Text style={{ color: C.muted, marginTop: 5, fontSize: 14, lineHeight: 20 }}>{subtitle}</Text> : null}</View>{right}</View>;
}

export function Card({ children, elevated = false }: { children: React.ReactNode; elevated?: boolean }) {
  return <View style={{ backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: theme.radius.lg, padding: theme.spacing.lg, marginVertical: theme.spacing.xs, ...(elevated ? { shadowColor: C.cyan, shadowOpacity: 0.08, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 5 } : {}) }}>{children}</View>;
}

export function Button({ title, onPress, variant = 'primary', disabled = false }: { title: string; onPress: () => void; variant?: 'primary' | 'secondary'; disabled?: boolean }) {
  const primary = variant === 'primary';
  return <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => ({ backgroundColor: primary ? C.blue : C.card, borderWidth: 1, borderColor: primary ? C.cyan : C.border, borderRadius: theme.radius.md, paddingVertical: 15, paddingHorizontal: 18, alignItems: 'center', marginVertical: theme.spacing.xs, opacity: disabled ? 0.45 : pressed ? 0.72 : 1 })}><Text style={{ color: primary ? C.white : C.ink, fontWeight: '900', fontSize: 15 }}>{title}</Text></Pressable>;
}

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'positive' | 'negative' | 'blue' }) {
  const color = tone === 'positive' ? C.green : tone === 'negative' ? C.red : tone === 'blue' ? C.cyan : C.muted;
  const backgroundColor = tone === 'positive' ? C.greenSoft : tone === 'negative' ? C.redSoft : tone === 'blue' ? C.blueSoft : C.card;
  return <View style={{ alignSelf: 'flex-start', backgroundColor, borderWidth: 1, borderColor: C.border, borderRadius: theme.radius.pill, paddingHorizontal: 10, paddingVertical: 5 }}><Text style={{ color, fontWeight: '900', fontSize: 12 }}>{label}</Text></View>;
}

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return <View style={{ alignItems: 'center', paddingVertical: theme.spacing.xl }}><ActivityIndicator color={C.cyan} /><Text style={{ color: C.muted, marginTop: 8 }}>{label}</Text></View>;
}
