import { useEffect, useState } from 'react';
import { useRouter, Tabs } from 'expo-router';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { validateLicense } from '@/lib/backend';
import { getDeviceId } from '@/lib/device';
import { C } from '@/components/ui';

const screens = [['markets','Markets','stats-chart'],['chart','Chart','analytics'],['sessions','Sessions','time'],['autotrade','Signals','flash'],['more','More','menu']] as const;
// Preview access is deliberately limited to development builds. A release build can never bypass auth/license checks via an env flag.
const previewMode = __DEV__ && process.env.EXPO_PUBLIC_PREVIEW_MODE === 'true';

export default function TabsLayout() {
  const router = useRouter();
  const [ready, setReady] = useState(previewMode);
  const [checking, setChecking] = useState(!previewMode);
  const [error, setError] = useState<string | null>(null);

  async function checkAccess() {
    if (previewMode) { setReady(true); setChecking(false); setError(null); return; }
    setChecking(true); setError(null);
    try {
      if (!supabase) throw new Error('SmartVibe services are unavailable.');
      const sessionResult = await supabase.auth.getSession();
      if (!sessionResult.data.session) { router.replace('/auth'); return; }
      const deviceId = await getDeviceId();
      const license = await validateLicense({ action: 'status', deviceId });
      if (!license.valid) { router.replace('/license'); return; }
      setReady(true);
    } catch {
      setReady(false);
      setError('We could not verify access right now. Your session has not been changed. Please try again.');
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => { checkAccess(); }, []);

  if (!ready) return <View style={{flex:1,justifyContent:'center',alignItems:'center',padding:28,backgroundColor:C.surface}}>{checking ? <><ActivityIndicator color={C.cyan}/><Text style={{color:C.muted,marginTop:12}}>Checking SmartVibe access…</Text></> : <><Text style={{color:C.ink,fontSize:20,fontWeight:'900',textAlign:'center'}}>SmartVibe access verification</Text><Text style={{color:C.muted,textAlign:'center',marginTop:8,lineHeight:21}}>{error}</Text><Pressable onPress={checkAccess} style={{marginTop:18,paddingVertical:14,paddingHorizontal:24,borderRadius:14,backgroundColor:C.blue,borderWidth:1,borderColor:C.cyan}}><Text style={{color:C.white,fontWeight:'900'}}>Retry</Text></Pressable></>}</View>;

  return <Tabs screenOptions={{headerShown:false,tabBarActiveTintColor:C.cyan,tabBarInactiveTintColor:C.muted,tabBarStyle:{height:68,paddingTop:7,paddingBottom:9,borderTopColor:C.border,backgroundColor:C.navy},tabBarLabelStyle:{fontSize:11,fontWeight:'700'}}}>
    {screens.map(([name,title,icon]) => <Tabs.Screen key={name} name={name} options={{title,tabBarIcon:({color,size})=><Ionicons name={icon} color={color} size={size}/>}}/>)}
    <Tabs.Screen name="profile" options={{href:null}} />
  </Tabs>;
}
