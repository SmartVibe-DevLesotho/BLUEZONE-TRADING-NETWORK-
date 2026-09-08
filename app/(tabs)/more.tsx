import { Linking, ScrollView, Text, View, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Card, C, Header, Badge, Button } from '@/components/ui';

const WHATSAPP_NUMBER = '26662649248';
const WHATSAPP_DISPLAY = '+266 6264 9248';
const DESIGNER_EMAIL = 'smartvibeslesotho@gmail.com';

const items = [
  ['Education', 'Trading concepts, risk management and the SmartVibe Trading Network methodology.'],
  ['Broker information', 'Review supported broker information and account connection requirements.'],
  ['Support', `SmartVibe Support: ${WHATSAPP_DISPLAY}`],
] as const;

export default function More() {
  const router = useRouter();
  async function openWhatsApp() {
    const message = encodeURIComponent('Hello SmartVibe Support, I need assistance with the SmartVibe Trading Network app.');
    const urls = [`whatsapp://send?phone=${WHATSAPP_NUMBER}&text=${message}`, `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`];
    for (const url of urls) {
      try { await Linking.openURL(url); return; } catch {}
    }
    Alert.alert('WhatsApp unavailable', `Please install WhatsApp or contact SmartVibe Support at ${WHATSAPP_DISPLAY}.`);
  }
  return <Screen><ScrollView showsVerticalScrollIndicator={false}>
    <Header title="More" subtitle="Tools, education and account resources." />
    <Card elevated><View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><Text style={{ fontWeight: '900', fontSize: 19, color: C.ink }}>SmartVibe Trading Network</Text><Badge label="LIVE" tone="positive" /></View><Text style={{ color: C.muted, marginTop: 9, lineHeight: 22 }}>Real-market monitoring, SmartVibe Trading Network analysis, trading education, AI assistance and broker connectivity. SmartVibe does not manufacture prices or trading results.</Text></Card>
    <Button title="SmartVibe Trading Network — Methodology" onPress={() => router.push('/education')} />
    <Button title="Open AI Assistant" onPress={() => router.push('/ai')} />
    <Button title={`WhatsApp SmartVibe Support • ${WHATSAPP_DISPLAY}`} onPress={openWhatsApp} />
    {items.map(([title, detail]) => <View key={title} style={{ paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.border }}><Text style={{ fontWeight: '900', fontSize: 16, color: C.ink }}>{title}</Text><Text style={{ color: C.muted, marginTop: 5, lineHeight: 20 }}>{detail}</Text></View>)}
    <View style={{ paddingVertical: 20 }}><Text style={{ color: C.muted, textAlign: 'center', fontSize: 12 }}>Designed by SmartVibe</Text><Text style={{ color: C.muted, textAlign: 'center', marginTop: 4, fontSize: 12 }}>{DESIGNER_EMAIL}</Text></View>
  </ScrollView></Screen>;
}
