import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Lock } from 'lucide-react-native';
import { useUser } from '../src/context/UserContext';
import ConsentContent from '../src/components/ConsentContent';

// Reaceite do consentimento LGPD. O AuthGuard traz para cá o usuário logado
// cuja versão aceita é anterior à CONSENT_VERSION atual; ao aceitar, o guard o
// devolve às abas. Recusar não libera o app: a pessoa sai da conta ou a exclui.
export default function Reconsent() {
  const router = useRouter();
  const { currentUser, acceptConsent, logout } = useUser();
  const [consented, setConsented] = useState(false);
  // Parte do estado atual: quem já tinha o Sage ativo vem com a caixa marcada.
  const [aiConsented, setAiConsented] = useState(!!currentUser?.aiConsentAt);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await acceptConsent(aiConsented);
    } catch (e) {
      Alert.alert('Não foi possível salvar', e?.message || 'Verifique sua conexão e tente novamente.');
      setSaving(false);
    }
  }

  function accept() {
    if (!consented || saving) return;
    if (aiConsented) { save(); return; }
    // Sem o aceite do Sage, as conversas anteriores são apagadas (revogação).
    Alert.alert(
      'Continuar sem o Sage?',
      'Sem autorizar o envio ao Google (Gemini), o chat fica desativado e as conversas que você já teve com o Sage serão apagadas. Você pode ativá-lo de novo depois.',
      [
        { text: 'Voltar', style: 'cancel' },
        { text: 'Continuar sem o Sage', style: 'destructive', onPress: save },
      ],
    );
  }

  function decline() {
    Alert.alert(
      'Sem o aceite, não é possível usar o MindUni',
      'O app depende do tratamento desses dados para funcionar. Você pode sair da conta e voltar quando quiser, ou excluir sua conta e todos os seus dados.',
      [
        { text: 'Voltar', style: 'cancel' },
        { text: 'Excluir minha conta', style: 'destructive', onPress: () => router.push('/edit-profile') },
        { text: 'Sair da conta', onPress: () => logout() },
      ],
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 32, paddingTop: 24, paddingBottom: 16 }}>
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <View
            style={{
              width: 80, height: 80, borderRadius: 24,
              backgroundColor: '#D4E9DE',
              alignItems: 'center', justifyContent: 'center',
              marginBottom: 20,
            }}
          >
            <Lock size={40} color="#3D7A67" />
          </View>
          <Text style={{ fontSize: 22, fontWeight: '700', color: '#1C1917', textAlign: 'center' }}>
            Atualizamos nossa Política de Privacidade
          </Text>
        </View>

        <View style={{ backgroundColor: '#FEF8EC', borderRadius: 16, padding: 14, marginBottom: 18 }}>
          <Text style={{ fontSize: 14, color: '#5A544C', lineHeight: 21 }}>
            <Text style={{ fontWeight: '700' }}>O que mudou: </Text>
            o envio das conversas com o Sage ao Google (Gemini) agora tem um aceite próprio e
            opcional. Sem ele, o resto do app continua funcionando. Para continuar, precisamos do
            seu aceite novamente.
          </Text>
        </View>

        <ConsentContent
          consented={consented}
          onToggle={() => setConsented((v) => !v)}
          aiConsented={aiConsented}
          onToggleAi={() => setAiConsented((v) => !v)}
          onOpenPolicy={() => router.push('/privacy-policy')}
        />
      </ScrollView>

      <View style={{ paddingHorizontal: 32, paddingBottom: 24, paddingTop: 8 }}>
        <TouchableOpacity
          onPress={accept}
          disabled={!consented || saving}
          accessibilityRole="button"
          accessibilityState={{ disabled: !consented || saving }}
          accessibilityLabel="Aceitar e continuar usando o MindUni"
          style={{
            backgroundColor: consented ? '#3D7A67' : '#CEC9BF',
            borderRadius: 16, paddingVertical: 16, alignItems: 'center',
          }}
        >
          {saving
            ? <ActivityIndicator color="white" />
            : <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>Aceitar e continuar</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={decline}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel="Não aceito"
          style={{ paddingVertical: 14, alignItems: 'center' }}
        >
          <Text style={{ color: '#A29D95', fontWeight: '600', fontSize: 14 }}>Não aceito</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
