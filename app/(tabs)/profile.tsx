import { useEffect, useState } from 'react';
import { ActivityIndicator, Text } from 'react-native';
import { Screen, Card, Button, C } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { validateLicense } from '@/lib/backend';
import { getDeviceId } from '@/lib/device';
import { router } from 'expo-router';

export default function Profile() {
  const [email,setEmail]=useState<string|null>(null); const [status,setStatus]=useState<{plan?:string;limit?:number;remaining?:number;expiresAt?:string|null}>({}); const [loading,setLoading]=useState(true);
  useEffect(()=>{(async()=>{try{const {data}=await supabase?.auth.getUser() ?? {data:{user:null}};setEmail(data.user?.email??null);const deviceId=await getDeviceId();const result=await validateLicense({action:'status',deviceId});if(result.valid)setStatus({plan:(result as any).plan,limit:(result as any).dailySignalLimit,remaining:(result as any).signalsRemainingToday,expiresAt:result.expiresAt});}finally{setLoading(false);}})();},[]);
  async function signOut(){await supabase?.auth.signOut();router.replace('/auth');}
  return <Screen><Text style={{fontSize:30,fontWeight:'900',color:C.midnight}}>Profile</Text>{loading?<ActivityIndicator/>:<><Card><Text style={{fontWeight:'900'}}>Account</Text><Text style={{color:C.muted,marginTop:8}}>{email??'No authenticated user'}</Text></Card><Card><Text style={{fontWeight:'900'}}>Subscription</Text><Text style={{color:C.muted,marginTop:8}}>{status.plan??'Not active'}</Text>{status.limit!=null?<Text style={{color:C.muted,marginTop:5}}>{status.remaining} of {status.limit} signals remaining today</Text>:null}{status.expiresAt?<Text style={{color:C.muted,marginTop:5}}>Expires {new Date(status.expiresAt).toLocaleDateString()}</Text>:null}</Card></>}<Button title="Sign out" onPress={signOut} variant="secondary"/></Screen>;
}
