import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Brain, MessageCircle, Target, Shield, Lock, CheckSquare, Square } from 'lucide-react-native';
import { markOnboardingDone, markConsentGiven } from '../../src/services/onboardingService';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    Icon: Brain,
    color: '#3D7A67',
    bg: '#D4E9DE',
    title: 'Você não precisa estar bem para começar',
    description:
      'O MindUni é um espaço seguro e sem julgamentos para cuidar da sua saúde emocional — no seu tempo, do seu jeito.',
  },
  {
    Icon: MessageCircle,
    color: '#3D7A67',
    bg: '#D4E9DE',
    title: 'Converse com o Sage',
    description:
      'O Sage te ouve com atenção e sem pressa. Ele não substitui um profissional — caminha ao seu lado, sempre que você precisar.',
  },
  {
    Icon: Target,
    color: '#3D7A67',
    bg: '#D4E9DE',
    title: 'Práticas que cuidam de você',
    description:
      'Mindfulness, gratidão e respiração. Pequenos passos no seu ritmo, sem cobrança — e que ainda rendem XP pelo caminho.',
  },
  {
    Icon: Shield,
    color: '#D4973E',
    bg: '#FEF8EC',
    title: 'Apoio, não substituição',
    description:
      'O MindUni é um suporte complementar e não realiza atendimento clínico. Em momentos de crise, procure um profissional ou ligue para o CVV: 188 — gratuito, sigiloso, 24h.',
  },
  {
    // Tela de consentimento LGPD — renderizada de forma própria (com aceite).
    consent: true,
    Icon: Lock,
    color: '#3D7A67',
    bg: '#D4E9DE',
    title: 'Sua privacidade, sua escolha',
  },
];

