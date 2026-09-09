import { useEffect, useState } from 'react';
import { useRouter, Tabs } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { validateLicense } from '@/lib/backend';
import { getDeviceId } from '@/lib/device';
import { C } from '@/components/ui';

const screens = [['markets','Markets','stats-chart'],['chart','Chart','analytics'],['sessions','Sessions','time'],['autotrade','Signals','flash'],['more','More','menu']] as const;
const previewMode = process.env.EXPO_PUBLIC_PREVIEW_MODE === 'true';

export default function TabsLayout() {
  const router = useRouter();
  const [ready, setReady] = useState(previewMode);
  useEffect(() => {
    if (previewMode) return;
    let active = true;
    (async () => {
      try {
        if (!supabase) { router.replace('/auth'); return; }
        const sessionResult = await supabase.auth.getSession();
        if (!active) return;
        if (!sessionResult.data.session) { router.replace('/auth'); return; }
        const deviceId = await getDeviceId();
        const license = await validateLicense({ action: 'status', deviceId });
        if (!license.valid) { router.replace('/license'); return; }
        setReady(true);
      } catch { if (active) router.replace('/license'); }
    })();
    return () => { active = false; };
  }, [router]);
  if (!ready) return <View style={{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:C.surface}}><ActivityIndicator color={C.cyan}/></View>;
  return <Tabs screenOptions={{headerShown:false,tabBarActiveTintColor:C.cyan,tabBarInactiveTintColor:C.muted,tabBarStyle:{height:68,paddingTop:7,paddingBottom:9,borderTopColor:C.border,backgroundColor:C.navy},tabBarLabelStyle:{fontSize:11,fontWeight:'700'}}}>
    {screens.map(([name,title,icon]) => <Tabs.Screen key={name} name={name} options={{title,tabBarIcon:({color,size})=><Ionicons name={icon} color={color} size={size}/>}}/>)}
    <Tabs.Screen name="profile" options={{href:null}} />
  </Tabs>;
}
