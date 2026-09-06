import { useEffect, useState } from 'react';
import { ActivityIndicator, Text } from 'react-native';
import { Screen, Card, Button, C } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';

export default function Profile() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { supabase?.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null)).finally(() => setLoading(false)); }, []);
  async function signOut() { await supabase?.auth.signOut(); router.replace('/auth'); }
  return <Screen><Text style={{fontSize:30,fontWeight:'900',color:C.midnight}}>Profile</Text>{loading?<ActivityIndicator/>:<Card><Text style={{fontWeight:'900'}}>Account</Text><Text style={{color:C.muted,marginTop:8}}>{email ?? 'No authenticated user'}</Text></Card>}<Button title="Sign out" onPress={signOut} variant="secondary"/></Screen>;
}
