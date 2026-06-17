import '../global.css';
import { Stack } from 'expo-router';
import { UserProvider, useUser } from '../src/context/UserContext';
import { useEffect } from 'react';
import { View } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import { Lora_400Regular_Italic } from '@expo-google-fonts/lora';
import { hasCompletedOnboarding } from '../src/services/onboardingService';
import XPToast from '../src/components/XPToast';

function AuthGuard() {
  const { currentUser, loading, isRecovering } = useUser();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    // Em recuperação de senha, o deep link controla a navegação (tela de
    // redefinição). Não interferir para não expulsar o usuário do fluxo.
    if (isRecovering) return;

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
  }, [currentUser, loading, segments, isRecovering]);

  return null;
}

export default function RootLayout() {
  // Carrega Inter (UI) e Lora Italic (voz do Sage). Renderiza o app mesmo antes
  // de carregar para não bloquear: as fontes assumem assim que ficarem prontas.
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Lora_400Regular_Italic,
  });

  return (
    <SafeAreaProvider>
      <UserProvider>
        <AuthGuard />
        <View style={{ flex: 1, opacity: fontsLoaded ? 1 : 0.99 }}>
          <Stack screenOptions={{ headerShown: false }} />
        </View>
        {/* XP toast overlay — visível em todas as telas, dentro do UserProvider */}
        <XPToast />
      </UserProvider>
    </SafeAreaProvider>
  );
}
