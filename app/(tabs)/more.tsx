import { Text } from 'react-native';
import { Screen, Card, C } from '@/components/ui';

export default function More() {
  return <Screen><Text style={{fontSize:30,fontWeight:'900',color:C.midnight}}>More</Text><Card><Text style={{fontWeight:'900',fontSize:18}}>BlueZone Trading Network</Text><Text style={{color:C.muted,marginTop:8,lineHeight:22}}>Trading education, broker information, account settings and support belong here. Provider credentials remain server-side and are never embedded in the mobile client.</Text></Card></Screen>;
}
