import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Card, C } from '@/components/ui';
import { SmartVibeLogo } from '@/components/SmartVibeBrand';
import { AutomationRail } from '@/components/AutomationRail';

export default function Welcome() {
  const router = useRouter();
  return <Screen><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
    <View style={{ alignItems: 'center', paddingVertical: 12 }}><SmartVibeLogo width={320} height={93} /></View>
    <View style={{ paddingVertical: 4 }}><Text style={{ color: C.green, fontSize: 10, fontWeight: '900', letterSpacing: 1.8, textAlign: 'center' }}>SMARTVIBE TRADING NETWORK</Text><Text style={{ color: C.ink, fontSize: 28, lineHeight: 32, fontWeight: '900', textAlign: 'center', marginTop: 8 }}>Live trading intelligence. Built for disciplined decisions.</Text><Text style={{ color: C.muted, fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 9 }}>Real-market monitoring, SmartVibe methodology, AI assistance, chart scanning and secure account access.</Text></View>
    <AutomationRail />
    <Card elevated>
      <Text style={{ fontSize: 22, fontWeight: '900', color: C.ink }}>Choose your secure portal</Text>
      <Text style={{ color: C.muted, marginTop: 7, lineHeight: 20 }}>Client access requires an owner-issued activation token. Administration remains owner-authorized.</Text>
      <Pressable onPress={() => router.push('/auth')} style={{ marginTop: 18, padding: 16, borderRadius: 14, backgroundColor: C.blue, borderWidth: 1, borderColor: C.cyan }}><Text style={{ textAlign: 'center', color: '#fff', fontWeight: '900', fontSize: 16 }}>Client Portal</Text></Pressable>
      <Pressable onPress={() => router.push('/admin')} style={{ marginTop: 10, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: C.border, backgroundColor: C.card }}><Text style={{ textAlign: 'center', color: C.ink, fontWeight: '900', fontSize: 16 }}>Administration Portal</Text></Pressable>
    </Card>
    <Text style={{ color: C.muted, textAlign: 'center', fontSize: 11, marginTop: 12 }}>Credit: SmartVibe Computer Solutions</Text>
  </ScrollView></Screen>;
}
