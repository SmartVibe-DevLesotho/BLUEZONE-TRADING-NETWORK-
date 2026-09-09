import { useState } from 'react';
import { Alert, Image, ScrollView, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Button, Card, C, Header, Badge, LoadingState, Screen } from '@/components/ui';
import { scanSmartVibeChart, ChartScanResult } from '@/lib/backend';

function ResultRow({ label, value }: { label: string; value: string }) {
  return <View style={{ paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.border }}><Text style={{ color: C.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1 }}>{label}</Text><Text style={{ color: C.ink, marginTop: 4, lineHeight: 20 }}>{value}</Text></View>;
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
      setResult(scan);
    } catch (e: any) {
      setError(e?.message ?? 'The SmartVibe scanner could not analyze this screenshot.');
    } finally { setBusy(false); }
  }

  return <Screen><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
    <Header title="SmartVibe Scanner" subtitle="Upload a chart screenshot from Deriv, MT5, TradingView or another broker." />
    <Card elevated>
      <Badge label="CANONICAL SMARTVIBE METHODOLOGY" tone="blue" />
      <Text style={{ color: C.ink, fontSize: 20, fontWeight: '900', marginTop: 10 }}>Instrument-locked chart analysis</Text>
      <Text style={{ color: C.muted, lineHeight: 21, marginTop: 7 }}>The scanner reads the screenshot itself first. It must identify the instrument shown before giving feedback. A Gold/XAUUSD screenshot is analyzed as Gold — it is never silently treated as Nasdaq. If the symbol is unreadable, SmartVibe reports that instead of inventing one.</Text>
    </Card>
    {imageUri ? <Card><Image source={{ uri: imageUri }} style={{ width: '100%', height: 250, borderRadius: 14, backgroundColor: C.navy }} resizeMode="contain" /></Card> : null}
    <Button title={imageUri ? 'Replace Chart Screenshot' : 'Upload Chart Screenshot'} onPress={chooseChart} disabled={busy} />
    {imageBase64 && !busy ? <Button title="SCAN CHART WITH SMARTVIBE AI" onPress={scanSelectedChart} disabled={busy} /> : null}
    {busy ? <LoadingState label="SmartVibe is reading the chart and checking the Canonical SmartVibe Methodology…" /> : null}
    {error ? <Card><Text style={{ color: C.red, fontWeight: '900' }}>Scanner error</Text><Text style={{ color: C.muted, marginTop: 6, lineHeight: 20 }}>{error}</Text></Card> : null}
    {result ? <>
      <Card elevated>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><Text style={{ color: C.ink, fontSize: 21, fontWeight: '900' }}>{result.detectedInstrumentLabel || result.detectedInstrument || 'Instrument not confirmed'}</Text><Badge label={result.direction} tone={result.direction === 'BUY' ? 'positive' : result.direction === 'SELL' ? 'negative' : 'neutral'} /></View>
        <Text style={{ color: C.muted, marginTop: 7 }}>Confidence: {Math.round(result.confidence)}% • Broker: {result.broker || 'Not identifiable'} • Timeframe: {result.timeframe || 'Not identifiable'}</Text>
        {!result.chartReadable ? <Text style={{ color: C.gold, marginTop: 10, lineHeight: 20 }}>The screenshot is not sufficiently readable for a reliable methodology decision.</Text> : null}
        <Text style={{ color: C.ink, marginTop: 13, lineHeight: 22 }}>{result.feedback}</Text>
      </Card>
      <Card>
        <Text style={{ color: C.cyan, fontWeight: '900', letterSpacing: 1 }}>METHODOLOGY CHECK</Text>
        <ResultRow label="HIGHER-TIMEFRAME DIRECTION" value={result.methodology.higherTimeframeDirection} />
        <ResultRow label="M30 CONFIRMATION" value={result.methodology.m30Confirmation} />
        <ResultRow label="SUPPORT / RESISTANCE / RBS" value={result.methodology.resistanceSupportRbs} />
        <ResultRow label="ENGULFING" value={result.methodology.engulfing} />
        <ResultRow label="M1 / LOWER-TIMEFRAME CONFIRMATION" value={result.methodology.lowerTimeframeConfirmation} />
        <ResultRow label="TRENDLINE / PRICE ACTION" value={result.methodology.trendlinePriceAction} />
        <ResultRow label="STRUCTURAL INVALIDATION" value={result.methodology.structuralInvalidation} />
        <ResultRow label="CONTINUATION MANAGEMENT" value={result.methodology.continuationManagement} />
      </Card>
      {result.warnings.length ? <Card><Text style={{ color: C.gold, fontWeight: '900' }}>WARNINGS</Text>{result.warnings.map((warning, i) => <Text key={i} style={{ color: C.muted, marginTop: 7, lineHeight: 20 }}>• {warning}</Text>)}</Card> : null}
      {result.evidence.length ? <Card><Text style={{ color: C.cyan, fontWeight: '900' }}>SCREENSHOT EVIDENCE</Text>{result.evidence.map((item, i) => <Text key={i} style={{ color: C.muted, marginTop: 7, lineHeight: 20 }}>• {item}</Text>)}</Card> : null}
    </> : null}
    <Text style={{ color: C.muted, textAlign: 'center', fontSize: 11, marginTop: 10 }}>Credit: SmartVibe Computer Solutions</Text>
    <Button title="Back" variant="secondary" onPress={() => router.back()} />
  </ScrollView></Screen>;
}
