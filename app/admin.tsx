import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Card, C, Header, Badge } from '@/components/ui';
import { supabase } from '@/lib/supabase';

type Package = {
  package_key: string;
  plan_key: string;
  display_name: string;
  duration_days: number;
  price_lsl: number;
  included_signals: number;
  scanner_access: boolean;
  whatsapp_group_access: boolean;
  all_services_access: boolean;
};

type License = {
  id: string;
  label: string | null;
  plan_key: string;
  package_key: string | null;
  active: boolean;
  expires_at: string | null;
  max_activations: number;
  activation_count: number;
  issued_at: string;
  revoked_at: string | null;
  included_signals: number;
  used_signals: number;
  carryover_signals: number;
  carryover_credit_lsl: number;
  price_paid_lsl: number;
  renewal_of_license_id: string | null;
};

export default function AdminPortal() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [packageKey, setPackageKey] = useState('');
  const [token, setToken] = useState('');
  const [issuedMeta, setIssuedMeta] = useState<any>(null);

  const selected = useMemo(() => packages.find((p) => p.package_key === packageKey) ?? null, [packages, packageKey]);

  async function loadAdminData() {
    if (!supabase) {
      router.replace('/admin-login');
      return;
    }
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      router.replace('/admin-login');
      return;
    }
    const { data, error } = await supabase.functions.invoke('admin-license', { body: { action: 'list' } });
    if (error || !data?.authorized) {
      setAuthorized(false);
      await supabase.auth.signOut();
      router.replace('/admin-login');
      return;
    }
    const nextPackages = Array.isArray(data.packages) ? data.packages : [];
    setPackages(nextPackages);
    setLicenses(Array.isArray(data.licenses) ? data.licenses : []);
    setPackageKey((current) => current && nextPackages.some((p: Package) => p.package_key === current) ? current : (nextPackages[0]?.package_key ?? ''));
    setAuthorized(true);
  }

  useEffect(() => { loadAdminData().catch(() => router.replace('/admin-login')); }, [router]);

  async function issueToken() {
    if (!selected) {
      Alert.alert('Select a package', 'Choose an active SmartVibe subscription package first.');
      return;
    }
    setBusy(true);
    setToken('');
    try {
      if (!supabase) throw new Error('Supabase is not configured.');
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) { router.replace('/admin-login'); return; }
      const { data, error } = await supabase.functions.invoke('admin-license', { body: { action: 'issue', packageKey: selected.package_key } });
      if (error) throw error;
      if (!data?.token) throw new Error('Secure administration service did not return a token.');
      setToken(data.token);
      setIssuedMeta(data);
      await loadAdminData();
    } catch (e: any) {
      Alert.alert('Token issuance failed', e?.message ?? 'Unable to issue activation token.');
    } finally { setBusy(false); }
  }

  async function revokeToken(licenseId: string) {
    Alert.alert('Revoke token?', 'This permanently disables the selected activation token.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Revoke', style: 'destructive', onPress: async () => {
        setBusy(true);
        try {
          const { data, error } = await supabase!.functions.invoke('admin-license', { body: { action: 'revoke', licenseId } });
          if (error) throw error;
          Alert.alert(data?.ok ? 'Token revoked' : 'Not found', data?.message ?? 'Completed.');
          await loadAdminData();
        } catch (e: any) { Alert.alert('Revoke failed', e?.message ?? 'Unable to revoke token.'); }
        finally { setBusy(false); }
      } },
    ]);
  }

  async function issueRenewal(previousLicenseId: string) {
    setBusy(true);
    setToken('');
    try {
      const renewal = licenses.find((l) => l.id === previousLicenseId);
      if (!renewal?.package_key) throw new Error('The previous license has no package reference.');
      const { data, error } = await supabase!.functions.invoke('admin-license', { body: { action: 'issue-renewal', previousLicenseId, packageKey: renewal.package_key } });
      if (error) throw error;
      if (!data?.token) throw new Error('Secure administration service did not return a renewal token.');
      setToken(data.token);
      setIssuedMeta(data);
      Alert.alert('Renewal issued', `Carryover: ${data.renewal?.carryoverSignals ?? 0} signals\nAmount due: R${data.renewal?.amountDueLsl ?? 0}`);
      await loadAdminData();
    } catch (e: any) { Alert.alert('Renewal failed', e?.message ?? 'Unable to issue renewal token.'); }
    finally { setBusy(false); }
  }

  async function logout() { await supabase?.auth.signOut(); router.replace('/'); }

  if (authorized === false) return <Screen><View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}><Text style={{ color: C.red, fontWeight: '900', textAlign: 'center' }}>Administration access denied.</Text></View></Screen>;
  if (authorized === null) return <Screen><View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: C.muted }}>Securing administration session…</Text></View></Screen>;

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 34 }}>
        <Header title="Administration Portal" subtitle="Owner-only subscription and activation controls" />

        <Card elevated>
          <Text style={{ fontSize: 22, fontWeight: '900', color: C.ink }}>Issue client activation token</Text>
          <Text style={{ color: C.muted, marginTop: 7, lineHeight: 20 }}>Select the live package from the database, confirm its entitlement, then issue a one-time token. Raw tokens are never stored.</Text>
          {packages.length === 0 ? <Text style={{ color: C.red, marginTop: 14, fontWeight: '800' }}>No active subscription packages are available.</Text> : null}
          <View style={{ gap: 8, marginTop: 14 }}>
            {packages.map((p) => (
              <Pressable key={p.package_key} onPress={() => setPackageKey(p.package_key)} style={{ padding: 13, borderRadius: 14, borderWidth: 1, borderColor: packageKey === p.package_key ? C.cyan : C.border, backgroundColor: packageKey === p.package_key ? C.blueSoft : C.card }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
                  <Text style={{ fontWeight: '900', color: C.ink, flex: 1 }}>{p.display_name}</Text>
                  <Text style={{ fontWeight: '900', color: C.green }}>R{p.price_lsl}</Text>
                </View>
                <Text style={{ color: C.muted, marginTop: 4 }}>{p.duration_days} days • {p.included_signals} signals{p.scanner_access ? ' • Scanner' : ''}{p.whatsapp_group_access ? ' • WhatsApp' : ''}{p.all_services_access ? ' • All services' : ''}</Text>
              </Pressable>
            ))}
          </View>
          {selected ? <View style={{ marginTop: 15, flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}><Badge label={`R${selected.price_lsl}`} tone="blue" /><Badge label={`${selected.included_signals} signals`} tone="positive" /><Badge label={`${selected.duration_days} days`} /></View> : null}
          <Pressable disabled={busy || !selected} onPress={issueToken} style={{ marginTop: 15, padding: 15, borderRadius: 13, backgroundColor: C.blue, opacity: busy || !selected ? 0.55 : 1 }}><Text style={{ textAlign: 'center', color: C.white, fontWeight: '900' }}>{busy ? 'Processing securely…' : 'Issue Client Activation Token'}</Text></Pressable>
          {token ? <Card><Text style={{ fontWeight: '900', color: C.ink }}>New token — show once</Text><Text selectable style={{ marginTop: 8, fontSize: 18, fontWeight: '900', color: C.ink }}>{token}</Text><Text style={{ color: C.muted, marginTop: 6 }}>{issuedMeta?.package?.name ?? selected?.display_name} • expires {issuedMeta?.expiresAt ? new Date(issuedMeta.expiresAt).toLocaleDateString() : '—'}</Text><Text style={{ color: C.muted, marginTop: 5 }}>Copy it to the client now. The raw token cannot be recovered later.</Text></Card> : null}
        </Card>

        <Card>
          <Text style={{ fontSize: 20, fontWeight: '900', color: C.ink }}>Issued tokens</Text>
          <Text style={{ color: C.muted, marginTop: 5 }}>Only licenses issued by this administrator are shown.</Text>
          {licenses.length === 0 ? <Text style={{ color: C.muted, marginTop: 14 }}>No activation tokens issued yet.</Text> : null}
          {licenses.map((license) => {
            const remaining = Math.max(0, Number(license.included_signals ?? 0) - Number(license.used_signals ?? 0));
            return <View key={license.id} style={{ marginTop: 12, padding: 13, borderWidth: 1, borderColor: C.border, borderRadius: 14 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}><Text style={{ fontWeight: '900', color: C.ink, flex: 1 }}>{license.label ?? license.package_key ?? license.plan_key}</Text><Badge label={license.active ? 'ACTIVE' : 'REVOKED'} tone={license.active ? 'positive' : undefined} /></View>
              <Text style={{ color: C.muted, marginTop: 5 }}>Used {license.used_signals ?? 0} • Remaining {remaining} • Activations {license.activation_count}/{license.max_activations}</Text>
              <Text style={{ color: C.muted, marginTop: 4 }}>Expires {license.expires_at ? new Date(license.expires_at).toLocaleDateString() : '—'} • Issued {new Date(license.issued_at).toLocaleDateString()}</Text>
              {license.carryover_signals > 0 ? <Text style={{ color: C.muted, marginTop: 4 }}>Carryover: {license.carryover_signals} signals • credit R{Number(license.carryover_credit_lsl ?? 0).toFixed(2)}</Text> : null}
              {license.active ? <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' }}><Pressable disabled={busy} onPress={() => issueRenewal(license.id)} style={{ paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, backgroundColor: C.blue }}><Text style={{ color: C.white, fontWeight: '900' }}>Renew</Text></Pressable><Pressable disabled={busy} onPress={() => revokeToken(license.id)} style={{ paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: C.red }}><Text style={{ color: C.red, fontWeight: '900' }}>Revoke</Text></Pressable></View> : null}
            </View>;
          })}
        </Card>

        <Card><Text style={{ fontWeight: '900', color: C.ink }}>Security boundary</Text><Text style={{ color: C.muted, marginTop: 6, lineHeight: 21 }}>Administrator authentication is handled by Supabase Auth. Authorization is independently enforced by the protected admin-license service and platform_admins record. Tokens are generated server-side and stored only as hashes.</Text></Card>
        <Pressable onPress={logout} style={{ marginTop: 10, padding: 14, borderRadius: 13, borderWidth: 1, borderColor: C.border }}><Text style={{ textAlign: 'center', color: C.ink, fontWeight: '900' }}>Sign out of Admin Portal</Text></Pressable>
        <Pressable onPress={() => router.replace('/')}><Text style={{ textAlign: 'center', color: C.cyan, fontWeight: '800', marginTop: 10 }}>Return to Welcome</Text></Pressable>
        <Text style={{ textAlign: 'center', color: C.muted, fontSize: 11, marginTop: 16 }}>Credit: SmartVibe Computer Solutions</Text>
      </ScrollView>
    </Screen>
  );
}
