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
 async function activate(){setError('');if(!token.trim())return setError('Enter your license token.');setBusy(true);try{const {data}=await supabase?.auth.getSession() ?? {data:{session:null}};if(!data.session){router.replace('/auth');return;}const deviceId=await getDeviceId();const result=await validateLicense({token:token.trim(),action:'activate',deviceId});if(!result.valid)throw new Error(result.message);setToken('');router.replace('/(tabs)/markets')}catch(e:any){setError(e?.message??'License validation failed.')}finally{setBusy(false)}}
 if(checking)return <Screen><View style={{flex:1,justifyContent:'center',alignItems:'center'}}><Text style={{color:C.muted}}>Checking license access…</Text></View></Screen>;
 return <Screen><View style={{flex:1,justifyContent:'center'}}><Text style={{fontSize:13,fontWeight:'900',color:C.blue,letterSpacing:1}}>SMARTVIBE TRADING NETWORK</Text><Text style={{fontSize:40,fontWeight:'900',color:C.midnight,marginTop:8}}>Activate app</Text><Text style={{color:C.muted,fontSize:16,lineHeight:24,marginTop:10}}>Enter the activation token supplied by the SmartVibe administrator. Clients cannot create or issue tokens.</Text><Card><Text style={{fontWeight:'900',marginBottom:8}}>License token</Text><TextInput value={token} onChangeText={setToken} autoCapitalize="characters" autoCorrect={false} placeholder="SVTN-…" style={{borderWidth:1,borderColor:'#E6EBF1',borderRadius:14,padding:15,fontSize:16}}/>{error?<Text style={{color:C.red,marginTop:8}}>{error}</Text>:null}</Card><Button title={busy?'Activating…':'Activate license'} onPress={activate}/></View></Screen>}
