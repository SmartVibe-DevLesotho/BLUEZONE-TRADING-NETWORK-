import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from 'react-native';
import { Screen, Card, C } from '@/components/ui';
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
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <Screen>
      <Text style={{ fontSize: 30, fontWeight: '900', color: C.midnight }}>Markets</Text>
      <Text style={{ color: C.muted, marginTop: 4, marginBottom: 12 }}>Live prices from the BlueZone market-data service.</Text>
      {loading ? <ActivityIndicator /> : null}
      {error ? <Card><Text style={{ color: C.red, fontWeight: '700' }}>{error}</Text></Card> : null}
      <FlatList
        data={quotes}
        keyExtractor={(item) => item.symbol}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        renderItem={({ item }) => (
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontWeight: '900', fontSize: 17, color: C.midnight }}>{item.symbol}</Text>
              <Text style={{ fontWeight: '800' }}>{Number.isFinite(item.price) ? item.price.toLocaleString() : '—'}</Text>
            </View>
            <Text style={{ color: item.change >= 0 ? '#15803D' : C.red, marginTop: 6 }}>
              {item.change >= 0 ? '+' : ''}{item.change}% {item.stale ? '• stale' : ''}
            </Text>
          </Card>
        )}
        ListEmptyComponent={!loading && !error ? <Text style={{ color: C.muted }}>No live quotes are available right now.</Text> : null}
      />
    </Screen>
  );
}
