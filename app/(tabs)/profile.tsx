import { useEffect, useState } from 'react';
import { ActivityIndicator, Text } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Screen, Card, Button, C } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';

export default function Profile() {
  const [email,setEmail]=useState<string|null>(null); const [license,setLicense]=useState('Not activated'); const [loading,setLoading]=useState(true);
  useEffect(()=>{(async()=>{const [{data},token]=await Promise.all([supabase?.auth.getUser() ?? Promise.resolve({data:{user:null}}),SecureStore.getItemAsync('smartvibe_license_token')]);setEmail(data.user?.email??null);if(token)setLicense('Activated');setLoading(false);})();},[]);
  async function signOut(){await supabase?.auth.signOut();router.replace('/auth');}
  return <Screen><Text style={{fontSize:30,fontWeight:'900',color:C.midnight}}>Profile</Text>{loading?<ActivityIndicator/>:<><Card><Text style={{fontWeight:'900'}}>Account</Text><Text style={{color:C.muted,marginTop:8}}>{email??'No authenticated user'}</Text></Card><Card><Text style={{fontWeight:'900'}}>License</Text><Text style={{color:C.muted,marginTop:8}}>{license}</Text></Card></>}<Button title="Sign out" onPress={signOut} variant="secondary"/></Screen>;
}
