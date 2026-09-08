import { useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Card, C, Header } from '@/components/ui';
import { supabase } from '@/lib/supabase';

export default function AdminPortal() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [token, setToken] = useState('');
  const [days, setDays] = useState('30');
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  async function issueToken() {
    setBusy(true);
    try {
      if (!supabase) throw new Error('Supabase is not configured.');
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) { router.replace('/auth'); return; }
      const { data, error } = await supabase.functions.invoke('admin-license', { body: { action: 'issue', durationDays: Math.min(365, Math.max(1, Number(days) || 30)) } });
      if (error) {
        setAuthorized(false);
        throw error;
      }
      setAuthorized(true);
      setToken(data?.token ?? '');
      if (!data?.token) Alert.alert('Unable to issue token', 'The secure administration service did not return a token.');
    } catch (e: any) { Alert.alert('Administration error', e?.message ?? 'Unable to issue token.'); }
    finally { setBusy(false); }
  }

  return <Screen><View style={{ flex: 1 }}>
    <Header title="Administration Portal" subtitle="Owner-only administration controls" />
    <Card elevated>
      <Text style={{ fontSize: 21, fontWeight: '900', color: C.ink }}>Secure token issuance</Text>
      <Text style={{ color: C.muted, marginTop: 7, lineHeight: 20 }}>Activation tokens are generated only by the protected server administration service. This screen contains no administrator password, secret, or token-generation algorithm.</Text>
      <Text style={{ fontWeight: '900', marginTop: 18 }}>Token duration (days)</Text>
      <TextInput value={days} onChangeText={setDays} keyboardType="number-pad" style={{ marginTop: 7, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 13, color: C.ink }} />
      <Pressable disabled={busy} onPress={issueToken} style={{ marginTop: 12, padding: 15, borderRadius: 13, backgroundColor: C.blue, opacity: busy ? 0.6 : 1 }}><Text style={{ textAlign: 'center', color: '#fff', fontWeight: '900' }}>{busy ? 'Issuing securely…' : 'Issue Client Activation Token'}</Text></Pressable>
      {token ? <Card><Text style={{ fontWeight: '900' }}>New activation token</Text><Text selectable style={{ marginTop: 8, fontSize: 17, fontWeight: '900', color: C.ink }}>{token}</Text><Text style={{ color: C.muted, marginTop: 6 }}>Give this token directly to the client. It can be activated only up to the server-defined activation limit.</Text></Card> : null}
      {authorized === false ? <Text style={{ color: C.red, marginTop: 12 }}>This account is not authorized for administration.</Text> : null}
    </Card>
    <Pressable onPress={() => router.replace('/')}><Text style={{ textAlign: 'center', color: C.blue, fontWeight: '800', marginTop: 16 }}>Return to Welcome</Text></Pressable>
  </View></Screen>;
}
