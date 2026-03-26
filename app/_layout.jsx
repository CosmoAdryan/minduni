import '../global.css';
import { Stack } from 'expo-router';
import { UserProvider, useUser } from '../src/context/UserContext';
import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { hasCompletedOnboarding } from '../src/services/onboardingService';
import XPToast from '../src/components/XPToast';

function AuthGuard() {
  const { currentUser, loading } = useUser();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    async function guard() {
      const inOnboarding = segments[0] === '(onboarding)';
      const inAuthGroup = segments[0] === '(auth)';

      const onboardingDone = await hasCompletedOnboarding();

      if (!onboardingDone && !inOnboarding) {
        router.replace('/(onboarding)');
        return;
      }

      if (onboardingDone) {
        if (!currentUser && !inAuthGroup) {
          router.replace('/(auth)/login');
        } else if (currentUser && inAuthGroup) {
          router.replace('/(tabs)');
        }
      }
    }

    guard();
  }, [currentUser, loading, segments]);

  return null;
}

export default function RootLayout() {
  return (
    <UserProvider>
      <AuthGuard />
      <Stack screenOptions={{ headerShown: false }} />
      {/* XP toast overlay — visível em todas as telas, dentro do UserProvider */}
      <XPToast />
    </UserProvider>
  );
}
