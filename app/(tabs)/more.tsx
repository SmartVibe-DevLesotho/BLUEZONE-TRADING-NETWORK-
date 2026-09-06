import { Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen, Card, C } from '@/components/ui';

const items = [
  ['Education', 'Trading concepts, risk management and BlueZone methodology.'],
  ['Broker information', 'Review broker information before connecting any external trading account.'],
  ['Paper trading', 'Use the in-app simulation flow without sending broker orders.'],
  ['Support', 'Keep provider credentials and operational secrets server-side.'],
];

export default function More() {
  return <Screen><ScrollView showsVerticalScrollIndicator={false}><Text style={{fontSize:30,fontWeight:'900',color:C.midnight}}>More</Text><Text style={{color:C.muted,marginTop:4}}>Tools and account resources.</Text><Card><Text style={{fontWeight:'900',fontSize:19}}>BlueZone Trading Network</Text><Text style={{color:C.muted,marginTop:8,lineHeight:22}}>A trading companion for market monitoring, consensus analysis, education and paper trading. BlueZone does not promise profits.</Text></Card>{items.map(([title,detail])=><Pressable key={title} onPress={() => title === 'Paper trading' ? router.push('/(tabs)/autotrade') : undefined}><View style={{paddingVertical:14,borderBottomWidth:1,borderBottomColor:C.border}}><Text style={{fontWeight:'900',fontSize:16}}>{title}</Text><Text style={{color:C.muted,marginTop:5,lineHeight:20}}>{detail}</Text></View></Pressable>)}</ScrollView></Screen>;
}
