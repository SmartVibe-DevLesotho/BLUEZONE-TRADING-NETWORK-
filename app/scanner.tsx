import { useState } from 'react';
import { Alert, Image, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Button, Card, C, Header, Badge, LoadingState, Screen } from '@/components/ui';
import { scanSmartVibeChart, ChartScanResult } from '@/lib/backend';

function ResultRow({ label, value }: { label: string; value: string }) {
  return <View style={{ paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.border }}><Text style={{ color: C.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1 }}>{label}</Text><Text style={{ color: C.ink, marginTop: 4, lineHeight: 20 }}>{value || 'Not available'}</Text></View>;
}

function PriceRow({ label, value, tone }: { label: string; value?: number | null; tone?: 'entry'|'target'|'stop' }) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return null;
  return <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border }}>
    <Text style={{ color: C.muted, fontWeight: '900', letterSpacing: .6 }}>{label}</Text>
    <Text style={{ color: tone === 'stop' ? C.red : tone === 'target' ? '#39c35a' : C.gold, fontSize: 17, fontWeight: '900' }}>{Number(value).toFixed(3)}</Text>
  </View>;
}

export default function Scanner() {
  const router = useRouter();
  const [imageUri, setImageUri] = useState('');
  const [imageBase64, setImageBase64] = useState('');
  const [imageMimeType, setImageMimeType] = useState('image/jpeg');
  const [result, setResult] = useState<ChartScanResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function chooseChart() {
    if (busy) return;
    setError('');
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Photo permission required', 'SmartVibe needs access to the chart screenshot you choose.');
        return;
      }
      const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: false, quality: 0.88, base64: true });
      if (picked.canceled || !picked.assets?.[0]) return;
      const asset = picked.assets[0];
      const base64 = asset.base64;
      if (!base64) {
        setError('The selected image could not be read. Please choose another chart screenshot.');
        return;
      }
      setImageUri(asset.uri);
      setImageBase64(base64);
      setImageMimeType(asset.mimeType || 'image/jpeg');
      setResult(null);
      setError('');
    } catch (e: any) {
      setError(e?.message ?? 'The chart image could not be selected. Please try again.');
    }
  }

  async function scanSelectedChart() {
    if (!imageBase64 || busy) return;
    setError('');
    setResult(null);
    setBusy(true);
    try {
      const scan = await scanSmartVibeChart(imageBase64, imageMimeType);
      if (!scan || typeof scan !== 'object') throw new Error('The scanner returned an invalid response. Please try again.');
      setResult(scan);
    } catch (e: any) {
      setError(e?.message ?? 'The SmartVibe scanner could not analyze this screenshot.');
    } finally { setBusy(false); }
  }

  const setup = result?.pineSetup;
  const entry = Number(setup?.entry);
  const stop = Number(setup?.stopLoss);
  const targets = [setup?.tp1, setup?.tp2, setup?.tp3, setup?.tp4].map(Number).filter(Number.isFinite);
  const risk = Number.isFinite(entry) && Number.isFinite(stop) ? Math.abs(entry - stop) : null;

  return <Screen><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
    <Header title="SmartVibe Scanner" subtitle="Upload a chart screenshot from Deriv, MT5, TradingView or another broker." />
    <Card elevated>
      <Badge label="CANONICAL SMARTVIBE METHODOLOGY" tone="blue" />
      <Text style={{ color: C.ink, fontSize: 20, fontWeight: '900', marginTop: 10 }}>Instrument-locked chart analysis</Text>
      <Text style={{ color: C.muted, lineHeight: 21, marginTop: 7 }}>SmartVibe reads the screenshot itself first. It recognizes ordinary candles and Pine/TradingView-style Entry, SL and TP labels/levels. A missing symbol never becomes a guessed instrument.</Text>
    </Card>
    {imageUri ? <Card><Image source={{ uri: imageUri }} style={{ width: '100%', height: 300, borderRadius: 14, backgroundColor: C.navy }} resizeMode="contain" /></Card> : null}
    <Button title={imageUri ? 'Replace Chart Screenshot' : 'Upload Chart Screenshot'} onPress={chooseChart} disabled={busy} />
    {imageBase64 && !busy ? <Button title="SCAN CHART WITH SMARTVIBE AI" onPress={scanSelectedChart} disabled={busy} /> : null}
    {busy ? <LoadingState label="SmartVibe is reading candles, Pine labels, levels and the Canonical SmartVibe Methodology…" /> : null}
    {error ? <Card><Text style={{ color: C.red, fontWeight: '900' }}>Scanner error</Text><Text style={{ color: C.muted, marginTop: 6, lineHeight: 20 }}>{error}</Text></Card> : null}

    {result ? <>
      {setup?.detected ? <Card elevated>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View><Text style={{ color: C.gold, fontSize: 11, fontWeight: '900', letterSpacing: 1 }}>PINE / CHART SETUP DETECTED</Text><Text style={{ color: C.ink, fontSize: 24, fontWeight: '900', marginTop: 4 }}>{setup.direction || 'WAIT'}</Text></View>
          <Badge label={setup.source || 'SCREENSHOT'} tone="blue" />
        </View>
        <Text style={{ color: C.muted, marginTop: 7, lineHeight: 20 }}>{setup.description || 'Entry, stop and target levels were read from the uploaded chart.'}</Text>
        <PriceRow label="ENTRY" value={setup.entry} tone="entry" />
        <PriceRow label="SL" value={setup.stopLoss} tone="stop" />
        <PriceRow label="TP 1" value={setup.tp1} tone="target" />
        <PriceRow label="TP 2" value={setup.tp2} tone="target" />
        <PriceRow label="TP 3" value={setup.tp3} tone="target" />
        <PriceRow label="TP 4" value={setup.tp4} tone="target" />
        {risk !== null ? <Text style={{ color: C.muted, marginTop: 10, fontSize: 12 }}>Risk distance: {risk.toFixed(3)} • Targets are preserved as staged levels; 150–200 pips is a management milestone, not a hard cap.</Text> : null}
        {setup.direction && targets.length ? <View style={{ marginTop: 12, padding: 12, borderRadius: 12, backgroundColor: C.panel }}><Text style={{ color: C.cyan, fontWeight: '900' }}>PINE PLAN PRESERVATION</Text><Text style={{ color: C.muted, marginTop: 5, lineHeight: 19 }}>SmartVibe keeps the screenshot's Entry → SL → TP1 → TP2 → TP3 → TP4 structure instead of collapsing it into one target.</Text></View> : null}
      </Card> : null}

      <Card elevated>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><Text style={{ color: C.ink, fontSize: 21, fontWeight: '900' }}>{result.detectedInstrumentLabel || result.detectedInstrument || 'Instrument not confirmed'}</Text><Badge label={result.direction || 'WAIT'} tone={result.direction === 'BUY' ? 'positive' : result.direction === 'SELL' ? 'negative' : 'neutral'} /></View>
        <Text style={{ color: C.muted, marginTop: 7 }}>Confidence: {Number.isFinite(result.confidence) ? Math.round(result.confidence) : 0}% • Broker: {result.broker || 'Not identifiable'} • Timeframe: {result.timeframe || 'Not identifiable'}</Text>
        {!result.chartReadable ? <Text style={{ color: C.gold, marginTop: 10, lineHeight: 20 }}>The screenshot is not sufficiently readable for a reliable methodology decision.</Text> : null}
        <Text style={{ color: C.ink, marginTop: 13, lineHeight: 22 }}>{result.feedback || 'No methodology feedback was returned.'}</Text>
      </Card>
      <Card>
        <Text style={{ color: C.cyan, fontWeight: '900', letterSpacing: 1 }}>METHODOLOGY CHECK</Text>
        <ResultRow label="HIGHER-TIMEFRAME DIRECTION" value={result.methodology?.higherTimeframeDirection || ''} />
        <ResultRow label="M30 CONFIRMATION" value={result.methodology?.m30Confirmation || ''} />
        <ResultRow label="SUPPORT / RESISTANCE / RBS" value={result.methodology?.resistanceSupportRbs || ''} />
        <ResultRow label="ENGULFING" value={result.methodology?.engulfing || ''} />
        <ResultRow label="M1 / LOWER-TIMEFRAME CONFIRMATION" value={result.methodology?.lowerTimeframeConfirmation || ''} />
        <ResultRow label="TRENDLINE / PRICE ACTION" value={result.methodology?.trendlinePriceAction || ''} />
        <ResultRow label="STRUCTURAL INVALIDATION" value={result.methodology?.structuralInvalidation || ''} />
        <ResultRow label="CONTINUATION MANAGEMENT" value={result.methodology?.continuationManagement || ''} />
      </Card>
      {Array.isArray(result.warnings) && result.warnings.length ? <Card><Text style={{ color: C.gold, fontWeight: '900' }}>WARNINGS</Text>{result.warnings.map((warning, i) => <Text key={i} style={{ color: C.muted, marginTop: 7, lineHeight: 20 }}>• {warning}</Text>)}</Card> : null}
      {Array.isArray(result.evidence) && result.evidence.length ? <Card><Text style={{ color: C.cyan, fontWeight: '900' }}>SCREENSHOT EVIDENCE</Text>{result.evidence.map((item, i) => <Text key={i} style={{ color: C.muted, marginTop: 7, lineHeight: 20 }}>• {item}</Text>)}</Card> : null}
    </> : null}
    <Text style={{ color: C.muted, textAlign: 'center', fontSize: 11, marginTop: 10 }}>Credit: SmartVibe Computer Solutions</Text>
    <Button title="Back" variant="secondary" onPress={() => router.back()} />
  </ScrollView></Screen>;
}
