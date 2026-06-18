import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useUser } from '../context/UserContext';

// Barra de progresso que anima o preenchimento sempre que o XP muda.
// Material ease — acelera rápido, desacelera suave no destino.
function AnimatedFill({ percent, track, fill, height }) {
  const w = useSharedValue(percent);

  useEffect(() => {
    w.value = withTiming(percent, { duration: 700, easing: Easing.out(Easing.cubic) });
  }, [percent]);

  const style = useAnimatedStyle(() => ({ width: `${w.value}%` }));

  return (
    <View style={{ height, backgroundColor: track, borderRadius: 999, overflow: 'hidden' }}>
      <Animated.View style={[{ height: '100%', backgroundColor: fill, borderRadius: 999 }, style]} />
    </View>
  );
}

export default function XPBar({ compact = false }) {
  const { progress, levelInfo, nextLevel } = useUser();

  const currentXP = progress.totalXP || 0;
  const currentLevelXP = levelInfo.minXP;
  const nextLevelXP = nextLevel ? nextLevel.minXP : levelInfo.maxXP;
  const range = nextLevelXP - currentLevelXP;
  const gained = currentXP - currentLevelXP;
  const percent = range > 0 ? Math.min(100, Math.round((gained / range) * 100)) : 100;
  const isMax = levelInfo.level === 10;

  if (compact) {
    return (
      <View className="px-3 py-2">
        <View className="flex-row justify-between items-center mb-1">
          <Text className="text-xs font-semibold text-sage-600">Nível {levelInfo.level}</Text>
          <Text className="text-xs text-stone-500">{isMax ? 'MAX' : `${percent}%`}</Text>
        </View>
        <AnimatedFill percent={percent} track="#EEF5F1" fill="#3D7A67" height={8} />
      </View>
    );
  }

  return (
    <View className="bg-white rounded-2xl p-4 shadow-sm">
      <View className="flex-row justify-between items-center mb-2">
        <View>
          <Text className="text-lg font-bold text-stone-900">Nível {levelInfo.level}</Text>
          <Text className="text-sm text-sage-500 font-medium">{levelInfo.name}</Text>
        </View>
        <View className="items-end">
          <Text className="text-2xl font-bold text-sage-500">{currentXP}</Text>
          <Text className="text-xs text-stone-500">XP total</Text>
        </View>
      </View>
      <View
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: percent, text: isMax ? 'Nível máximo' : `${percent}% para o próximo nível` }}
        className="mb-1"
      >
        <AnimatedFill percent={percent} track="#EEF5F1" fill="#3D7A67" height={12} />
      </View>
      <View className="flex-row justify-between">
        <Text className="text-xs text-stone-500">{currentXP} XP</Text>
        {isMax ? (
          <Text className="text-xs font-bold text-sage-500">NÍVEL MÁXIMO!</Text>
        ) : (
          <Text className="text-xs text-stone-500">{nextLevelXP} XP</Text>
        )}
      </View>
    </View>
  );
}
