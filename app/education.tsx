import { ScrollView, Text, View } from 'react-native';
import { Screen, Card, C, Header, Badge } from '@/components/ui';

const sellRules = [
  'Establish the higher-timeframe bearish direction.',
  'Confirm the structural context and liquidity interaction.',
  'Wait for the bearish engulfing confirmation zone and lower-timeframe confirmation.',
  'Place the stop beyond the invalidating structure.',
  'Manage the position through structural continuation rather than an artificial profit cap.',
];

const buyRules = [
  'Establish the higher-timeframe bullish direction.',
  'Confirm the structural context and liquidity interaction.',
  'Wait for the bullish engulfing confirmation zone and lower-timeframe confirmation.',
  'Place the stop beyond the invalidating structure.',
  'Manage the position through structural continuation rather than an artificial profit cap.',
];

function RuleCard({ title, rules, tone }: { title: string; rules: string[]; tone: 'positive' | 'negative' }) {
  return <Card elevated>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
      <Text style={{ fontSize: 20, fontWeight: '900', color: C.ink }}>{title}</Text>
      <Badge label={title} tone={tone} />
    </View>
    {rules.map((rule, index) => <View key={rule} style={{ flexDirection: 'row', gap: 10, paddingVertical: 8 }}>
      <Text style={{ width: 24, height: 24, textAlign: 'center', paddingTop: 3, borderRadius: 12, backgroundColor: tone === 'positive' ? C.greenSoft : C.redSoft, color: tone === 'positive' ? C.green : C.red, fontWeight: '900' }}>{index + 1}</Text>
      <Text style={{ flex: 1, color: C.slate, lineHeight: 21 }}>{rule}</Text>
    </View>)}
  </Card>;
}

export default function Education() {
  return <Screen><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }}>
    <Header title="SmartVibe Trading Network" subtitle="Core methodology and execution framework" right={<Badge label="PREMIUM" tone="blue" />} />
    <Card>
      <Text style={{ fontSize: 18, fontWeight: '900', color: C.ink }}>The SmartVibe methodology</Text>
      <Text style={{ color: C.muted, marginTop: 7, lineHeight: 21 }}>SmartVibe Trading Network uses one canonical methodology for every BUY and SELL signal. Market structure, liquidity, support and resistance, role-reversal context, trendlines, engulfing confirmation, and lower-timeframe price action are combined internally as confirmation layers.</Text>
    </Card>
    <RuleCard title="BUY" rules={buyRules} tone="positive" />
    <RuleCard title="SELL" rules={sellRules} tone="negative" />
    <Card>
      <Text style={{ fontWeight: '900', color: C.ink }}>Continuation management</Text>
      <Text style={{ color: C.muted, marginTop: 6, lineHeight: 20 }}>A strong move is not automatically closed at a fixed pip amount. Reaching a major profit milestone is a management event; the position can continue while the SmartVibe structural conditions remain valid and closes on methodology-based invalidation or exit.</Text>
    </Card>
    <Card>
      <Text style={{ fontWeight: '900', color: C.ink }}>Execution note</Text>
      <Text style={{ color: C.muted, marginTop: 6, lineHeight: 20 }}>SmartVibe signals are methodology-based analysis. No performance outcome is guaranteed, and the app must not present fabricated market prices or results.</Text>
    </Card>
  </ScrollView></Screen>;
}
