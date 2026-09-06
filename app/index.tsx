import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

export default function Index(){
 const [target,setTarget]=useState<string | null>(null);
 useEffect(()=>{(async()=>{const license=await SecureStore.getItemAsync('bluezone_license_active'); const risk=await SecureStore.getItemAsync('bluezone_risk_accepted'); setTarget(license!=='1'?'/license':risk!=='1'?'/onboarding/risk':'/auth');})().catch(()=>setTarget('/license'));},[]);
 return target?<Redirect href={target as any}/>:null;
}
