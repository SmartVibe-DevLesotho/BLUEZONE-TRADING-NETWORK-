import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Card, C } from '@/components/ui';
import { SmartVibeLogo } from '@/components/SmartVibeBrand';
import { AutomationRail } from '@/components/AutomationRail';
import { SubscriptionRail } from '@/components/SubscriptionRail';

const WHATSAPP_URL = 'https://wa.me/?text=Hello%20SmartVibe%20Trading%20Network.%20I%20would%20like%20to%20request%20an%20activation%20token%20for%20the%20app.';

export default function Welcome(){
  const router=useRouter();
  const openWhatsApp=async()=>{ try { await Linking.openURL(WHATSAPP_URL); } catch {} };
  return <Screen><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom:24}}>
    <View style={{alignItems:'center',paddingVertical:12}}><SmartVibeLogo width={310} height={93}/></View>
    <View style={{paddingVertical:4}}>
      <Text style={{color:C.green,fontSize:10,fontWeight:'900',letterSpacing:1.8,textAlign:'center'}}>SMARTVIBE TRADING NETWORK</Text>
      <Text style={{color:C.ink,fontSize:28,lineHeight:32,fontWeight:'900',textAlign:'center',marginTop:8}}>Live trading intelligence. Built for disciplined decisions.</Text>
      <Text style={{color:C.muted,fontSize:14,lineHeight:21,textAlign:'center',marginTop:9}}>Real-market monitoring, SmartVibe methodology, AI assistance, chart scanning and secure account access.</Text>
    </View>
    <AutomationRail/><SubscriptionRail/>

    <Card elevated>
      <Text style={{fontSize:22,fontWeight:'900',color:C.ink}}>Get started with SmartVibe</Text>
      <Text style={{color:C.muted,marginTop:7,lineHeight:20}}>Need access? Request your activation token through WhatsApp. Want guidance first? Ask the SmartVibe AI Assistant.</Text>
      <View style={{flexDirection:'row',gap:10,marginTop:18}}>
        <Pressable onPress={openWhatsApp} style={{flex:1,padding:15,borderRadius:14,backgroundColor:C.green,borderWidth:1,borderColor:C.green}}><Text style={{textAlign:'center',color:'#fff',fontWeight:'900',fontSize:15}}>WhatsApp</Text><Text style={{textAlign:'center',color:'#fff',fontSize:11,marginTop:3}}>Get activation token</Text></Pressable>
        <Pressable onPress={()=>router.push('/ai')} style={{flex:1,padding:15,borderRadius:14,backgroundColor:C.ink,borderWidth:1,borderColor:C.cyan}}><Text style={{textAlign:'center',color:'#fff',fontWeight:'900',fontSize:15}}>AI Assistant</Text><Text style={{textAlign:'center',color:'#fff',fontSize:11,marginTop:3}}>Ask & get guidance</Text></Pressable>
      </View>
    </Card>

    <Card>
      <Text style={{fontSize:19,fontWeight:'900',color:C.ink}}>Explore the application</Text>
      <Text style={{color:C.muted,marginTop:6,lineHeight:20}}>Use the preview below to test the complete interface before native release. Production access remains protected by authentication and an owner-issued token.</Text>
      <Pressable onPress={()=>router.push('/(tabs)/markets')} style={{marginTop:15,padding:16,borderRadius:14,backgroundColor:C.blue,borderWidth:1,borderColor:C.cyan}}><Text style={{textAlign:'center',color:'#fff',fontWeight:'900',fontSize:16}}>Explore Full App Preview</Text></Pressable>
      <Pressable onPress={()=>router.push('/auth')} style={{marginTop:10,padding:15,borderRadius:14,borderWidth:1,borderColor:C.border,backgroundColor:C.card}}><Text style={{textAlign:'center',color:C.ink,fontWeight:'900',fontSize:15}}>Client Portal / Activate Token</Text></Pressable>
      <Pressable onPress={()=>router.push('/admin')} style={{marginTop:10,padding:15,borderRadius:14,borderWidth:1,borderColor:C.border,backgroundColor:C.card}}><Text style={{textAlign:'center',color:C.ink,fontWeight:'900',fontSize:15}}>Administration Portal</Text></Pressable>
    </Card>
    <Text style={{color:C.muted,textAlign:'center',fontSize:11,marginTop:12}}>SmartVibe Computer Solutions</Text>
  </ScrollView></Screen>
}
