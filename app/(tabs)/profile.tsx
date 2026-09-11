import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Screen, Card, Button, C } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { validateLicense } from '@/lib/backend';
import { getDeviceId } from '@/lib/device';
import { router } from 'expo-router';

type Stats = {
  closed_signals: number;
  wins: number;
  losses: number;
  win_rate: number;
  realized_pips: number;
};

const AVATAR_BUCKET = 'avatars';
const SIGNED_URL_SECONDS = 60 * 60;

export default function Profile() {
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<any>({});
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarBusy, setAvatarBusy] = useState(false);

  const refreshAvatarUrl = useCallback(async (path: string | null) => {
    if (!supabase || !path) {
      setAvatarUrl(null);
      return;
    }

    const { data, error } = await supabase.storage
      .from(AVATAR_BUCKET)
      .createSignedUrl(path, SIGNED_URL_SECONDS);

    if (error) {
      console.warn('Unable to create avatar URL:', error.message);
      setAvatarUrl(null);
      return;
    }

    setAvatarUrl(`${data.signedUrl}&v=${Date.now()}`);
  }, []);

  const loadProfile = useCallback(async () => {
    if (!supabase) return;

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return;

    setUserId(user.id);
    setEmail(user.email ?? null);

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('avatar_path')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.warn('Unable to load profile:', error.message);
      return;
    }

    const path = profile?.avatar_path ?? null;
    setAvatarPath(path);
    await refreshAvatarUrl(path);
  }, [refreshAvatarUrl]);

  useEffect(() => {
    (async () => {
      try {
        if (!supabase) return;
        await loadProfile();

        const deviceId = await getDeviceId();
        const result = await validateLicense({ action: 'status', deviceId });
        if (result.valid) setStatus(result);

        const { data: perf } = await supabase
          .from('smartvibe_performance_stats')
          .select('*')
          .maybeSingle();
        if (perf) setStats(perf as Stats);
      } finally {
        setLoading(false);
      }
    })();
  }, [loadProfile]);

  async function uploadAvatar() {
    if (!supabase || !userId) return;

    try {
      setAvatarBusy(true);
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Photo permission required', 'Allow SmartVibe to access your photos to choose a profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
        exif: false,
      });

      if (result.canceled || !result.assets?.length) return;

      const image = result.assets[0];
      if (!image.uri) throw new Error('The selected image could not be read.');

      const mimeType = image.mimeType?.toLowerCase() ?? 'image/jpeg';
      const extension = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
      const newPath = `${userId}/avatar.${extension}`;
      const previousPath = avatarPath;
      const fileBuffer = await fetch(image.uri).then((response) => response.arrayBuffer());

      const { error: uploadError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(newPath, fileBuffer, {
          contentType: mimeType,
          upsert: true,
          cacheControl: '3600',
        });

      if (uploadError) throw uploadError;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ avatar_path: newPath, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (profileError) throw profileError;

      if (previousPath && previousPath !== newPath) {
        await supabase.storage.from(AVATAR_BUCKET).remove([previousPath]);
      }

      setAvatarPath(newPath);
      await refreshAvatarUrl(newPath);
    } catch (error: any) {
      Alert.alert('Profile picture update failed', error?.message ?? 'Unable to upload the selected image.');
    } finally {
      setAvatarBusy(false);
    }
  }

  async function removeAvatar() {
    if (!supabase || !userId || !avatarPath) return;

    try {
      setAvatarBusy(true);
      const { error: removeError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .remove([avatarPath]);
      if (removeError) throw removeError;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ avatar_path: null, updated_at: new Date().toISOString() })
        .eq('id', userId);
      if (profileError) throw profileError;

      setAvatarPath(null);
      setAvatarUrl(null);
    } catch (error: any) {
      Alert.alert('Profile picture removal failed', error?.message ?? 'Unable to remove your profile picture.');
    } finally {
      setAvatarBusy(false);
    }
  }

  async function signOut() {
    await supabase?.auth.signOut();
    router.replace('/auth');
  }

  return (
    <Screen>
      <Text style={{ fontSize: 30, fontWeight: '900', color: C.ink }}>Profile</Text>
      {loading ? (
        <ActivityIndicator color={C.cyan} />
      ) : (
        <>
          <Card>
            <Text style={{ fontWeight: '900', color: C.ink }}>Account</Text>
            <View style={{ alignItems: 'center', marginTop: 16 }}>
              {avatarUrl ? (
                <Image
                  source={{ uri: avatarUrl }}
                  accessibilityLabel="SmartVibe profile picture"
                  style={{ width: 112, height: 112, borderRadius: 56, borderWidth: 3, borderColor: C.cyan }}
                />
              ) : (
                <View style={{ width: 112, height: 112, borderRadius: 56, backgroundColor: C.card, borderWidth: 2, borderColor: C.cyan, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 40, fontWeight: '900', color: C.cyan }}>{(email?.[0] ?? 'S').toUpperCase()}</Text>
                </View>
              )}

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                <Pressable
                  onPress={uploadAvatar}
                  disabled={avatarBusy}
                  style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: C.cyan, opacity: avatarBusy ? 0.6 : 1 }}
                >
                  <Text style={{ color: '#001018', fontWeight: '900' }}>{avatarBusy ? 'Saving…' : avatarPath ? 'Change photo' : 'Add photo'}</Text>
                </Pressable>
                {avatarPath ? (
                  <Pressable
                    onPress={removeAvatar}
                    disabled={avatarBusy}
                    style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: C.red, opacity: avatarBusy ? 0.6 : 1 }}
                  >
                    <Text style={{ color: C.red, fontWeight: '900' }}>Remove</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
            <Text style={{ color: C.muted, marginTop: 14 }}>{email ?? 'No authenticated user'}</Text>
            <Text style={{ color: C.muted, marginTop: 6 }}>Your profile picture is stored securely and is only accessible to your account.</Text>
          </Card>

          <Card>
            <Text style={{ fontWeight: '900', color: C.ink }}>SmartVibe Subscription</Text>
            <Text style={{ color: C.muted, marginTop: 8 }}>{status.packageName ?? status.plan ?? 'Not active'}</Text>
            {status.pricePaidLsl != null ? <Text style={{ color: C.muted, marginTop: 5 }}>Paid: R{Number(status.pricePaidLsl).toLocaleString()}</Text> : null}
            {status.includedSignals != null ? <>
              <Text style={{ color: C.muted, marginTop: 5 }}>Package signals: {status.includedSignals}</Text>
              <Text style={{ color: C.muted, marginTop: 5 }}>Used: {status.signalsUsed ?? 0}</Text>
              <Text style={{ color: C.muted, marginTop: 5 }}>Pending approval: {status.signalsPending ?? 0}</Text>
              <Text style={{ color: C.muted, marginTop: 5 }}>Unused records: {status.signalsUnused ?? 0}</Text>
              <Text style={{ fontWeight: '900', marginTop: 7, color: C.ink }}>Remaining: {status.signalsRemaining ?? 0}</Text>
            </> : null}
            {status.carryoverSignals > 0 ? <Text style={{ color: C.muted, marginTop: 5 }}>Carryover: {status.carryoverSignals} signals • Credit: R{Number(status.carryoverCreditLsl ?? 0).toFixed(2)}</Text> : null}
            {status.expiresAt ? <Text style={{ color: C.muted, marginTop: 5 }}>Expires {new Date(status.expiresAt).toLocaleDateString()}</Text> : null}
            <View style={{ marginTop: 10 }}>
              <Text style={{ fontWeight: '800', color: C.ink }}>Access</Text>
              <Text style={{ color: C.muted, marginTop: 4 }}>Chart Scanner: {status.scannerAccess ? 'Included' : 'Not included'}</Text>
              <Text style={{ color: C.muted, marginTop: 4 }}>WhatsApp Group: {status.whatsappGroupAccess ? 'Included' : 'Not included'}</Text>
              <Text style={{ color: C.muted, marginTop: 4 }}>All Services: {status.allServicesAccess ? 'Included' : 'Not included'}</Text>
            </View>
          </Card>

          <Card>
            <Text style={{ fontWeight: '900', color: C.ink }}>Recorded SmartVibe Performance</Text>
            {stats ? <>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}><Text style={{ color: C.muted }}>Closed</Text><Text style={{ fontWeight: '900', color: C.ink }}>{stats.closed_signals}</Text></View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 7 }}><Text style={{ color: C.muted }}>Wins</Text><Text style={{ fontWeight: '900', color: C.ink }}>{stats.wins}</Text></View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 7 }}><Text style={{ color: C.muted }}>Losses</Text><Text style={{ fontWeight: '900', color: C.ink }}>{stats.losses}</Text></View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 7 }}><Text style={{ color: C.muted }}>Win rate</Text><Text style={{ fontWeight: '900', color: C.ink }}>{stats.win_rate}%</Text></View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 7 }}><Text style={{ color: C.muted }}>Realized movement</Text><Text style={{ fontWeight: '900', color: C.ink }}>{Number(stats.realized_pips).toFixed(1)} pips</Text></View>
            </> : <Text style={{ color: C.muted, marginTop: 8 }}>No closed live outcomes have been recorded yet.</Text>}
          </Card>
        </>
      )}
      <Button title="Sign out" onPress={signOut} variant="secondary" />
    </Screen>
  );
}
