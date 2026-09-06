import { Redirect, useRootNavigationState } from 'expo-router';
import { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

export default function Index() {
  const [target, setTarget] = useState<string | null>(null);
  const nav = useRootNavigationState();
  useEffect(() => {
    if (!nav?.key) return;
    (async () => {
      const license = await SecureStore.getItemAsync('bluezone_license_active');
      const risk = await SecureStore.getItemAsync('bluezone_risk_accepted');
      if (license !== '1') setTarget('/license');
      else if (risk !== '1') setTarget('/onboarding/risk');
      else setTarget('/auth');
    })();
  }, [nav?.key]);
  return target ? <Redirect href={target as any} /> : null;
}
