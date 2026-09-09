import { ScrollView, Text, View } from 'react-native';
import { Screen, Card, C, Header, Badge } from '@/components/ui';

const sessions = [
  ['Sydney', '22:00–07:00 UTC', '00:00–09:00 SAST*'],
  ['Tokyo', '00:00–09:00 UTC', '02:00–11:00 SAST'],
  ['London', '08:00–17:00 UTC', '10:00–19:00 SAST*'],
  ['New York', '13:00–22:00 UTC', '15:00–00:00 SAST*'],
];

export default function Sessions() {
  return <Screen><ScrollView showsVerticalScrollIndicator={false}>
    <Header title="Sessions" subtitle="Global forex session windows with SAST reference." right={<Badge label="SAST • UTC+2" tone="blue" />} />
    <Card elevated><Text style={{ fontWeight: '900', fontSize: 18, color: C.ink }}>Session context</Text><Text style={{ color: C.muted, marginTop: 6, lineHeight: 20 }}>Use the session selector in Signals to align consensus analysis with the trading window you are monitoring. SAST is the local reference timezone for SmartVibe session analysis.</Text></Card>
    {sessions.map(([name, utc, sast]) => <Card key={name}><View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><Text style={{ fontSize: 18, fontWeight: '900', color: C.ink }}>{name}</Text><View style={{ alignItems: 'flex-end' }}><Text style={{ color: C.slate, fontWeight: '700' }}>{sast}</Text><Text style={{ color: C.muted, fontSize: 11, marginTop: 3 }}>{utc}</Text></View></View></Card>)}
    <Text style={{ color: C.muted, fontSize: 12, lineHeight: 18, marginVertical: 14 }}>*Sydney, London and New York session clocks can shift with daylight-saving conventions. SAST remains UTC+2 year-round; use the displayed UTC window as the stable reference and confirm the broker/session clock when precision matters.</Text>
  </ScrollView></Screen>;
}
