import { Linking, ScrollView, Text, Alert, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Card, C, Header, Button } from '@/components/ui';

const WHATSAPP_NUMBER = '26662649248';
const WHATSAPP_DISPLAY = '+266 6264 9248';

export default function More() {
  const router = useRouter();

  async function openWhatsApp() {
    const message = encodeURIComponent('Hello SmartVibe Support. I need assistance with the SmartVibe Trading Network app.');
    const configured = process.env.EXPO_PUBLIC_WHATSAPP_URL;
    const urls = configured
      ? [configured]
      : [`whatsapp://send?phone=${WHATSAPP_NUMBER}&text=${message}`, `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`];
    for (const url of urls) {
      try { await Linking.openURL(url); return; } catch {}
    }
    Alert.alert('WhatsApp unavailable', `Please install WhatsApp or contact ${WHATSAPP_DISPLAY}.`);
  }

  return <Screen><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
    <Header title="More" subtitle="Tools and support" />
    <Card elevated>
      <Text style={{ fontWeight: '900', fontSize: 20, color: C.ink }}>SmartVibe Trading Network</Text>
      <Text style={{ color: C.muted, marginTop: 7, lineHeight: 21 }}>Professional market intelligence, analysis, education and support.</Text>
    </Card>
    <Button title="SmartVibe Methodology" onPress={() => router.push('/education')} />
    <Button title="Chart Scanner" onPress={() => router.push('/scanner')} />
    <Button title="AI Assistant" onPress={() => router.push('/ai')} />
    <Button title="My Profile & Subscription" onPress={() => router.push('/profile')} />
    <Button title="WhatsApp Support" onPress={openWhatsApp} />
    <Card>
      <Text style={{ fontWeight: '900', fontSize: 17, color: C.ink }}>Mobile Store Availability</Text>
      <Text style={{ color: C.muted, marginTop: 6, lineHeight: 20 }}>The native SmartVibe app is available for direct testing now. Public store publication is planned for a future release.</Text>
      <View style={{ marginTop: 12, gap: 8 }}>
        <View style={{ padding: 11, borderRadius: 10, borderWidth: 1, borderColor: '#D7DEE8' }}>
          <Text style={{ fontWeight: '900', color: C.ink }}>Google Play</Text>
          <Text style={{ color: C.muted, marginTop: 3, fontSize: 12 }}>Coming Soon</Text>
        </View>
        <View style={{ padding: 11, borderRadius: 10, borderWidth: 1, borderColor: '#D7DEE8' }}>
          <Text style={{ fontWeight: '900', color: C.ink }}>Apple App Store</Text>
          <Text style={{ color: C.muted, marginTop: 3, fontSize: 12 }}>Coming Soon</Text>
        </View>
      </View>
    </Card>
    <Card>
      <Text style={{ fontWeight: '900', fontSize: 17, color: C.ink }}>Support</Text>
      <Text style={{ color: C.muted, marginTop: 5, lineHeight: 20 }}>SmartVibe Support • {WHATSAPP_DISPLAY}</Text>
    </Card>
    <Text style={{ color: C.muted, textAlign: 'center', fontSize: 11, marginTop: 12 }}>SmartVibe Computer Solutions</Text>
  </ScrollView></Screen>;
}
