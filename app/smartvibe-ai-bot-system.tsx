import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { Screen, Card, C, Header, Badge } from '@/components/ui';
import { getMarketQuotes, type MarketCandle } from '@/lib/backend';
import { instruments } from '@/instruments';
import { useTrading } from '@/context/TradingContext';

const EMA_LENGTHS = [5, 11, 15, 18, 21, 24, 28, 34, 200] as const;
const classes = ['Forex', 'Metals', 'Crypto', 'Indices', 'Deriv'] as const;

function ema(values: number[], length: number) {
  if (!values.length) return null;
  const k = 2 / (length + 1);
  let result = values[0];
  for (let i = 1; i < values.length; i += 1) result = values[i] * k + result * (1 - k);
  return result;
}

function Choice({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={{ paddingVertical: 9, paddingHorizontal: 11, borderRadius: 12, borderWidth: 1, borderColor: active ? C.blue : C.border, backgroundColor: active ? C.blueSoft : C.surface }}><Text style={{ fontWeight: '800', color: active ? C.blue : C.ink }}>{label}</Text></Pressable>;
}

export default function SmartVibeAIBotSystem() {
  const { selectedInstrument, setSelectedInstrument } = useTrading();
  const [assetClass, setAssetClass] = useState<(typeof classes)[number]>(selectedInstrument.class);
  const [candles, setCandles] = useState<MarketCandle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const result = await getMarketQuotes([selectedInstrument.symbol]);
      const quote = result.quotes?.[0];
      setCandles((quote?.candles ?? []).slice(-300));
      if (!quote) setError('Live market data did not return this instrument.');
    } catch (e: any) {
      setCandles([]); setError(e?.message ?? 'Unable to load the live market data.');
    } finally { setLoading(false); }
  }, [selectedInstrument.symbol]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setAssetClass(selectedInstrument.class); }, [selectedInstrument.class]);

  const values = useMemo(() => candles.map((c) => c.close).filter((v) => Number.isFinite(v)), [candles]);
  const current = values.at(-1) ?? null;
  const ema11 = ema(values, 11);
  const ema34 = ema(values, 34);
  const ema200 = ema(values, 200);
  const previous = values.slice(0, -1);
  const prev11 = ema(previous, 11);
  const prev34 = ema(previous, 34);
  const buy = ema11 !== null && ema34 !== null && prev11 !== null && prev34 !== null && prev11 <= prev34 && ema11 > ema34;
  const sell = ema11 !== null && ema34 !== null && prev11 !== null && prev34 !== null && prev11 >= prev34 && ema11 < ema34;
  const trend = ema11 !== null && ema34 !== null ? (ema11 > ema34 ? 'SMARTVIBE BULLISH' : 'SMARTVIBE BEARISH') : 'WAIT';
  const status = buy ? 'SMARTVIBE BUY' : sell ? 'SMARTVIBE SELL' : 'WAIT';
  const visible = instruments.filter((item) => item.class === assetClass).slice(0, 30);

  return <Screen><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }}>
    <Header title="SMARTVIBE AI-BOT SYSTEM" subtitle="Standalone SmartVibe indicator • independent from SmartVibe AI Chart Scanner" right={<Badge label="PREMIUM PRO" tone="positive" />} />
    <Card elevated>
      <Text style={{ fontWeight: '900', fontSize: 21, color: C.ink }}>SMARTVIBE AI-BOT SYSTEM</Text>
      <Text style={{ color: C.muted, marginTop: 7, lineHeight: 21 }}>A standalone EMA trend indicator based on the supplied open-source EMA Trend System. It is a separate signal source from the SmartVibe AI Chart Scanner.</Text>
      <Text style={{ color: C.muted, marginTop: 8, lineHeight: 21 }}>This indicator provides technical evidence only. SmartVibe Primary Methodology remains the final authority before any live trading decision.</Text>
    </Card>

    <Card>
      <Text style={{ fontWeight: '900', color: C.ink }}>Live instrument</Text>
      <Text style={{ fontSize: 25, fontWeight: '900', color: C.ink, marginTop: 6 }}>{selectedInstrument.symbol}</Text>
      {loading ? <ActivityIndicator style={{ marginTop: 16 }} color={C.cyan} /> : <>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 }}><Text style={{ color: C.muted }}>Price</Text><Text style={{ fontWeight: '900', color: C.ink }}>{current ?? '—'}</Text></View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 9 }}><Text style={{ color: C.muted }}>EMA 11 / 34</Text><Text style={{ fontWeight: '900', color: ema11 !== null && ema34 !== null && ema11 > ema34 ? C.green : C.red }}>{trend}</Text></View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 9 }}><Text style={{ color: C.muted }}>EMA 200</Text><Text style={{ fontWeight: '900', color: C.ink }}>{ema200 ?? '—'}</Text></View>
        <View style={{ marginTop: 16, padding: 16, borderRadius: 14, backgroundColor: buy ? '#0b7a3b' : sell ? '#9f1d1d' : C.surface }}><Text style={{ textAlign: 'center', color: buy || sell ? '#fff' : C.ink, fontSize: 24, fontWeight: '900' }}>{status}</Text><Text style={{ textAlign: 'center', color: buy || sell ? '#fff' : C.muted, marginTop: 5 }}>Confirmed bar-cross condition only</Text></View>
      </>}
      {error ? <Text style={{ color: C.red, marginTop: 12 }}>{error}</Text> : null}
    </Card>

    <Card>
      <Text style={{ fontWeight: '900', fontSize: 18, color: C.ink }}>Asset class</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 9 }}>{classes.map((item) => <Choice key={item} label={item} active={item === assetClass} onPress={() => setAssetClass(item)} />)}</View>
      <Text style={{ fontWeight: '900', fontSize: 18, color: C.ink, marginTop: 17 }}>Instrument</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 9 }}>{visible.map((item) => <Choice key={item.symbol} label={item.symbol} active={item.symbol === selectedInstrument.symbol} onPress={() => setSelectedInstrument(item)} />)}</View>
    </Card>

    <Card>
      <Text style={{ fontWeight: '900', color: C.ink }}>Indicator stack</Text>
      <Text style={{ color: C.muted, marginTop: 7, lineHeight: 21 }}>EMA 5 • 11 • 15 • 18 • 21 • 24 • 28 • 34 • 200</Text>
      <Text style={{ color: C.muted, marginTop: 7, lineHeight: 21 }}>The full Pine source is stored with the project as the standalone SMARTVIBE AI-BOT SYSTEM indicator, including ATR-based trade levels, screener and alerts.</Text>
    </Card>
  </ScrollView></Screen>;
}
