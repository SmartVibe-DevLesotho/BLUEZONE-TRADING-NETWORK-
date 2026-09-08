import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Screen, Card, Button, C } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { validateLicense } from '@/lib/backend';
import { getDeviceId } from '@/lib/device';
import { router } from 'expo-router';

export default function Profile() {
  const [email,setEmail]=useState<string|null>(null);
  const [status,setStatus]=useState<any>({});
  const [stats,setStats]=useState<{closed_signals:number;wins:number;losses:number;win_rate:number;realized_pips:number}|null>(null);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{(async()=>{try{
    const {data}=await supabase?.auth.getUser() ?? {data:{user:null}}; setEmail(data.user?.email??null);
    const deviceId=await getDeviceId(); const result=await validateLicense({action:'status',deviceId}); if(result.valid)setStatus(result);
    const {data:perf}=await supabase.from('smartvibe_performance_stats').select('*').maybeSingle(); if(perf)setStats(perf as any);
  }finally{setLoading(false);}})();},[]);
  async function signOut(){await supabase?.auth.signOut();router.replace('/auth');}
  return <Screen>
    <Text style={{fontSize:30,fontWeight:'900',color:C.midnight}}>Profile</Text>
    {loading?<ActivityIndicator/>:<>
      <Card><Text style={{fontWeight:'900'}}>Account</Text><Text style={{color:C.muted,marginTop:8}}>{email??'No authenticated user'}</Text></Card>
      <Card><Text style={{fontWeight:'900'}}>SmartVibe Subscription</Text>
        <Text style={{color:C.muted,marginTop:8}}>{status.packageName??status.plan??'Not active'}</Text>
        {status.pricePaidLsl!=null?<Text style={{color:C.muted,marginTop:5}}>Paid: R{Number(status.pricePaidLsl).toLocaleString()}</Text>:null}
        {status.includedSignals!=null?<><Text style={{color:C.muted,marginTop:5}}>Package signals: {status.includedSignals}</Text><Text style={{color:C.muted,marginTop:5}}>Used: {status.signalsUsed??0}</Text><Text style={{color:C.muted,marginTop:5}}>Pending approval: {status.signalsPending??0}</Text><Text style={{color:C.muted,marginTop:5}}>Unused records: {status.signalsUnused??0}</Text><Text style={{fontWeight:'900',marginTop:7}}>Remaining: {status.signalsRemaining??0}</Text></>:null}
        {status.carryoverSignals>0?<Text style={{color:C.muted,marginTop:5}}>Carryover: {status.carryoverSignals} signals • Credit: R{Number(status.carryoverCreditLsl??0).toFixed(2)}</Text>:null}
        {status.expiresAt?<Text style={{color:C.muted,marginTop:5}}>Expires {new Date(status.expiresAt).toLocaleDateString()}</Text>:null}
        <View style={{marginTop:10}}><Text style={{fontWeight:'800'}}>Access</Text><Text style={{color:C.muted,marginTop:4}}>Chart Scanner: {status.scannerAccess?'Included':'Not included'}</Text><Text style={{color:C.muted,marginTop:4}}>WhatsApp Group: {status.whatsappGroupAccess?'Included':'Not included'}</Text><Text style={{color:C.muted,marginTop:4}}>All Services: {status.allServicesAccess?'Included':'Not included'}</Text></View>
      </Card>
      <Card><Text style={{fontWeight:'900'}}>Recorded SmartVibe Performance</Text>{stats?<><View style={{flexDirection:'row',justifyContent:'space-between',marginTop:12}}><Text style={{color:C.muted}}>Closed</Text><Text style={{fontWeight:'900'}}>{stats.closed_signals}</Text></View><View style={{flexDirection:'row',justifyContent:'space-between',marginTop:7}}><Text style={{color:C.muted}}>Wins</Text><Text style={{fontWeight:'900'}}>{stats.wins}</Text></View><View style={{flexDirection:'row',justifyContent:'space-between',marginTop:7}}><Text style={{color:C.muted}}>Losses</Text><Text style={{fontWeight:'900'}}>{stats.losses}</Text></View><View style={{flexDirection:'row',justifyContent:'space-between',marginTop:7}}><Text style={{color:C.muted}}>Win rate</Text><Text style={{fontWeight:'900'}}>{stats.win_rate}%</Text></View><View style={{flexDirection:'row',justifyContent:'space-between',marginTop:7}}><Text style={{color:C.muted}}>Realized movement</Text><Text style={{fontWeight:'900'}}>{Number(stats.realized_pips).toFixed(1)} pips</Text></View></>:<Text style={{color:C.muted,marginTop:8}}>No closed live outcomes have been recorded yet.</Text>}</Card>
    </>}
    <Button title="Sign out" onPress={signOut} variant="secondary"/>
  </Screen>;
}
