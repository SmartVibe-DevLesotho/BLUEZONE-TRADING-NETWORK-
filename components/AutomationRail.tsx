import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '@/components/ui';
import { SmartVibeLogo } from '@/components/SmartVibeBrand';

const slides = [
  { label: 'SMARTVIBE', title: 'Official SmartVibe', icon: 'sparkles-outline' as const },
  { label: 'LIVE MARKETS', title: 'Real market monitoring', icon: 'pulse-outline' as const },
  { label: 'SCANNER', title: 'Upload a chart. Get methodology feedback.', icon: 'scan-outline' as const },
  { label: 'SIGNALS', title: 'SmartVibe BUY / SELL analysis', icon: 'trending-up-outline' as const },
  { label: 'AI ASSISTANT', title: 'Secure trading education', icon: 'chatbubble-ellipses-outline' as const },
  { label: 'MT5 BRIDGE', title: 'Broker execution connection', icon: 'link-outline' as const },
  { label: 'PERFORMANCE', title: 'Recorded real outcomes', icon: 'stats-chart-outline' as const },
];

export function AutomationRail() {
  const x = useRef(new Animated.Value(0)).current;
  const [firstWidth, setFirstWidth] = useState(0);
  const [running, setRunning] = useState(false);
  const duplicated = [...slides, ...slides];

  useEffect(() => {
    if (!firstWidth || running) return;
    setRunning(true);
    const animation = Animated.loop(
      Animated.timing(x, { toValue: -firstWidth, duration: Math.max(18000, firstWidth * 18), useNativeDriver: true }),
      { resetBeforeIteration: true },
    );
    animation.start();
    return () => animation.stop();
  }, [firstWidth, running, x]);

  return <View style={{ marginVertical: 10, overflow: 'hidden' }}>
    <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border, paddingVertical: 10 }}>
      <Animated.View style={{ flexDirection: 'row', transform: [{ translateX: x }] }}>
        {duplicated.map((slide, index) => {
          const isFirstSet = index < slides.length;
          return <View key={`${slide.label}-${index}`} onLayout={isFirstSet && index === slides.length - 1 ? e => setFirstWidth(e.nativeEvent.layout.x + e.nativeEvent.layout.width) : undefined} style={{ width: 245, minHeight: 130, marginRight: 12, padding: 16, borderWidth: 1, borderColor: C.border, borderRadius: 18, backgroundColor: C.card, justifyContent: 'space-between' }}>
            {slide.label === 'SMARTVIBE' ? <SmartVibeLogo width={210} height={61} /> : <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><Text style={{ color: C.green, fontSize: 9, fontWeight: '900', letterSpacing: 1.5 }}>{slide.label}</Text><Ionicons name={slide.icon} size={19} color={C.cyan} /></View>}
            <Text style={{ color: C.ink, fontSize: 15, fontWeight: '900', lineHeight: 19 }}>{slide.title}</Text>
          </View>;
        })}
      </Animated.View>
    </View>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 9 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}><View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.green }} /><Text style={{ color: C.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1 }}>SMARTVIBE AUTOMATION</Text></View>
      <Text style={{ color: C.muted, fontSize: 9 }}>LIVE • MOVING</Text>
    </View>
  </View>;
}
