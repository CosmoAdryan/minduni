import React from 'react';
import { Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Opção de humor com micro-interação de tap (spring de aperto e release).
 * Cor semântica Jonauskaite no border/bg quando selecionado. Háptico leve.
 * Reutilizado na pré/pós-tela do chat e no diário.
 */
export default function MoodOption({
  emoji,
  label,
  color,
  selected,
  onPress,
  emojiSize = 32,
  accessibilityLabel,
}) {
  const scale = useSharedValue(1);

  const handlePress = () => {
    // 1.0 → 0.93 (aperto) → 1.0 com overshoot (release)
    scale.value = withSequence(
      withTiming(0.93, { duration: 90 }),
      withSpring(1, { damping: 10, stiffness: 200 }),
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress?.();
  };

  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      onPress={handlePress}
      accessibilityLabel={accessibilityLabel || label}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={[
        {
          alignItems: 'center',
          paddingVertical: 10,
          paddingHorizontal: 8,
          borderRadius: 16,
          borderWidth: 2,
          borderColor: selected ? color : 'transparent',
          backgroundColor: selected ? `${color}1A` : '#F4F2EE',
        },
        aStyle,
      ]}
    >
      <Text style={{ fontSize: emojiSize }}>{emoji}</Text>
      <Text
        style={{
          fontSize: 11,
          marginTop: 4,
          color: selected ? color : '#5A544C',
          fontWeight: selected ? '700' : '400',
        }}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
}
