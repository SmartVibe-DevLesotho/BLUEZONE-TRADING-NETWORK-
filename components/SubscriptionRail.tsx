import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, View } from 'react-native';
import { C } from '@/components/ui';

const packages = [
  ['PROFESSIONAL', 'R300', '2 Weeks', '15 signals', 'Core SmartVibe signals'],
  ['PROFESSIONAL', 'R600', '1 Month', '30 signals', 'Core SmartVibe signals'],
  ['PROFESSIONAL', 'R1000', '2 Months', '35 signals', 'Core SmartVibe signals'],
  ['ADVANCED', 'R1000', '1 Month', '30 signals', 'Scanner + WhatsApp group'],
  ['ADVANCED', 'R1600', '2 Months', '50 signals', 'Scanner + WhatsApp group'],
  ['ADVANCED', 'R2500', '3 Months', '70 signals', 'Scanner + WhatsApp group'],
  ['PREMIUM PRO', 'R2500', '1 Month', '100 signals', 'All SmartVibe services'],
  ['PREMIUM PRO', 'R3200', '2 Months', '200 signals', 'All SmartVibe services'],
  ['PREMIUM PRO', 'R3700', '3 Months', '300 signals', 'All SmartVibe services'],
  ['PREMIUM PRO', 'R4300', '4 Months', '400 signals', 'All SmartVibe services'],
  ['PREMIUM PRO', 'R5000', '5 Months', '500 signals', 'All SmartVibe services'],
] as const;

export function SubscriptionRail() {
  const x = useRef(new Animated.Value(0)).current;
  const [width, setWidth] = useState(0);
  useEffect(() => { if (!width) return; const a = Animated.loop(Animated.timing(x,{toValue:-width,duration:30000,useNativeDriver:true}),{resetBeforeIteration:true}); a.start(); return () => a.stop(); }, [width,x]);
  return <View style={{ marginTop: 10, overflow: 'hidden' }}><Text style={{ color: C.cyan, fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 9 }}>SMARTVIBE SUBSCRIPTIONS</Text><Animated.View style={{ flexDirection:'row', transform:[{translateX:x}] }}>{[...packages,...packages].map((p,i)=><View key={`${p[0]}-${p[2]}-${i}`} onLayout={i===packages.length-1?e=>setWidth(e.nativeEvent.layout.x+e.nativeEvent.layout.width):undefined} style={{ width:235,minHeight:125,marginRight:12,padding:15,borderRadius:18,borderWidth:1,borderColor:C.border,backgroundColor:C.card,justifyContent:'space-between' }}><Text style={{ color:C.green,fontSize:9,fontWeight:'900',letterSpacing:1.2 }}>{p[0]}</Text><Text style={{ color:C.ink,fontSize:25,fontWeight:'900',marginTop:5 }}>{p[1]}</Text><Text style={{ color:C.slate,fontWeight:'800' }}>{p[2]} • {p[3]}</Text><Text style={{ color:C.muted,fontSize:12,marginTop:5 }}>{p[4]}</Text></View>)}</Animated.View><Text style={{ color:C.muted,fontSize:9,marginTop:8 }}>Package signals are total entitlements for the token period. Unused paid signals are eligible for renewal carryover.</Text></View>;
}
