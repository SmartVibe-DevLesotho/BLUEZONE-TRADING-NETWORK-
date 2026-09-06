import { Text } from 'react-native';
import { Screen, Card, C } from '@/components/ui';

export default function Chart() {
  return <Screen><Text style={{fontSize:30,fontWeight:'900',color:C.midnight}}>Chart</Text><Card><Text style={{fontWeight:'900',fontSize:18}}>Chart workspace</Text><Text style={{color:C.muted,marginTop:8,lineHeight:21}}>Select an instrument from Markets and use the live market-data service as the source for chart analysis. No synthetic price series are presented as live data.</Text></Card></Screen>;
}
