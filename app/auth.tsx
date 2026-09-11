import { useEffect, useState } from 'react';
import { Platform, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { Button, Card, Screen, C } from '@/components/ui';
import { SmartVibeLogo } from '@/components/SmartVibeBrand';
import { supabase } from '@/lib/supabase';

export default function Auth(){
 const router=useRouter();
 const [register,setRegister]=useState(false);
 const [verifyMode,setVerifyMode]=useState(false);
 const [username,setUsername]=useState('');
 const [email,setEmail]=useState('');
 const [password,setPassword]=useState('');
 const [otp,setOtp]=useState('');
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const [busy,setBusy]=useState(false);
 const [googleBusy,setGoogleBusy]=useState(false);
 const [resetMode,setResetMode]=useState(false);

 useEffect(()=>{
  const handleOAuthUrl=async(url:string)=>{
   if(!url.includes('access_token=')&&!url.includes('code='))return;
   try{
    const parsed=new URL(url);
    const hashParams=new URLSearchParams(parsed.hash.replace(/^#/,''));
    const accessToken=hashParams.get('access_token');
    const refreshToken=hashParams.get('refresh_token');
    if(accessToken&&refreshToken){
     const {error}=await supabase.auth.setSession({access_token:accessToken,refresh_token:refreshToken});
     if(error)throw error;
     router.replace('/license');
     return;
    }
    const code=parsed.searchParams.get('code');
    if(code){
     const {error}=await supabase.auth.exchangeCodeForSession(code);
     if(error)throw error;
     router.replace('/license');
    }
   }catch(e:any){setGoogleBusy(false);setError(e?.message??'Google sign-in could not be completed.');}
  };
  const subscription=Linking.addEventListener('url',({url})=>{void handleOAuthUrl(url)});
  void Linking.getInitialURL().then(url=>{if(url)void handleOAuthUrl(url)});
  return ()=>subscription.remove();
 },[router]);

 async function signInWithGoogle(){
  setError('');setNotice('');setGoogleBusy(true);
  try{
   const redirectTo=Platform.OS==='web'?window.location.origin:`smartvibe://google-auth`;
   const {data,error}=await supabase.auth.signInWithOAuth({
    provider:'google',
    options:{redirectTo,skipBrowserRedirect:Platform.OS!=='web',queryParams:{prompt:'select_account'}}
   });
   if(error)throw error;
   if(!data.url)throw new Error('Google sign-in URL was not returned.');
   if(Platform.OS!=='web')await Linking.openURL(data.url);
  }catch(e:any){setGoogleBusy(false);setError(e?.message??'Unable to start Google sign-in.');}
 }

 async function submit(){
  setError(''); setNotice('');
  if(!supabase)return setError('Supabase is not configured.');
  if(!email.trim())return setError('Enter your email address.');
  if(password.length<8)return setError('Password must be at least 8 characters.');
  setBusy(true);
  try{
   if(register){
    if(!username.trim())throw new Error('Enter a username.');
    const {data,error}=await supabase.auth.signUp({email:email.trim(),password,options:{data:{username:username.trim()}}});
    if(error)throw error;
    if(data.session){router.replace('/license');}
    else{setVerifyMode(true);setNotice('We sent a 6-digit verification code to your email. Enter that code here. No browser link is required.');}
   }else{
    const {error}=await supabase.auth.signInWithPassword({email:email.trim(),password});
    if(error)throw error;
    router.replace('/license');
   }
  }catch(e:any){setError(e?.message??'Authentication failed.')}finally{setBusy(false)}
 }

 async function verifyEmail(){
  setError(''); setNotice('');
  if(!supabase)return setError('Supabase is not configured.');
  const code=otp.trim().replace(/\s/g,'');
  if(!/^\d{6}$/.test(code))return setError('Enter the 6-digit code from your email.');
  setBusy(true);
  try{
   const {data,error}=await supabase.auth.verifyOtp({email:email.trim(),token:code,type:'email'});
   if(error)throw error;
   if(!data.session)throw new Error('Email verified, but a session was not returned. Please sign in.');
   setNotice('Email verified successfully.');router.replace('/license');
  }catch(e:any){setError(e?.message??'Unable to verify the email code.')}finally{setBusy(false)}
 }

 async function resendCode(){
  setError(''); setNotice('');
  if(!supabase)return setError('Supabase is not configured.');
  if(!email.trim()||password.length<8)return setError('Enter the same email and password you used during registration.');
  setBusy(true);
  try{
   const {error}=await supabase.auth.signUp({email:email.trim(),password,options:{data:{username:username.trim()}}});
   if(error)throw error;setNotice('A new 6-digit verification code has been sent.');
  }catch(e:any){setError(e?.message??'Unable to resend the verification code.')}finally{setBusy(false)}
 }

 async function sendReset(){
  setError('');setNotice('');if(!supabase)return setError('Supabase is not configured.');if(!email.trim())return setError('Enter your email address first.');setBusy(true);
  try{const redirectTo=Linking.createURL('reset-password');const {error}=await supabase.auth.resetPasswordForEmail(email.trim(),{redirectTo});if(error)throw error;setNotice('Password reset instructions have been sent.');}
  catch(e:any){setError(e?.message??'Unable to send password reset instructions.')}finally{setBusy(false)}
 }

 if(verifyMode)return <Screen><View style={{flex:1,justifyContent:'center'}}><View style={{alignItems:'center',marginBottom:14}}><SmartVibeLogo width={310} height={93}/></View><Text style={{fontSize:12,fontWeight:'900',color:C.cyan,letterSpacing:1.5,textAlign:'center'}}>EMAIL VERIFICATION</Text><Text style={{fontSize:34,lineHeight:40,fontWeight:'900',color:C.ink,marginTop:8,textAlign:'center'}}>Enter your code</Text><Text style={{color:C.muted,fontSize:15,lineHeight:22,marginTop:8,textAlign:'center'}}>Check {email.trim()} for your 6-digit SmartVibe verification code.</Text><Card><Text style={{fontWeight:'900',color:C.ink}}>Verification code</Text><TextInput value={otp} onChangeText={setOtp} autoCapitalize="none" keyboardType="number-pad" autoCorrect={false} maxLength={6} placeholder="123456" placeholderTextColor={C.muted} style={[input,{letterSpacing:6,fontSize:22,textAlign:'center'}]}/>{notice?<Text style={{color:C.green,marginTop:10,lineHeight:20}}>{notice}</Text>:null}{error?<Text style={{color:C.red,marginTop:10,lineHeight:20}}>{error}</Text>:null}</Card><Button title={busy?'Verifying…':'Verify email'} onPress={verifyEmail} disabled={busy}/><Button title="Resend code" variant="secondary" onPress={resendCode} disabled={busy}/><Button title="Back to registration" variant="secondary" onPress={()=>{setVerifyMode(false);setError('');setNotice('')}} disabled={busy}/></View></Screen>;
 if(resetMode)return <Screen><View style={{flex:1,justifyContent:'center'}}><View style={{alignItems:'center',marginBottom:14}}><SmartVibeLogo width={310} height={93}/></View><Text style={{fontSize:12,fontWeight:'900',color:C.cyan,letterSpacing:1.5,textAlign:'center'}}>ACCOUNT RECOVERY</Text><Text style={{fontSize:34,lineHeight:40,fontWeight:'900',color:C.ink,marginTop:8,textAlign:'center'}}>Reset password</Text><Text style={{color:C.muted,fontSize:15,lineHeight:22,marginTop:8,textAlign:'center'}}>Enter your account email and SmartVibe will send password reset instructions.</Text><Card><Text style={{fontWeight:'900',color:C.ink}}>Email</Text><TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoCorrect={false} placeholder="you@example.com" placeholderTextColor={C.muted} style={input}/>{notice?<Text style={{color:C.green,marginTop:10,lineHeight:20}}>{notice}</Text>:null}{error?<Text style={{color:C.red,marginTop:10,lineHeight:20}}>{error}</Text>:null}</Card><Button title={busy?'Sending…':'Send reset instructions'} onPress={sendReset} disabled={busy}/><Button title="Back to sign in" variant="secondary" onPress={()=>{setResetMode(false);setError('');setNotice('')}} disabled={busy}/></View></Screen>;
 return <Screen><View style={{flex:1,justifyContent:'center'}}><View style={{alignItems:'center',marginBottom:14}}><SmartVibeLogo width={310} height={93}/></View><Text style={{fontSize:12,fontWeight:'900',color:C.cyan,letterSpacing:1.5,textAlign:'center'}}>SECURE CLIENT ACCESS</Text><Text style={{fontSize:34,lineHeight:40,fontWeight:'900',color:C.ink,marginTop:8,textAlign:'center'}}>{register?'Create account':'Welcome back'}</Text><Text style={{color:C.muted,fontSize:15,lineHeight:22,marginTop:8,textAlign:'center'}}>{register?'Create your SmartVibe trading account.':'Sign in to continue to your SmartVibe trading workspace.'}</Text><Button title={googleBusy?'Opening Google…':'Continue with Google'} onPress={signInWithGoogle} disabled={busy||googleBusy}/><Text style={{textAlign:'center',color:C.muted,fontSize:13,marginVertical:10}}>or continue with email</Text>{register?<Card><Text style={{fontWeight:'900',color:C.ink}}>Username</Text><TextInput value={username} onChangeText={setUsername} autoCapitalize="none" autoCorrect={false} placeholder="Choose a username" placeholderTextColor={C.muted} style={input}/></Card>:null}<Card><Text style={{fontWeight:'900',color:C.ink}}>Email</Text><TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoCorrect={false} placeholder="you@example.com" placeholderTextColor={C.muted} style={input}/><Text style={{fontWeight:'900',marginTop:14,color:C.ink}}>Password</Text><TextInput value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoCorrect={false} placeholder="Minimum 8 characters" placeholderTextColor={C.muted} style={input}/>{error?<Text style={{color:C.red,marginTop:10,lineHeight:20}}>{error}</Text>:null}{notice?<Text style={{color:C.green,marginTop:10,lineHeight:20}}>{notice}</Text>:null}</Card><Button title={busy?'Please wait…':register?'Create account':'Sign in'} onPress={submit} disabled={busy||googleBusy}/>{!register?<Button title="Forgot password?" variant="secondary" onPress={()=>{setResetMode(true);setError('');setNotice('')}} disabled={busy||googleBusy}/>:null}<Button title={register?'I already have an account':'Create a new account'} variant="secondary" onPress={()=>{setError('');setNotice('');setRegister(!register)}} disabled={busy||googleBusy}/></View></Screen>
}
const input={borderWidth:1 as const,borderColor:C.border,borderRadius:14,padding:14,marginTop:8,fontSize:16,color:C.ink,backgroundColor:C.card};
