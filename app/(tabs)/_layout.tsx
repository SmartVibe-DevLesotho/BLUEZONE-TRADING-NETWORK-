import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { C } from '@/components/ui';

const screens = [
  ['markets', 'Markets', 'stats-chart'],
  ['chart', 'Chart', 'analytics'],
  ['sessions', 'Sessions', 'time'],
  ['autotrade', 'Signals', 'flash'],
  ['more', 'More', 'menu'],
] as const;

export default function TabsLayout() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase?.auth.getSession() ?? { data: { session: null } };
      if (!active) return;
      if (!data.session) router.replace('/auth'); else setReady(true);
    })();
    return () => { active = false; };
  }, [router]);
  if (!ready) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.white }}><ActivityIndicator /></View>;
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: C.blue, tabBarInactiveTintColor: C.muted, tabBarStyle: { height: 68, paddingTop: 7, paddingBottom: 9, borderTopColor: C.border, backgroundColor: C.white }, tabBarLabelStyle: { fontSize: 11, fontWeight: '700' } }}>
    {screens.map(([name, title, icon]) => <Tabs.Screen key={name} name={name} options={{ title, tabBarIcon: ({ color, size }) => <Ionicons name={icon} color={color} size={size} /> }} />)}
    <Tabs.Screen name="profile" options={{ href: null }} />
  </Tabs>;
}
