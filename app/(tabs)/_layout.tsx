import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

export default function TabsLayout() {
  const router=useRouter(); const [ready,setReady]=useState(false);
  useEffect(()=>{let active=true;(async()=>{const {data}=await supabase?.auth.getSession() ?? {data:{session:null}};if(!active)return;if(!data.session)router.replace('/auth');else setReady(true);})();return()=>{active=false};},[router]);
  if(!ready)return <View style={{flex:1,justifyContent:'center',alignItems:'center'}}><ActivityIndicator/></View>;
  return <Tabs screenOptions={{ headerShown:false, tabBarActiveTintColor:'#2563EB' }}><Tabs.Screen name="markets" options={{ title:'Markets', tabBarIcon:({color,size})=><Ionicons name="stats-chart" color={color} size={size}/> }}/><Tabs.Screen name="chart" options={{ title:'Chart', tabBarIcon:({color,size})=><Ionicons name="analytics" color={color} size={size}/> }}/><Tabs.Screen name="sessions" options={{ title:'Sessions', tabBarIcon:({color,size})=><Ionicons name="time" color={color} size={size}/> }}/><Tabs.Screen name="autotrade" options={{ title:'AutoTrade', tabBarIcon:({color,size})=><Ionicons name="flash" color={color} size={size}/> }}/><Tabs.Screen name="more" options={{ title:'More', tabBarIcon:({color,size})=><Ionicons name="menu" color={color} size={size}/> }}/><Tabs.Screen name="profile" options={{ href:null }}/></Tabs>;
}
