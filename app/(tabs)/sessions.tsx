import { Text, View } from 'react-native';
import { Screen, Card, C } from '@/components/ui';

const sessions = [
  ['Sydney', '22:00–07:00 UTC'],
  ['Tokyo', '00:00–09:00 UTC'],
  ['London', '08:00–17:00 UTC'],
  ['New York', '13:00–22:00 UTC'],
];

export default function Sessions() {
  return <Screen><Text style={{ fontSize:30,fontWeight:'900',color:C.midnight }}>Sessions</Text><Text style={{ color:C.muted,marginTop:4 }}>Global forex sessions. Times are UTC.</Text>{sessions.map(([name,time])=><Card key={name}><View style={{flexDirection:'row',justifyContent:'space-between'}}><Text style={{fontSize:17,fontWeight:'900'}}>{name}</Text><Text style={{color:C.muted}}>{time}</Text></View></Card>)}</Screen>;
}
