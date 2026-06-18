import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Flame } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

/**
 * StreakCard — aparece no Dashboard no primeiro acesso do dia.
 * Spring com leve rotação (nasce pequeno e inclinado, estabiliza no eixo).
 * Tom celebratório, nunca punitivo: fala do retorno, não da perda.
 */
export default function StreakCard({ streak }) {
  const scale = useSharedValue(0);
  const rotate = useSharedValue(-8);
  const opacity = useSharedValue(0);

  useEffect(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    opacity.value = withTiming(1, { duration: 180 });
    scale.value = withSpring(1, { damping: 10, stiffness: 160 });
    rotate.value = withSpring(0, { damping: 12, stiffness: 200 });
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
  }));

  return (
    <Animated.View
      accessibilityLabel={`Você voltou. ${streak} dias seguidos.`}
      style={[
        {
          backgroundColor: 'white',
          borderRadius: 16,
          padding: 14,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: '#D4E9DE',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        },
        style,
      ]}
    >
      <View
        style={{
          width: 38, height: 38, borderRadius: 11,
          backgroundColor: '#FEF8EC', borderWidth: 1.5, borderColor: '#FCEECE',
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Flame size={18} color="#D4973E" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: '#1C1917' }}>
          {streak} {streak === 1 ? 'dia' : 'dias'} seguidos! 🎉
        </Text>
        <Text style={{ fontSize: 11, color: '#A29D95' }}>Você voltou — continue hoje</Text>
      </View>
      <View style={{ backgroundColor: '#FEF8EC', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999 }}>
        <Text style={{ fontSize: 10, fontWeight: '700', color: '#B87A28' }}>+10 XP</Text>
      </View>
    </Animated.View>
  );
}
