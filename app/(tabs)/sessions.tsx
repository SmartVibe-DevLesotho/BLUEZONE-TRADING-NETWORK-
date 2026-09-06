import { ScrollView, Text, View } from 'react-native';
import { Screen, Card, C, Header, Badge } from '@/components/ui';

const sessions = [
  ['Sydney', '22:00–07:00 UTC'],
  ['Tokyo', '00:00–09:00 UTC'],
  ['London', '08:00–17:00 UTC'],
  ['New York', '13:00–22:00 UTC'],
];

export default function Sessions() {
  return <Screen><ScrollView showsVerticalScrollIndicator={false}>
    <Header title="Sessions" subtitle="Global forex session windows referenced in UTC." right={<Badge label="UTC" tone="blue" />} />
    <Card elevated><Text style={{ fontWeight: '900', fontSize: 18 }}>Session context</Text><Text style={{ color: C.muted, marginTop: 6, lineHeight: 20 }}>Use the session selector in Signals to align consensus analysis with the trading window you are monitoring.</Text></Card>
    {sessions.map(([name, time]) => <Card key={name}><View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><Text style={{ fontSize: 18, fontWeight: '900', color: C.ink }}>{name}</Text><Text style={{ color: C.slate, fontWeight: '700' }}>{time}</Text></View></Card>)}
    <Text style={{ color: C.muted, fontSize: 12, lineHeight: 18, marginVertical: 14 }}>Session boundaries are reference windows; market conditions and daylight-saving conventions can affect practical overlap.</Text>
  </ScrollView></Screen>;
}
