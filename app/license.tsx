import { useEffect, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card, Screen, C } from '@/components/ui';
import { getDeviceId } from '@/lib/device';
import { supabase } from '@/lib/supabase';
import { validateLicense } from '@/lib/backend';

export default function License(){
 const router=useRouter(); const[token,setToken]=useState(''); const[busy,setBusy]=useState(false); const[checking,setChecking]=useState(true); const[error,setError]=useState('');
 useEffect(()=>{(async()=>{try{const {data}=await supabase?.auth.getSession() ?? {data:{session:null}};if(!data.session){router.replace('/auth');return;}const deviceId=await getDeviceId();const result=await validateLicense({action:'status',deviceId});if(result.valid)router.replace('/(tabs)/markets');}catch{}finally{setChecking(false)}})()},[router]);
 async function activate(){setError('');if(!token.trim())return setError('Enter your activation token.');setBusy(true);try{const {data}=await supabase?.auth.getSession() ?? {data:{session:null}};if(!data.session){router.replace('/auth');return;}const deviceId=await getDeviceId();const result=await validateLicense({token:token.trim(),action:'activate',deviceId});if(!result.valid)throw new Error(result.message);setToken('');router.replace('/(tabs)/markets')}catch(e:any){setError(e?.message??'Activation could not be completed.')}finally{setBusy(false)}}
 if(checking)return <Screen><View style={{flex:1,justifyContent:'center',alignItems:'center'}}><Text style={{color:C.muted}}>Checking access…</Text></View></Screen>;
 return <Screen><View style={{flex:1,justifyContent:'center'}}><Text style={{fontSize:13,fontWeight:'900',color:C.cyan,letterSpacing:1}}>SMARTVIBE TRADING NETWORK</Text><Text style={{fontSize:40,fontWeight:'900',color:C.ink,marginTop:8}}>Activate app</Text><Text style={{color:C.muted,fontSize:16,lineHeight:24,marginTop:10}}>Enter the activation token supplied by SmartVibe Support.</Text><Card><Text style={{fontWeight:'900',color:C.ink,marginBottom:8}}>Activation token</Text><TextInput value={token} onChangeText={setToken} autoCapitalize="characters" autoCorrect={false} placeholder="SVTN-…" placeholderTextColor={C.muted} style={{borderWidth:1,borderColor:C.border,borderRadius:14,padding:15,fontSize:16,color:C.ink,backgroundColor:C.card}}/>{error?<Text style={{color:C.red,marginTop:8}}>{error}</Text>:null}</Card><Button title={busy?'Activating…':'Activate access'} onPress={activate}/></View></Screen>}
