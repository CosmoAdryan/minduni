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
import BadgeToast from '../src/components/BadgeToast';

function AuthGuard() {
  const { currentUser, loading, isRecovering } = useUser();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    // Em recuperação de senha, mantém o usuário na tela de redefinição.
    if (isRecovering) return;

    async function guard() {
      const inOnboarding = segments[0] === '(onboarding)';
      const inAuthGroup = segments[0] === '(auth)';
      const inTabs = segments[0] === '(tabs)';
      // Rotas públicas acessíveis em qualquer estado (logado ou não) — não
      // sofrem redirecionamento do guard.
      const PUBLIC_ROUTES = ['privacy-policy', 'edit-profile'];
      if (PUBLIC_ROUTES.includes(segments[0])) return;

      const onboardingDone = await hasCompletedOnboarding();

      if (!onboardingDone) {
        if (!inOnboarding) router.replace('/(onboarding)');
        return;
      }

      // Onboarding concluído: decide o destino pelo estado de login. A checagem
      // é por "destino atual" (inTabs / inAuthGroup) para funcionar mesmo quando
      // segments está vazio (rota raiz "/") — comportamento do expo-router 6.
      if (currentUser) {
        if (!inTabs) router.replace('/(tabs)');
      } else {
        if (!inAuthGroup) router.replace('/(auth)/login');
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
        {/* Toasts globais — visíveis em todas as telas, dentro do UserProvider */}
        <XPToast />
        <BadgeToast />
      </UserProvider>
    </SafeAreaProvider>
  );
}
