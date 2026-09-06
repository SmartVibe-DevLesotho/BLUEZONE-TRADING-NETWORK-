import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import { Screen, Card, C, Header, Badge, LoadingState } from '@/components/ui';
import { getMarketQuotes, type MarketQuote } from '@/lib/backend';
import { instruments } from '@/instruments';

export default function Markets() {
  const [quotes, setQuotes] = useState<MarketQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const result = await getMarketQuotes(instruments.map((item) => item.symbol));
      setQuotes(result.quotes ?? []);
    } catch (e: any) {
      setError(e?.message ?? 'Unable to load live market data.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return <Screen>
    <Header title="Markets" subtitle="Real-time instruments and market conditions." right={<Badge label="LIVE" tone="positive" />} />
    {loading && quotes.length === 0 ? <LoadingState label="Connecting to markets…" /> : null}
    {error ? <Card><Text style={{ color: C.red, fontWeight: '700' }}>{error}</Text></Card> : null}
    <FlatList
      data={quotes}
      keyExtractor={(item) => item.symbol}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      contentContainerStyle={{ paddingBottom: 28 }}
      renderItem={({ item }) => <Card elevated>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View><Text style={{ fontWeight: '900', fontSize: 17, color: C.ink }}>{item.symbol}</Text><Text style={{ color: C.muted, marginTop: 3 }}>{item.source}</Text></View>
          <View style={{ alignItems: 'flex-end' }}><Text style={{ fontWeight: '900', fontSize: 18, color: C.ink }}>{Number.isFinite(item.price) ? item.price.toLocaleString() : '—'}</Text><Text style={{ color: item.change >= 0 ? C.green : C.red, fontWeight: '800', marginTop: 4 }}>{item.change >= 0 ? '+' : ''}{item.change}%</Text></View>
        </View>
      </Card>}
      ListEmptyComponent={!loading && !error ? <Text style={{ color: C.muted, textAlign: 'center', paddingTop: 30 }}>No live quotes are available right now.</Text> : null}
    />
  </Screen>;
}
