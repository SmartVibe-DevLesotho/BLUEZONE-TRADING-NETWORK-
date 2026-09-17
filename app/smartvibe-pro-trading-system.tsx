import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { Screen, Card, C, Header, Badge } from '@/components/ui';
import { getMarketQuotes, type MarketCandle } from '@/lib/backend';
import { instruments } from '@/instruments';
import { useTrading } from '@/context/TradingContext';

const classes = ['Forex', 'Metals', 'Crypto', 'Indices', 'Deriv'] as const;

function Choice({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={{ paddingVertical: 9, paddingHorizontal: 11, borderRadius: 12, borderWidth: 1, borderColor: active ? C.blue : C.border, backgroundColor: active ? C.blueSoft : C.surface }}><Text style={{ fontWeight: '800', color: active ? C.blue : C.ink }}>{label}</Text></Pressable>;
}

export default function SmartVibeProTradingSystem() {
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
  const highs = useMemo(() => candles.map((c) => c.high).filter((v) => Number.isFinite(v)), [candles]);
  const lows = useMemo(() => candles.map((c) => c.low).filter((v) => Number.isFinite(v)), [candles]);
  const current = values.length ? values[values.length - 1] : null;
  const recentHigh = highs.length ? Math.max(...highs.slice(0, -1)) : null;
  const recentLow = lows.length ? Math.min(...lows.slice(0, -1)) : null;
  const lastHigh = highs.length ? highs[highs.length - 1] : null;
  const lastLow = lows.length ? lows[lows.length - 1] : null;
  const lastClose = current;
  const bullSweep = lastLow !== null && recentLow !== null && lastLow < recentLow && lastClose !== null && lastClose > recentLow;
  const bearSweep = lastHigh !== null && recentHigh !== null && lastHigh > recentHigh && lastClose !== null && lastClose < recentHigh;
  const status = bullSweep ? 'SMARTVIBE BUY EVIDENCE' : bearSweep ? 'SMARTVIBE SELL EVIDENCE' : 'WAIT';
  const visible = instruments.filter((item) => item.class === assetClass).slice(0, 30);

  return <Screen><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }}>
    <Header title="SMARTVIBE PRO TRADING SYSTEM" subtitle="Standalone SmartVibe technical system • independent signal source" right={<Badge label="PREMIUM PRO" tone="positive" />} />
    <Card elevated>
      <Text style={{ fontWeight: '900', fontSize: 21, color: C.ink }}>SMARTVIBE PRO TRADING SYSTEM</Text>
      <Text style={{ color: C.muted, marginTop: 7, lineHeight: 21 }}>A standalone SmartVibe system for key levels, session structure, liquidity sweeps, inside-day evidence, first red/green day structure and three-day confirmation.</Text>
      <Text style={{ color: C.muted, marginTop: 8, lineHeight: 21 }}>This is an independent technical evidence source. SmartVibe Primary Methodology remains the final authority before any live trading decision.</Text>
    </Card>

    <Card>
      <Text style={{ fontWeight: '900', color: C.ink }}>Live instrument</Text>
      <Text style={{ fontSize: 25, fontWeight: '900', color: C.ink, marginTop: 6 }}>{selectedInstrument.symbol}</Text>
      {loading ? <ActivityIndicator style={{ marginTop: 16 }} color={C.cyan} /> : <>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 }}><Text style={{ color: C.muted }}>Price</Text><Text style={{ fontWeight: '900', color: C.ink }}>{current ?? '—'}</Text></View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 9 }}><Text style={{ color: C.muted }}>Previous range high</Text><Text style={{ fontWeight: '900', color: C.ink }}>{recentHigh ?? '—'}</Text></View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 9 }}><Text style={{ color: C.muted }}>Previous range low</Text><Text style={{ fontWeight: '900', color: C.ink }}>{recentLow ?? '—'}</Text></View>
        <View style={{ marginTop: 16, padding: 16, borderRadius: 14, backgroundColor: bullSweep ? '#0b7a3b' : bearSweep ? '#9f1d1d' : C.surface }}><Text style={{ textAlign: 'center', color: bullSweep || bearSweep ? '#fff' : C.ink, fontSize: 21, fontWeight: '900' }}>{status}</Text><Text style={{ textAlign: 'center', color: bullSweep || bearSweep ? '#fff' : C.muted, marginTop: 5 }}>Live candle evidence • confirmed on returned market data</Text></View>
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
      <Text style={{ fontWeight: '900', color: C.ink }}>SMARTVIBE PRO evidence stack</Text>
      <Text style={{ color: C.muted, marginTop: 7, lineHeight: 21 }}>Previous Day High/Low • Previous Week High/Low • Monday Opening Range • Asia • London • New York • Liquidity Sweep • Inside Day • First Red/Green Day • 3 Day Setup • Volume Confirmation</Text>
      <Text style={{ color: C.muted, marginTop: 8, lineHeight: 21 }}>The full Pine source is stored in the project as the standalone SMARTVIBE PRO TRADING SYSTEM indicator.</Text>
    </Card>
  </ScrollView></Screen>;
}
