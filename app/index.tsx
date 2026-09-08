import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Redirect } from 'expo-router';

export default function Index(){
 const [target,setTarget]=useState<string | null>(null);
 useEffect(()=>{(async()=>{const license=await SecureStore.getItemAsync('smartvibe_license_active'); const risk=await SecureStore.getItemAsync('smartvibe_risk_accepted'); setTarget(license!=='1'?'/license':risk!=='1'?'/risk':'/auth');})().catch(()=>setTarget('/license'));},[]);
 return target?<Redirect href={target as any}/>:null;
}
