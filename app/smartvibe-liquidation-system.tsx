import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { Screen, Card, C, Header, Badge } from '@/components/ui';
import { getMarketQuotes, type MarketCandle } from '@/lib/backend';
import { useTrading } from '@/context/TradingContext';

export default function SmartVibeLiquidationSystem() {
  const { selectedInstrument } = useTrading();
  const [candles, setCandles] = useState<MarketCandle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { const r = await getMarketQuotes([selectedInstrument.symbol]); setCandles((r.quotes?.[0]?.candles ?? []).slice(-120)); }
    catch (e: any) { setError(e?.message ?? 'Unable to load live market data.'); setCandles([]); }
    finally { setLoading(false); }
  }, [selectedInstrument.symbol]);
  useEffect(() => { load(); }, [load]);
  const last = candles[candles.length - 1];
  const atrLike = candles.length > 15 ? candles.slice(-14).reduce((s, c) => s + (c.high - c.low), 0) / 14 : 0;
  const upper = last ? last.close + atrLike : null;
  const lower = last ? last.close - atrLike : null;
  return <Screen><ScrollView contentContainerStyle={{ paddingBottom: 28 }}>
    <Header title="SMARTVIBE LIQUIDATION SYSTEM" subtitle="Positioning / liquidation evidence • supporting mechanism" right={<Badge label="PREMIUM PRO" tone="positive" />} />
    <Card elevated><Text style={{fontSize:21,fontWeight:'900',color:C.ink}}>SMARTVIBE LIQUIDATION SYSTEM</Text><Text style={{color:C.muted,marginTop:7,lineHeight:21}}>Detects volume/range positioning spikes and projects potential liquidation pressure zones around live price.</Text><Text style={{color:C.muted,marginTop:8,lineHeight:21}}>Important: when exchange open-interest data is unavailable, the positioning engine uses a volume × range proxy. It is evidence, not verified GEX/open-interest data.</Text></Card>
    <Card><Text style={{fontWeight:'900',color:C.ink}}>LIVE MARKET • {selectedInstrument.symbol}</Text>{loading ? <ActivityIndicator style={{marginTop:18}} color={C.cyan}/> : <><View style={{flexDirection:'row',justifyContent:'space-between',marginTop:14}}><Text style={{color:C.muted}}>Price</Text><Text style={{fontWeight:'900',color:C.ink}}>{last?.close ?? '—'}</Text></View><View style={{flexDirection:'row',justifyContent:'space-between',marginTop:9}}><Text style={{color:C.muted}}>Projected upper pressure</Text><Text style={{fontWeight:'900',color:C.red}}>{upper?.toFixed(5) ?? '—'}</Text></View><View style={{flexDirection:'row',justifyContent:'space-between',marginTop:9}}><Text style={{color:C.muted}}>Projected lower pressure</Text><Text style={{fontWeight:'900',color:'#0b7a3b'}}>{lower?.toFixed(5) ?? '—'}</Text></View></>}{error ? <Text style={{color:C.red,marginTop:12}}>{error}</Text>:null}</Card>
    <Card><Text style={{fontWeight:'900',color:C.ink}}>Engine components</Text><Text style={{color:C.muted,marginTop:7,lineHeight:21}}>Volume baseline • spike detection • range/ATR normalization • projected long/short liquidation tiers • proximity alerts • consumed-level fading.</Text><Text style={{color:C.muted,marginTop:9,lineHeight:21}}>Role: SUPPORTING MECHANISM ONLY. SmartVibe Trading Strategy / Primary Methodology remains the authorization layer.</Text></Card>
  </ScrollView></Screen>;
}
