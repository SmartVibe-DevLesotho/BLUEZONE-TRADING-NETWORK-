import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Screen, Card, C, Header, Badge, LoadingState } from '@/components/ui';
import { getConsensusSignals, type ConsensusSignal } from '@/lib/backend';
import { useTrading } from '@/context/TradingContext';
import { instruments } from '@/instruments';

const sessions = ['Sydney', 'Tokyo', 'London', 'New York'];
const styles = ['Scalping', 'Day Trading', 'Swing Trading'];
const thresholds = [4, 6, 8];
const classes = ['Forex', 'Metals', 'Crypto', 'Indices', 'Deriv'] as const;

function Choice({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={{ paddingVertical: 9, paddingHorizontal: 11, borderRadius: 12, borderWidth: 1, borderColor: active ? C.blue : C.border, backgroundColor: active ? C.blueSoft : C.surface }}><Text style={{ fontWeight: '800', color: active ? C.blue : C.ink }}>{label}</Text></Pressable>;
}

export default function AutoTrade() {
  const { selectedInstrument, setSelectedInstrument, selectedSession, setSelectedSession, selectedStyle, setSelectedStyle, consensusThreshold, setConsensusThreshold } = useTrading();
  const [assetClass, setAssetClass] = useState<(typeof classes)[number]>(selectedInstrument.class);
  const [signals, setSignals] = useState<ConsensusSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setError(''); setLoading(true);
    try {
      const result = await getConsensusSignals({ symbols: [selectedInstrument.symbol], threshold: consensusThreshold, session: selectedSession, style: selectedStyle });
      setSignals(result.signals ?? []);
    } catch (e: any) { setSignals([]); setError(e?.message ?? 'Unable to load live consensus signals.'); }
    finally { setLoading(false); }
  }, [selectedInstrument.symbol, consensusThreshold, selectedSession, selectedStyle]);
  useEffect(() => { load(); }, [load]);
  const visible = instruments.filter(i => i.class === assetClass).slice(0, 30);

  return <Screen><ScrollView showsVerticalScrollIndicator={false}>
    <Header title="Signals" subtitle="Live consensus analysis from the configured backend." right={<Badge label="LIVE" tone="positive" />} />
    <Card elevated><Text style={{ fontWeight: '900', fontSize: 18 }}>Analysis workspace</Text><Text style={{ color: C.muted, marginTop: 5, lineHeight: 20 }}>Choose the market context, then review only qualifying signals returned by the server.</Text>
      <Text style={{ fontWeight: '900', marginTop: 16 }}>Asset class</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>{classes.map(c => <Choice key={c} label={c} active={c === assetClass} onPress={() => setAssetClass(c)} />)}</View>
      <Text style={{ fontWeight: '900', marginTop: 16 }}>Instrument</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>{visible.map(i => <Choice key={i.symbol} label={i.symbol} active={i.symbol === selectedInstrument.symbol} onPress={() => setSelectedInstrument(i)} />)}</View>
      <Text style={{ fontWeight: '900', marginTop: 16 }}>Session</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>{sessions.map(s => <Choice key={s} label={s} active={s === selectedSession} onPress={() => setSelectedSession(s)} />)}</View>
      <Text style={{ fontWeight: '900', marginTop: 16 }}>Trading style</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>{styles.map(s => <Choice key={s} label={s} active={s === selectedStyle} onPress={() => setSelectedStyle(s)} />)}</View>
      <Text style={{ fontWeight: '900', marginTop: 16 }}>Consensus threshold: {consensusThreshold}/8</Text><View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>{thresholds.map(n => <Choice key={n} label={`${n}/8`} active={n === consensusThreshold} onPress={() => setConsensusThreshold(n)} />)}</View>
    </Card>
    {loading ? <LoadingState label="Requesting live consensus…" /> : null}
    {error ? <Card><Badge label="PROVIDER ERROR" tone="negative" /><Text style={{ color: C.red, marginTop: 8, lineHeight: 20 }}>{error}</Text></Card> : null}
    {!loading && !error && signals.length === 0 ? <Card><Badge label="WAIT" tone="neutral" /><Text style={{ fontWeight: '900', fontSize: 20, marginTop: 8 }}>No qualifying signal</Text><Text style={{ color: C.muted, marginTop: 5, lineHeight: 20 }}>No live consensus signal currently meets the selected conditions.</Text></Card> : null}
    {signals.map(signal => <Card key={`${signal.symbol}-${signal.direction}-${signal.score}`} elevated><View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><Badge label={signal.direction} tone={signal.direction === 'BUY' ? 'positive' : 'negative'} /><Text style={{ fontWeight: '900', fontSize: 18 }}>{signal.score}/{signal.total}</Text></View><Text style={{ fontSize: 23, fontWeight: '900', color: C.ink, marginTop: 9 }}>{signal.symbol}</Text><View style={{ marginTop: 12, gap: 5 }}><Text style={{ color: C.slate }}>Entry <Text style={{ fontWeight: '900', color: C.ink }}>{signal.entry}</Text></Text><Text style={{ color: C.slate }}>Stop loss <Text style={{ fontWeight: '900', color: C.ink }}>{signal.sl}</Text></Text><Text style={{ color: C.slate }}>Take profit <Text style={{ fontWeight: '900', color: C.ink }}>{signal.tp}</Text></Text></View><Text style={{ color: C.muted, marginTop: 10, lineHeight: 19 }}>{signal.strategies.join(' • ')}</Text><Text style={{ color: C.muted, fontSize: 12, marginTop: 10 }}>Analysis only — no broker order is placed by this screen.</Text></Card>)}
  </ScrollView></Screen>;
}
