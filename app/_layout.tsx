import React, { Component, ReactNode } from 'react';
import { Stack } from 'expo-router';
import { Pressable, Text, TextInput, View } from 'react-native';
import { TradingProvider } from '@/context/TradingContext';
import { C } from '@/components/ui';

const textDefaults = { color: C.ink };
const inputDefaults = { color: C.ink };
(Text as any).defaultProps = { ...(Text as any).defaultProps, style: textDefaults };
(TextInput as any).defaultProps = { ...(TextInput as any).defaultProps, style: inputDefaults, placeholderTextColor: C.muted };

type BoundaryState = { hasError: boolean };
class AppErrorBoundary extends Component<{ children: ReactNode }, BoundaryState> {
  state: BoundaryState = { hasError: false };
  static getDerivedStateFromError(): BoundaryState { return { hasError: true }; }
  componentDidCatch(error: Error) { console.error('SmartVibe application error', error); }
  retry = () => this.setState({ hasError: false });
  render() {
    if (!this.state.hasError) return this.props.children;
    return <View style={{flex:1,justifyContent:'center',alignItems:'center',padding:28,backgroundColor:C.surface}}><Text style={{color:C.ink,fontSize:24,fontWeight:'900',textAlign:'center'}}>SmartVibe needs to recover</Text><Text style={{color:C.muted,textAlign:'center',lineHeight:21,marginTop:10}}>An unexpected screen error occurred. Your account and access state were not changed.</Text><Pressable onPress={this.retry} style={{marginTop:20,paddingVertical:14,paddingHorizontal:26,borderRadius:14,backgroundColor:C.blue,borderWidth:1,borderColor:C.cyan}}><Text style={{color:C.white,fontWeight:'900'}}>Try Again</Text></Pressable></View>;
  }
}

export default function RootLayout() {
  return <AppErrorBoundary><TradingProvider><Stack screenOptions={{ headerShown:false }} /></TradingProvider></AppErrorBoundary>;
}
