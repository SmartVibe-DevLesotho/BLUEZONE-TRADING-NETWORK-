import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card, Screen, C } from '@/components/ui';
import { SmartVibeLogo } from '@/components/SmartVibeBrand';
import { supabase } from '@/lib/supabase';

export default function AdminLogin(){
 const router=useRouter();
 const [email,setEmail]=useState('');
 const [password,setPassword]=useState('');
 const [error,setError]=useState('');
 const [busy,setBusy]=useState(false);
 async function signIn(){
  setError('');
  if(!supabase)return setError('Supabase is not configured.');
  if(!email.trim()||!password)return setError('Enter the administrator email and password.');
  setBusy(true);
  try{
   const {error}=await supabase.auth.signInWithPassword({email:email.trim(),password});
   if(error)throw error;
   const {data,error:adminError}=await supabase.functions.invoke('admin-license',{body:{action:'list'}});
   if(adminError||!data)throw new Error(adminError?.message??'Administration access denied.');
   router.replace('/admin');
  }catch(e:any){
   await supabase.auth.signOut();
   setError(e?.message??'Administrator sign-in failed.');
  }finally{setBusy(false)}
 }
 return <Screen><View style={{flex:1,justifyContent:'center'}}><View style={{alignItems:'center',marginBottom:14}}><SmartVibeLogo width={310} height={93}/></View><Text style={{fontSize:12,fontWeight:'900',color:C.cyan,letterSpacing:1.5,textAlign:'center'}}>SMARTVIBE ADMINISTRATION</Text><Text style={{fontSize:34,lineHeight:40,fontWeight:'900',color:C.ink,marginTop:8,textAlign:'center'}}>Owner Portal</Text><Text style={{color:C.muted,fontSize:15,lineHeight:22,marginTop:8,textAlign:'center'}}>Authorized administrators can issue, review and revoke client activation tokens.</Text><Card><Text style={{fontWeight:'900',color:C.ink}}>Administrator email</Text><TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoCorrect={false} placeholder="admin email" placeholderTextColor={C.muted} style={input}/><Text style={{fontWeight:'900',marginTop:14,color:C.ink}}>Administrator password</Text><TextInput value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoCorrect={false} placeholder="Password" placeholderTextColor={C.muted} style={input}/>{error?<Text style={{color:C.red,marginTop:10,lineHeight:20}}>{error}</Text>:null}</Card><Button title={busy?'Signing in…':'Sign in to Admin Portal'} onPress={signIn} disabled={busy}/><Button title="Back to Welcome" variant="secondary" onPress={()=>router.replace('/')} disabled={busy}/></View></Screen>
}
const input={borderWidth:1 as const,borderColor:C.border,borderRadius:14,padding:14,marginTop:8,fontSize:16,color:C.ink,backgroundColor:C.card};
