import { ScrollView, Text, View } from 'react-native';
import { Screen, Card, C, Header, Badge } from '@/components/ui';

const items = [
  ['Education', 'Trading concepts, risk management and BlueZone methodology.'],
  ['Broker information', 'Review broker information before connecting any external trading account.'],
  ['Support', 'Provider credentials and operational secrets remain server-side.'],
];

export default function More() {
  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Header title="More" subtitle="Tools, education and account resources." />
        <Card elevated>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontWeight: '900', fontSize: 19, color: C.ink }}>BlueZone Trading Network</Text>
            <Badge label="LIVE" tone="positive" />
          </View>
          <Text style={{ color: C.muted, marginTop: 9, lineHeight: 22 }}>
            Real-market monitoring, consensus analysis, trading education and broker connectivity. Market values and signals must come from live providers; BlueZone does not manufacture prices or trading results.
          </Text>
        </Card>
        {items.map(([title, detail]) => (
          <View key={title} style={{ paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.border }}>
            <Text style={{ fontWeight: '900', fontSize: 16, color: C.ink }}>{title}</Text>
            <Text style={{ color: C.muted, marginTop: 5, lineHeight: 20 }}>{detail}</Text>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}
