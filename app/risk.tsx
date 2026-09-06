import { useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Button, Card, Screen, C } from '@/components/ui';

export default function Risk() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function accept() {
    setBusy(true);
    try { await SecureStore.setItemAsync('bluezone_risk_accepted', '1'); router.replace('/auth'); }
    finally { setBusy(false); }
  }
  return <Screen><View style={{ flex: 1, justifyContent: 'center' }}><Text style={{ fontSize: 13, fontWeight: '900', color: C.blue, letterSpacing: 1 }}>BLUEZONE TRADING NETWORK</Text><Text style={{ fontSize: 38, fontWeight: '900', color: C.midnight, marginTop: 8 }}>Trading risk notice</Text><Card><Text style={{ fontWeight: '900', fontSize: 18 }}>Important</Text><Text style={{ color: C.muted, marginTop: 10, lineHeight: 23 }}>BlueZone provides market information, analysis and trading tools. Trading leveraged financial products can result in substantial losses. Signals are informational and are not financial advice. Paper trading is simulated and does not represent guaranteed results.</Text></Card><Button title={busy ? 'Saving…' : 'I understand the risks'} onPress={accept} /></View></Screen>;
}
