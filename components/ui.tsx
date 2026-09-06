import React from 'react';
import { Pressable, SafeAreaView, Text, View } from 'react-native';

export const C = { midnight:'#0B1220', blue:'#2563EB', muted:'#64748B', red:'#DC2626', white:'#FFFFFF', border:'#E6EBF1', surface:'#F8FAFC' };

export function Screen({ children }: { children: React.ReactNode }) {
  return <SafeAreaView style={{ flex:1, backgroundColor:C.white }}><View style={{ flex:1, padding:20 }}>{children}</View></SafeAreaView>;
}

export function Card({ children }: { children: React.ReactNode }) {
  return <View style={{ backgroundColor:C.surface, borderWidth:1, borderColor:C.border, borderRadius:18, padding:16, marginVertical:8 }}>{children}</View>;
}

export function Button({ title, onPress, variant='primary' }: { title:string; onPress:()=>void; variant?:'primary'|'secondary' }) {
  return <Pressable onPress={onPress} style={{ backgroundColor:variant==='primary'?C.midnight:C.surface, borderWidth:variant==='secondary'?1:0, borderColor:C.border, borderRadius:14, padding:15, alignItems:'center', marginVertical:6 }}><Text style={{ color:variant==='primary'?C.white:C.midnight, fontWeight:'800' }}>{title}</Text></Pressable>;
}
