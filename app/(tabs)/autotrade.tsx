import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Screen, Card, C, Header, Badge, LoadingState } from '@/components/ui';
import { getConsensusSignals, type ConsensusSignal } from '@/lib/backend';
import { useTrading } from '@/context/TradingContext';
import { instruments } from '@/instruments';

const sessions = ['Sydney', 'Tokyo', 'London', 'New York'];
const classes = ['Forex', 'Metals', 'Crypto', 'Indices', 'Deriv'] as const;

function Choice({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={{ paddingVertical: 9, paddingHorizontal: 11, borderRadius: 12, borderWidth: 1, borderColor: active ? C.blue : C.border, backgroundColor: active ? C.blueSoft : C.surface }}><Text style={{ fontWeight: '800', color: active ? C.blue : C.ink }}>{label}</Text></Pressable>;
}

export default function AutoTrade() {
  const { selectedInstrument, setSelectedInstrument, selectedSession, setSelectedSession, selectedStyle, consensusThreshold } = useTrading();
  const [assetClass, setAssetClass] = useState<(typeof classes)[number]>(selectedInstrument.class);
  const [signals, setSignals] = useState<ConsensusSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setError(''); setLoading(true);
    try {
      const result = await getConsensusSignals({ symbols: [selectedInstrument.symbol], threshold: consensusThreshold, session: selectedSession, style: selectedStyle });
      setSignals(result.signals ?? []);
    } catch (e: any) { setSignals([]); setError(e?.message ?? 'Unable to load live SmartVibe Trading Network analysis.'); }
    finally { setLoading(false); }
  }, [selectedInstrument.symbol, consensusThreshold, selectedSession, selectedStyle]);
  useEffect(() => { load(); }, [load]);
  const visible = instruments.filter(i => i.class === assetClass).slice(0, 30);

  return <Screen><ScrollView showsVerticalScrollIndicator={false}>
    <Header title="SmartVibe Trading Network" subtitle="Live analysis from the SmartVibe Trading Network methodology." right={<Badge label="LIVE" tone="positive" />} />
    <Card elevated><Text style={{ fontWeight: '900', fontSize: 18 }}>SmartVibe Trading Network</Text><Text style={{ color: C.muted, marginTop: 5, lineHeight: 20 }}>One canonical methodology controls every BUY and SELL signal. Supporting market-structure, liquidity, price-action and confirmation mechanics operate behind the scenes only to validate the SmartVibe setup.</Text>
      <Text style={{ fontWeight: '900', marginTop: 16 }}>Asset class</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>{classes.map(c => <Choice key={c} label={c} active={c === assetClass} onPress={() => setAssetClass(c)} />)}</View>
      <Text style={{ fontWeight: '900', marginTop: 16 }}>Instrument</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>{visible.map(i => <Choice key={i.symbol} label={i.symbol} active={i.symbol === selectedInstrument.symbol} onPress={() => setSelectedInstrument(i)} />)}</View>
      <Text style={{ fontWeight: '900', marginTop: 16 }}>Session</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>{sessions.map(s => <Choice key={s} label={s} active={s === selectedSession} onPress={() => setSelectedSession(s)} />)}</View>
    </Card>
    {loading ? <LoadingState label="Requesting live SmartVibe Trading Network analysis…" /> : null}
    {error ? <Card><Badge label="PROVIDER ERROR" tone="negative" /><Text style={{ color: C.red, marginTop: 8, lineHeight: 20 }}>{error}</Text></Card> : null}
    {!loading && !error && signals.length === 0 ? <Card><Badge label="WAIT" tone="neutral" /><Text style={{ fontWeight: '900', fontSize: 20, marginTop: 8 }}>No qualifying setup</Text><Text style={{ color: C.muted, marginTop: 5, lineHeight: 20 }}>The SmartVibe Trading Network methodology has not confirmed a valid setup.</Text></Card> : null}
    {signals.map(signal => <Card key={`${signal.symbol}-${signal.direction}-${signal.score}`} elevated><View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><Badge label={signal.direction} tone={signal.direction === 'BUY' ? 'positive' : 'negative'} /><Text style={{ fontWeight: '900', fontSize: 18 }}>{signal.score}/{signal.total}</Text></View><Text style={{ fontSize: 23, fontWeight: '900', color: C.ink, marginTop: 9 }}>{signal.symbol}</Text><View style={{ marginTop: 12, gap: 5 }}><Text style={{ color: C.slate }}>Entry <Text style={{ fontWeight: '900', color: C.ink }}>{signal.entry}</Text></Text><Text style={{ color: C.slate }}>Stop loss <Text style={{ fontWeight: '900', color: C.ink }}>{signal.sl}</Text></Text><Text style={{ color: C.slate }}>Target <Text style={{ fontWeight: '900', color: C.ink }}>{signal.tp ?? 'Structural continuation'}</Text></Text></View><Text style={{ color: C.muted, marginTop: 10, lineHeight: 19 }}>SmartVibe Trading Network confirmation</Text><Text style={{ color: C.muted, fontSize: 12, marginTop: 10 }}>Analysis only — no broker order is placed by this screen.</Text></Card>)}
  </ScrollView></Screen>;
}
