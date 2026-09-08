import { ScrollView, Text, View } from 'react-native';
import { Screen, Card, C, Header, Badge } from '@/components/ui';

const sellRules = [
  'Check Daily or 4H timeframe to confirm direction.',
  "Check where we break V's (lows).",
  'Look for FVG or Order Block to enter.',
  'Profit target is the closest low.',
];

const buyRules = [
  'Check Daily or 4H timeframe to confirm direction.',
  "Check where we break A's (highs).",
  'Look for FVG or Order Block to enter.',
  'Profit target is the closest high.',
];

function RuleCard({ title, rules, tone }: { title: string; rules: string[]; tone: 'positive' | 'negative' }) {
  return <Card elevated>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
      <Text style={{ fontSize: 20, fontWeight: '900', color: C.ink }}>{title}</Text>
      <Badge label={title === 'BUY' ? 'A • HIGH' : 'V • LOW'} tone={tone} />
    </View>
    {rules.map((rule, index) => <View key={rule} style={{ flexDirection: 'row', gap: 10, paddingVertical: 8 }}>
      <Text style={{ width: 24, height: 24, textAlign: 'center', paddingTop: 3, borderRadius: 12, backgroundColor: tone === 'positive' ? C.greenSoft : C.redSoft, color: tone === 'positive' ? C.green : C.red, fontWeight: '900' }}>{index + 1}</Text>
      <Text style={{ flex: 1, color: C.slate, lineHeight: 21 }}>{rule}</Text>
    </View>)}
  </Card>;
}

export default function Education() {
  return <Screen><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }}>
    <Header title="SmartVibe Pro Premium" subtitle="A & V methodology" right={<Badge label="PREMIUM" tone="blue" />} />
    <Card>
      <Text style={{ fontSize: 17, fontWeight: '900', color: C.ink }}>A & V setup framework</Text>
      <Text style={{ color: C.muted, marginTop: 7, lineHeight: 21 }}>Use higher-timeframe direction first, then confirm the A or V liquidity break before selecting an FVG or Order Block entry.</Text>
    </Card>
    <RuleCard title="BUY" rules={buyRules} tone="positive" />
    <RuleCard title="SELL" rules={sellRules} tone="negative" />
    <Card>
      <Text style={{ fontWeight: '900', color: C.ink }}>Execution note</Text>
      <Text style={{ color: C.muted, marginTop: 6, lineHeight: 20 }}>This is an educational methodology reference. It does not create simulated trades or guarantee outcomes.</Text>
    </Card>
  </ScrollView></Screen>;
}
