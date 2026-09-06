import { Text } from 'react-native';
import { Screen, Card, C } from '@/components/ui';
import { useTrading } from '@/context/TradingContext';

export default function AutoTrade() {
  const { consensusThreshold, selectedSession, selectedStyle } = useTrading();
  return <Screen><Text style={{fontSize:30,fontWeight:'900',color:C.midnight}}>AutoTrade</Text><Text style={{color:C.muted,marginTop:4}}>Consensus signal workspace.</Text><Card><Text style={{fontWeight:'900'}}>Signal engine</Text><Text style={{marginTop:8}}>Threshold: {consensusThreshold}/8</Text><Text style={{marginTop:4}}>Session: {selectedSession}</Text><Text style={{marginTop:4}}>Style: {selectedStyle}</Text><Text style={{color:C.muted,marginTop:10,lineHeight:21}}>Signals are requested from the secured consensus-signals backend. This screen does not place broker orders.</Text></Card></Screen>;
}
