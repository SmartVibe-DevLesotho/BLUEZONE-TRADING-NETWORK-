import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Card, C, Header } from '@/components/ui';

export default function Welcome() {
  const router = useRouter();
  return <Screen><View style={{ flex: 1, justifyContent: 'center' }}>
    <Header title="SmartVibe Trading Network" subtitle="Live trading intelligence and secure account access." />
    <Card elevated>
      <Text style={{ fontSize: 26, fontWeight: '900', color: C.ink }}>Welcome</Text>
      <Text style={{ color: C.muted, marginTop: 8, lineHeight: 21 }}>Choose your secure access portal.</Text>
      <Pressable onPress={() => router.push('/auth')} style={{ marginTop: 20, padding: 16, borderRadius: 14, backgroundColor: C.blue }}><Text style={{ textAlign: 'center', color: '#fff', fontWeight: '900', fontSize: 16 }}>Client Portal</Text></Pressable>
      <Pressable onPress={() => router.push('/admin')} style={{ marginTop: 10, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface }}><Text style={{ textAlign: 'center', color: C.ink, fontWeight: '900', fontSize: 16 }}>Administration Portal</Text></Pressable>
    </Card>
  </View></Screen>;
}
