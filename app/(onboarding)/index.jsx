import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Brain, MessageCircle, Target, Shield } from 'lucide-react-native';
import { markOnboardingDone } from '../../src/services/onboardingService';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    Icon: Brain,
    color: '#8B5CF6',
    bg: '#EDE9FE',
    title: 'Bem-vindo ao MindUni',
    description:
      'Sua jornada de bem-estar mental começa aqui. Um espaço seguro, gratuito e sem julgamentos para cuidar da sua saúde emocional.',
  },
  {
    Icon: MessageCircle,
    color: '#3B82F6',
    bg: '#EFF6FF',
    title: 'Converse com o Sage',
    description:
      'O Sage é seu companheiro digital baseado em Terapia Cognitivo-Comportamental (TCC). Ele te ouve e oferece apoio sempre que precisar.',
  },
  {
    Icon: Target,
    color: '#10B981',
    bg: '#D1FAE5',
    title: 'Desafios que cuidam de você',
    description:
      'Mindfulness, gratidão e respiração. Complete desafios diários, ganhe XP e evolua enquanto cuida da sua mente.',
  },
  {
    Icon: Shield,
    color: '#F59E0B',
    bg: '#FEF3C7',
    title: 'Apoio, não substituição',
    description:
      'O MindUni é um suporte complementar. Em momentos de crise, sempre procure um profissional ou ligue para o CVV: 188 (gratuito, 24h).',
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      {/* Skip button */}
      {!isLast && (
        <TouchableOpacity
          style={{ alignSelf: 'flex-end', padding: 16 }}
          onPress={finish}
          accessibilityLabel="Pular apresentação"
          accessibilityRole="button"
        >
          <Text style={{ color: '#9CA3AF', fontWeight: '600', fontSize: 14 }}>Pular</Text>
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
              <Text style={{ fontSize: 24, fontWeight: '700', color: '#1F2937', textAlign: 'center', marginBottom: 16 }}>
                {slide.title}
              </Text>
              <Text style={{ fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 24 }}>
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
              backgroundColor: i === current ? '#8B5CF6' : '#E5E7EB',
            }}
          />
        ))}
      </View>

      {/* Navigation buttons */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 24, paddingBottom: 32, gap: 12 }}>
        {current > 0 && (
          <TouchableOpacity
            style={{ flex: 1, borderWidth: 1, borderColor: '#E5E7EB', paddingVertical: 16, borderRadius: 16, alignItems: 'center' }}
            onPress={() => goToSlide(current - 1)}
            accessibilityLabel="Slide anterior"
            accessibilityRole="button"
          >
            <Text style={{ color: '#374151', fontWeight: '600' }}>Anterior</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: '#8B5CF6', paddingVertical: 16, borderRadius: 16, alignItems: 'center' }}
          onPress={isLast ? finish : () => goToSlide(current + 1)}
          accessibilityLabel={isLast ? 'Começar a usar o MindUni' : 'Próximo slide'}
          accessibilityRole="button"
        >
          <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>
            {isLast ? 'Começar' : 'Próximo'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
