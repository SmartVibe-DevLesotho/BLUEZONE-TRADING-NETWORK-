import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { Screen, Card, C } from '@/components/ui';
import { getMarketQuotes, type MarketQuote } from '@/lib/backend';
import { instruments } from '@/instruments';
import { useTrading } from '@/context/TradingContext';

const classes = ['Forex', 'Metals', 'Crypto', 'Indices', 'Deriv'] as const;

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
    catch (e: any) { setQuote(null); setError(e?.message ?? 'Unable to load live quote.'); }
    finally { setLoading(false); }
  }, [selectedInstrument.symbol]);
  useEffect(() => { load(); }, [load]);

  return <Screen><ScrollView showsVerticalScrollIndicator={false}>
    <Text style={{ fontSize: 30, fontWeight: '900', color: C.ink }}>Chart</Text>
    <Text style={{ color: C.muted, marginTop: 4 }}>Live market context for analysis.</Text>
    <Card><Text style={{ fontWeight: '900', color:C.ink }}>Instrument</Text><Text style={{ fontSize: 24, fontWeight: '900', marginTop: 6, color:C.ink }}>{selectedInstrument.symbol}</Text>
      {loading ? <ActivityIndicator style={{ marginTop: 12 }} color={C.cyan} /> : quote ? <><Text style={{ fontSize: 28, fontWeight: '900', marginTop: 12, color:C.ink }}>{Number.isFinite(quote.price) ? quote.price.toLocaleString() : '—'}</Text><Text style={{ color: quote.change >= 0 ? C.green : C.red, marginTop: 5 }}>{quote.change >= 0 ? '+' : ''}{quote.change}% {quote.stale ? '• stale' : ''}</Text></> : null}
      {error ? <Text style={{ color: C.red, marginTop: 10 }}>{error}</Text> : null}
    </Card>
    <Text style={{ fontWeight: '900', fontSize: 18, marginBottom: 8, color:C.ink }}>Asset class</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>{classes.map((item) => <Pressable key={item} onPress={() => setAssetClass(item)} style={{ padding: 10, borderRadius: 12, borderWidth: 1, borderColor: item === assetClass ? C.blue : C.border, backgroundColor: item === assetClass ? C.blueSoft : C.card }}><Text style={{ fontWeight: '700', color:C.ink }}>{item}</Text></Pressable>)}</View>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{visible.map((item) => <Pressable key={item.symbol} onPress={() => setSelectedInstrument(item)} style={{ padding: 10, borderRadius: 12, borderWidth: 1, borderColor: item.symbol === selectedInstrument.symbol ? C.blue : C.border, backgroundColor: item.symbol === selectedInstrument.symbol ? C.blueSoft : C.card }}><Text style={{ fontWeight: '700', color:C.ink }}>{item.symbol}</Text></Pressable>)}</View>
  </ScrollView></Screen>;
}
