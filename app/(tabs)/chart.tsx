import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import Svg, { Polyline, Line } from 'react-native-svg';
import { Screen, Card, C } from '@/components/ui';
import { getMarketQuotes, type MarketQuote } from '@/lib/backend';
import { instruments } from '@/instruments';
import { useTrading } from '@/context/TradingContext';

const classes = ['Forex', 'Metals', 'Crypto', 'Indices', 'Deriv'] as const;

function LiveLineChart({ quote }: { quote: MarketQuote }) {
  const candles = (quote.candles ?? []).slice(-120);
  if (candles.length < 2) return <Text style={{ color: C.muted, marginTop: 12 }}>Live price received, but chart history is not available from the market provider yet.</Text>;
  const width = 760;
  const height = 260;
  const pad = 18;
  const values = candles.map((c) => c.close);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = candles.map((c, i) => {
    const x = pad + (i / (candles.length - 1)) * (width - pad * 2);
    const y = height - pad - ((c.close - min) / span) * (height - pad * 2);
    return `${x},${y}`;
  }).join(' ');
  return <View style={{ marginTop: 14, borderRadius: 14, overflow: 'hidden', backgroundColor: C.surface, borderWidth: 1, borderColor: C.border }}><Svg viewBox={`0 0 ${width} ${height}`} width="100%" height={260} preserveAspectRatio="none"><Line x1={pad} y1={height-pad} x2={width-pad} y2={height-pad} stroke={C.border} strokeWidth="1" /><Line x1={pad} y1={pad} x2={pad} y2={height-pad} stroke={C.border} strokeWidth="1" /><Polyline points={points} fill="none" stroke={C.cyan} strokeWidth="3" /></Svg></View>;
}

export default function Chart() {
  const { selectedInstrument, setSelectedInstrument } = useTrading();
  const [assetClass, setAssetClass] = useState<(typeof classes)[number]>(selectedInstrument.class);
  const [quote, setQuote] = useState<MarketQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const visible = instruments.filter((item) => item.class === assetClass).slice(0, 30);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { const result = await getMarketQuotes([selectedInstrument.symbol]); setQuote(result.quotes?.[0] ?? null); }
    catch (e: any) { setQuote(null); setError(e?.message ?? 'Unable to load live market data.'); }
    finally { setLoading(false); }
  }, [selectedInstrument.symbol]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { const timer = setInterval(load, 30000); return () => clearInterval(timer); }, [load]);

  return <Screen><ScrollView showsVerticalScrollIndicator={false}>
    <Text style={{ fontSize: 30, fontWeight: '900', color: C.ink }}>Live Chart</Text>
    <Text style={{ color: C.muted, marginTop: 4 }}>Real market-provider data. No demo or simulated candles.</Text>
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><View><Text style={{ fontWeight: '900', color:C.ink }}>Instrument</Text><Text style={{ fontSize: 24, fontWeight: '900', marginTop: 6, color:C.ink }}>{selectedInstrument.symbol}</Text></View>{quote ? <Text style={{ color: C.green, fontWeight: '900' }}>LIVE</Text> : null}</View>
      {loading ? <ActivityIndicator style={{ marginTop: 12 }} color={C.cyan} /> : quote ? <><Text style={{ fontSize: 28, fontWeight: '900', marginTop: 12, color:C.ink }}>{Number.isFinite(quote.price) ? quote.price.toLocaleString() : '—'}</Text><Text style={{ color: (quote.change ?? 0) >= 0 ? C.green : C.red, marginTop: 5 }}>{(quote.change ?? 0) >= 0 ? '+' : ''}{quote.change ?? 0}%</Text><LiveLineChart quote={quote}/><Text style={{ color: C.muted, fontSize: 12, marginTop: 8 }}>Source: {quote.source} • refreshed every 30 seconds</Text></> : null}
      {error ? <Text style={{ color: C.red, marginTop: 10 }}>{error}</Text> : null}
    </Card>
    <Text style={{ fontWeight: '900', fontSize: 18, marginBottom: 8, color:C.ink }}>Asset class</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>{classes.map((item) => <Pressable key={item} onPress={() => setAssetClass(item)} style={{ padding: 10, borderRadius: 12, borderWidth: 1, borderColor: item === assetClass ? C.blue : C.border, backgroundColor: item === assetClass ? C.blueSoft : C.card }}><Text style={{ fontWeight: '700', color:C.ink }}>{item}</Text></Pressable>)}</View>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{visible.map((item) => <Pressable key={item.symbol} onPress={() => setSelectedInstrument(item)} style={{ padding: 10, borderRadius: 12, borderWidth: 1, borderColor: item.symbol === selectedInstrument.symbol ? C.blue : C.border, backgroundColor: item.symbol === selectedInstrument.symbol ? C.blueSoft : C.card }}><Text style={{ fontWeight: '700', color:C.ink }}>{item.symbol}</Text></Pressable>)}</View>
  </ScrollView></Screen>;
}
