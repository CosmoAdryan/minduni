import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Brain, MessageCircle, Clock, Shield } from 'lucide-react-native';
import { markOnboardingDone } from '../../src/services/onboardingService';
import { T, SAGE_FONT } from '../../src/theme';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    Icon: Brain,
    color: T.g500,
    bg: T.g50,
    title: 'Bem-vindo ao MindUni',
    description:
      'Um espaço seguro, gratuito e sem julgamentos para cuidar da sua saúde emocional. Você não precisa estar bem para começar.',
  },
  {
    Icon: MessageCircle,
    color: T.g500,
    bg: T.g100,
    title: 'Converse com o Sage',
    description:
      'O Sage te ouve com atenção e oferece apoio sempre que precisar — no seu ritmo, sem pressa.',
  },
  {
    Icon: Clock,
    color: T.a400,
    bg: T.a50,
    title: 'Práticas que cuidam de você',
    description:
      'Mindfulness, gratidão e respiração. Pequenos passos diários enquanto você cuida da sua mente.',
  },
  {
    Icon: Shield,
    color: T.g400,
    bg: 'rgba(94,155,132,0.15)',
    title: 'Você não precisa estar bem para começar',
    description:
      'O MindUni é um apoio complementar. Em momentos de crise, ligue para o CVV: 188 (gratuito, 24h).',
    dark: true,
  },
];

export default function Onboarding() {
  const [current, setCurrent] = useState(0);
  const scrollRef = useRef(null);
  const router = useRouter();

  function goToSlide(index) {
    scrollRef.current?.scrollTo({ x: index * width, animated: true });
    setCurrent(index);
  }

  async function finish() {
    await markOnboardingDone();
    router.replace('/(auth)/login');
  }

  const isLast = current === SLIDES.length - 1;
  const dark = isLast;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: dark ? T.dk : '#fff' }}>
      {/* Skip button */}
      {!isLast && (
        <TouchableOpacity
          style={{ alignSelf: 'flex-end', padding: 16 }}
          onPress={finish}
          accessibilityLabel="Pular apresentação"
          accessibilityRole="button"
        >
          <Text style={{ color: T.s400, fontWeight: '600', fontSize: 14 }}>Pular</Text>
        </TouchableOpacity>
      )}
      {isLast && <View style={{ height: 48 }} />}

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
              <Text style={{ fontSize: 24, fontWeight: '800', color: slide.dark ? '#fff' : T.s900, textAlign: 'center', marginBottom: 16, letterSpacing: -0.3 }}>
                {slide.title}
              </Text>
              <Text style={{ fontFamily: slide.dark ? SAGE_FONT : undefined, fontStyle: slide.dark ? 'italic' : 'normal', fontSize: 15, color: slide.dark ? T.s400 : T.s500, textAlign: 'center', lineHeight: 24 }}>
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
              backgroundColor: i === current ? T.g500 : (dark ? T.dkb : T.s200),
            }}
          />
        ))}
      </View>

      {/* Navigation buttons */}
      {isLast ? (
        <View style={{ paddingHorizontal: 24, paddingBottom: 32, gap: 10 }}>
          <TouchableOpacity
            style={{ backgroundColor: T.g500, paddingVertical: 16, borderRadius: 16, alignItems: 'center' }}
            onPress={finish}
            accessibilityLabel="Criar conta"
            accessibilityRole="button"
          >
            <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>Criar conta</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ borderWidth: 1.5, borderColor: T.dkb, paddingVertical: 16, borderRadius: 16, alignItems: 'center' }}
            onPress={finish}
            accessibilityLabel="Explorar primeiro"
            accessibilityRole="button"
          >
            <Text style={{ color: T.s400, fontWeight: '600', fontSize: 15 }}>Explorar primeiro</Text>
          </TouchableOpacity>
          <Text style={{ color: T.s500, fontSize: 11, textAlign: 'center', marginTop: 4 }}>
            Sem conta, seu progresso fica só neste dispositivo.
          </Text>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', paddingHorizontal: 24, paddingBottom: 32, gap: 12 }}>
          {current > 0 && (
            <TouchableOpacity
              style={{ flex: 1, borderWidth: 1, borderColor: T.s200, paddingVertical: 16, borderRadius: 16, alignItems: 'center' }}
              onPress={() => goToSlide(current - 1)}
              accessibilityLabel="Slide anterior"
              accessibilityRole="button"
            >
              <Text style={{ color: T.s700, fontWeight: '600' }}>Anterior</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: T.g500, paddingVertical: 16, borderRadius: 16, alignItems: 'center' }}
            onPress={() => goToSlide(current + 1)}
            accessibilityLabel="Próximo slide"
            accessibilityRole="button"
          >
            <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>Próximo</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