export default function Onboarding() {
  const [current, setCurrent] = useState(0);
  const [consented, setConsented] = useState(false);
  const scrollRef = useRef(null);
  const router = useRouter();

  function goToSlide(index) {
    scrollRef.current?.scrollTo({ x: index * width, animated: true });
    setCurrent(index);
  }

  async function finish() {
    // Registra o consentimento LGPD antes de concluir o onboarding.
    await markConsentGiven();
    await markOnboardingDone();
    router.replace('/(auth)/login');
  }

  const isLast = current === SLIDES.length - 1;
  // No último slide (consentimento), o avanço fica bloqueado até o aceite.
  const canAdvance = !isLast || consented;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      {/* "Pular" leva direto ao consentimento — a parte informativa pode ser
          pulada, mas o aceite LGPD é obrigatório. */}
      {!isLast ? (
        <TouchableOpacity
          style={{ alignSelf: 'flex-end', padding: 16 }}
          onPress={() => goToSlide(SLIDES.length - 1)}
          accessibilityLabel="Pular apresentação e ir para o consentimento"
          accessibilityRole="button"
        >
          <Text style={{ color: '#A29D95', fontWeight: '600', fontSize: 14 }}>Pular</Text>
        </TouchableOpacity>
      ) : (
        <View style={{ height: 48 }} />
      )}

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        style={{ flex: 1 }}
      >
        {SLIDES.map((slide, i) => {
          const { Icon } = slide;

          if (slide.consent) {
            return (
              <View key={i} style={{ width, flex: 1 }}>
                <ScrollView contentContainerStyle={{ paddingHorizontal: 32, paddingBottom: 16 }}>
                  <View style={{ alignItems: 'center', marginTop: 8, marginBottom: 20 }}>
                    <View
                      style={{
                        width: 80, height: 80, borderRadius: 24,
                        backgroundColor: slide.bg,
                        alignItems: 'center', justifyContent: 'center',
                        marginBottom: 20,
                      }}
                    >
                      <Icon size={40} color={slide.color} />
                    </View>
                    <Text style={{ fontSize: 22, fontWeight: '700', color: '#1C1917', textAlign: 'center' }}>
                      {slide.title}
                    </Text>
                  </View>

                  <Text style={{ fontSize: 14, color: '#5A544C', lineHeight: 22, marginBottom: 14 }}>
                    Para acompanhar seu bem-estar, o MindUni guarda alguns dados seus:
                  </Text>

                  {[
                    'Seus registros de humor e anotações do diário',
                    'Suas conversas com o Sage',
                    'Seu progresso (XP, sequências e práticas concluídas)',
                  ].map((item) => (
                    <View key={item} style={{ flexDirection: 'row', marginBottom: 8, paddingRight: 8 }}>
                      <Text style={{ color: '#3D7A67', marginRight: 8, fontSize: 14 }}>•</Text>
                      <Text style={{ fontSize: 14, color: '#5A544C', lineHeight: 20, flex: 1 }}>{item}</Text>
                    </View>
                  ))}

                  <Text style={{ fontSize: 14, color: '#5A544C', lineHeight: 22, marginTop: 8 }}>
                    Esses são <Text style={{ fontWeight: '700' }}>dados sensíveis de saúde</Text>. Eles
                    são usados apenas para o funcionamento do app, ficam armazenados de forma segura e
                    nunca são vendidos. Você pode acessar ou apagar seus dados quando quiser, no seu
                    perfil.
                  </Text>

                  <TouchableOpacity
                    onPress={() => router.push('/privacy-policy')}
                    accessibilityRole="link"
                    accessibilityLabel="Abrir a Política de Privacidade completa"
                    style={{ marginTop: 12 }}
                  >
                    <Text style={{ fontSize: 14, color: '#2D6254', fontWeight: '600' }}>
                      Leia a Política de Privacidade completa
                    </Text>
                  </TouchableOpacity>

                  {/* Aceite explícito (opt-in) — exigido pela LGPD para dado sensível */}
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 20, padding: 4 }}
                    onPress={() => setConsented((v) => !v)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: consented }}
                    accessibilityLabel="Concordo com o tratamento dos meus dados conforme a LGPD"
                  >
                    <View style={{ marginRight: 10, marginTop: 1 }}>
                      {consented
                        ? <CheckSquare size={24} color="#3D7A67" />
                        : <Square size={24} color="#CEC9BF" />}
                    </View>
                    <Text style={{ fontSize: 13, color: '#3A3731', flex: 1, lineHeight: 19 }}>
                      Li e concordo com o tratamento dos meus dados de saúde emocional para uso no
                      MindUni, conforme a Lei Geral de Proteção de Dados (LGPD).
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            );
          }

          return (
            <View
              key={i}
              style={{ width, flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}
            >
              <View
                style={{
                  width: 96, height: 96, borderRadius: 28,
                  backgroundColor: slide.bg,
                  alignItems: 'center', justifyContent: 'center',
                  marginBottom: 36,
                }}
              >
                <Icon size={48} color={slide.color} />
              </View>
              <Text style={{ fontSize: 24, fontWeight: '700', color: '#1C1917', textAlign: 'center', marginBottom: 16 }}>
                {slide.title}
              </Text>
              <Text style={{ fontSize: 15, color: '#756F66', textAlign: 'center', lineHeight: 24 }}>
                {slide.description}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      {/* Pagination dots */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 24 }}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={{
              marginHorizontal: 4,
              borderRadius: 4,
              height: 8,
              width: i === current ? 24 : 8,
              backgroundColor: i === current ? '#3D7A67' : '#E6E2DB',
            }}
          />
        ))}
      </View>

      {/* Navigation buttons */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 24, paddingBottom: 32, gap: 12 }}>
        {current > 0 && (
          <TouchableOpacity
            style={{ flex: 1, borderWidth: 1, borderColor: '#E6E2DB', paddingVertical: 16, borderRadius: 16, alignItems: 'center' }}
            onPress={() => goToSlide(current - 1)}
            accessibilityLabel="Slide anterior"
            accessibilityRole="button"
          >
            <Text style={{ color: '#3A3731', fontWeight: '600' }}>Anterior</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: canAdvance ? '#3D7A67' : '#E6E2DB',
            paddingVertical: 16,
            borderRadius: 16,
            alignItems: 'center',
          }}
          onPress={isLast ? (consented ? finish : null) : () => goToSlide(current + 1)}
          disabled={!canAdvance}
          accessibilityLabel={isLast ? 'Aceitar e começar a usar o MindUni' : 'Próximo slide'}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canAdvance }}
        >
          <Text style={{ color: canAdvance ? 'white' : '#A29D95', fontWeight: '700', fontSize: 16 }}>
            {isLast ? 'Aceitar e começar' : 'Próximo'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
