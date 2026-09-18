import { useEffect, useState } from 'react';
import { Alert, Image, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card, Screen, C } from '@/components/ui';
import { SmartVibeLogo } from '@/components/SmartVibeBrand';
import { supabase } from '@/lib/supabase';

export default function AdminMfa(){
 const router=useRouter();
 const [mode,setMode]=useState<'loading'|'enroll'|'verify'>('loading');
 const [factorId,setFactorId]=useState('');
 const [qr,setQr]=useState('');
 const [secret,setSecret]=useState('');
 const [code,setCode]=useState('');
 const [error,setError]=useState('');
 const [busy,setBusy]=useState(false);

 async function ensureOwner(){
  if(!supabase) throw new Error('Supabase is not configured.');
  const {data:session}=await supabase.auth.getSession();
  if(!session.session) { router.replace('/admin-login'); return; }
  const {data,error}=await supabase.functions.invoke('admin-license',{body:{action:'list'}});
  if(error) throw error;
  if(!data?.authorized) throw new Error('Administration access denied.');
  const {data:aal,error:aalError}=await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if(aalError) throw aalError;
  if(aal?.currentLevel==='aal2'){ router.replace('/admin'); return; }
  const {data:factors,error:factorError}=await supabase.auth.mfa.listFactors();
  if(factorError) throw factorError;
  const verified=factors?.totp?.find((f:any)=>f.status==='verified');
  if(verified){ setFactorId(verified.id); setMode('verify'); return; }
  const {data:enrolled,error:enrollError}=await supabase.auth.mfa.enroll({factorType:'totp',friendlyName:'SmartVibe Owner Portal'});
  if(enrollError) throw enrollError;
  setFactorId(enrolled.id);
  setQr(enrolled.totp?.qr_code ?? '');
  setSecret(enrolled.totp?.secret ?? '');
  setMode('enroll');
 }

 useEffect(()=>{ensureOwner().catch((e:any)=>{setError(e?.message??'Unable to secure administrator session.');setMode('verify');});},[]);

 async function verify(){
  if(!supabase||!factorId)return;
  const clean=code.replace(/\s/g,'');
  if(!/^\d{6}$/.test(clean)){setError('Enter the 6-digit authenticator code.');return;}
  setBusy(true);setError('');
  try{
   const {data:challenge,error:challengeError}=await supabase.auth.mfa.challenge({factorId});
   if(challengeError)throw challengeError;
   const {error:verifyError}=await supabase.auth.mfa.verify({factorId,challengeId:challenge.id,code:clean});
   if(verifyError)throw verifyError;
   await supabase.auth.refreshSession();
   const {data:aal}=await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
   if(aal?.currentLevel!=='aal2')throw new Error('Second-factor verification did not reach the required security level.');
   router.replace('/admin');
  }catch(e:any){setError(e?.message??'MFA verification failed.');}
  finally{setBusy(false)}
 }

 async function logout(){await supabase?.auth.signOut();router.replace('/');}
 if(mode==='loading')return <Screen><View style={{flex:1,justifyContent:'center',alignItems:'center',padding:24}}><SmartVibeLogo width={270} height={82}/><Text style={{marginTop:18,color:C.muted}}>Checking owner security…</Text></View></Screen>;
 return <Screen><View style={{flex:1,justifyContent:'center',padding:20}}><Text style={{fontSize:12,fontWeight:'900',color:C.cyan,letterSpacing:1.5,textAlign:'center'}}>SMARTVIBE ADMINISTRATION</Text><Text style={{fontSize:30,fontWeight:'900',color:C.ink,textAlign:'center',marginTop:7}}>Owner verification</Text><Text style={{color:C.muted,textAlign:'center',marginTop:8,lineHeight:21}}>Token issuance is protected by a second authentication factor. Use an authenticator app you control.</Text><Card>
 {mode==='enroll'?<><Text style={{fontWeight:'900',fontSize:18,color:C.ink}}>Set up authenticator</Text><Text style={{color:C.muted,marginTop:6,lineHeight:20}}>Scan this QR code with Google Authenticator, Microsoft Authenticator, 1Password, or another TOTP authenticator.</Text>{qr?<Image source={{uri:qr}} style={{width:220,height:220,alignSelf:'center',marginVertical:16}}/>:null}<Text style={{fontWeight:'900',color:C.ink}}>Manual setup secret</Text><Text selectable style={{marginTop:7,fontFamily:'monospace',fontWeight:'900',color:C.ink}}>{secret||'Unavailable'}</Text><Text style={{color:C.muted,marginTop:8,lineHeight:19}}>After adding SmartVibe Owner to the authenticator app, enter the current 6-digit code below.</Text></>:<><Text style={{fontWeight:'900',fontSize:18,color:C.ink}}>Enter owner MFA code</Text><Text style={{color:C.muted,marginTop:6}}>Open your authenticator app and enter the current 6-digit SmartVibe Owner code.</Text></>}
 <TextInput value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} placeholder="000000" placeholderTextColor={C.muted} style={input}/>{error?<Text style={{color:C.red,marginTop:10,lineHeight:20}}>{error}</Text>:null}</Card><Button title={busy?'Verifying…':'Verify and enter Owner Portal'} onPress={verify} disabled={busy||!factorId}/><Button title="Sign out" variant="secondary" onPress={logout} disabled={busy}/><Text style={{textAlign:'center',color:C.muted,fontSize:11,marginTop:14}}>Only the verified owner account can reach token controls.</Text></View></Screen>
}
const input={borderWidth:1 as const,borderColor:C.border,borderRadius:14,padding:15,marginTop:14,fontSize:22,color:C.ink,backgroundColor:C.card,textAlign:'center' as const,letterSpacing:5};
