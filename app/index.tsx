import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Card, C } from '@/components/ui';
import { SmartVibeLogo } from '@/components/SmartVibeBrand';
import { AutomationRail } from '@/components/AutomationRail';
import { SubscriptionRail } from '@/components/SubscriptionRail';

const WHATSAPP_URL = 'https://wa.me/?text=Hello%20SmartVibe%20Trading%20Network.%20I%20would%20like%20to%20request%20an%20activation%20token%20for%20the%20app.';

function Action({ icon, title, subtitle, onPress, dark = false }: { icon: any; title: string; subtitle: string; onPress: () => void; dark?: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ flex: 1, minHeight: 92, borderRadius: 18, padding: 15, backgroundColor: dark ? C.ink : C.green, borderWidth: 1, borderColor: dark ? C.cyan : C.green, opacity: pressed ? 0.82 : 1 })}>
      <Ionicons name={icon} size={22} color="#fff" />
      <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15, marginTop: 10 }}>{title}</Text>
      <Text style={{ color: '#fff', opacity: 0.78, fontSize: 11, marginTop: 3 }}>{subtitle}</Text>
    </Pressable>
  );
}

export default function Welcome() {
  const router = useRouter();
  const openWhatsApp = async () => { try { await Linking.openURL(WHATSAPP_URL); } catch {} };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }}>
        <View style={{ alignItems: 'center', paddingTop: 8, paddingBottom: 18 }}>
          <SmartVibeLogo width={310} height={93} />
        </View>

        <View style={{ alignItems: 'center', paddingHorizontal: 8 }}>
          <Text style={{ color: C.green, fontSize: 10, fontWeight: '900', letterSpacing: 2, textAlign: 'center' }}>SMARTVIBE TRADING NETWORK</Text>
          <Text style={{ color: C.ink, fontSize: 29, lineHeight: 34, fontWeight: '900', textAlign: 'center', marginTop: 8 }}>Trade with clarity.</Text>
          <Text style={{ color: C.muted, fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 8 }}>Market intelligence, structured analysis and intelligent assistance in one professional trading platform.</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
          <Action icon="logo-whatsapp" title="Get Access" subtitle="Request activation" onPress={openWhatsApp} />
          <Action icon="sparkles" title="AI Assistant" subtitle="Ask SmartVibe" onPress={() => router.push('/ai')} dark />
        </View>

        <View style={{ marginTop: 16 }}>
          <Pressable onPress={() => router.push('/(tabs)/markets')} style={({ pressed }) => ({ borderRadius: 18, padding: 17, backgroundColor: C.blue, borderWidth: 1, borderColor: C.cyan, opacity: pressed ? 0.85 : 1 })}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 }}>
              <Ionicons name="grid-outline" size={19} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16 }}>Explore SmartVibe</Text>
            </View>
          </Pressable>
        </View>

        <AutomationRail />
        <SubscriptionRail />

        <Card elevated>
          <Text style={{ fontSize: 20, fontWeight: '900', color: C.ink }}>Already have access?</Text>
          <Text style={{ color: C.muted, marginTop: 6, lineHeight: 20 }}>Sign in to continue to your SmartVibe account.</Text>
          <Pressable onPress={() => router.push('/auth')} style={{ marginTop: 15, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: C.border, backgroundColor: C.card }}>
            <Text style={{ textAlign: 'center', color: C.ink, fontWeight: '900', fontSize: 15 }}>Client Sign In</Text>
          </Pressable>
        </Card>

        <Text style={{ color: C.muted, textAlign: 'center', fontSize: 11, marginTop: 10 }}>SmartVibe Computer Solutions</Text>
      </ScrollView>
    </Screen>
  );
}
