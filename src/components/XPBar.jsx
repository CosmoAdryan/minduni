import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import { useUser } from '../context/UserContext';
import { LEVELS } from '../context/UserContext';
import { T } from '../theme';

export default function XPBar({ compact = false }) {
  const { progress, levelInfo, nextLevel } = useUser();

  const currentXP = progress.totalXP || 0;
  const currentLevelXP = levelInfo.minXP;
  const nextLevelXP = nextLevel ? nextLevel.minXP : levelInfo.maxXP;
  const range = nextLevelXP - currentLevelXP;
  const gained = currentXP - currentLevelXP;
  const percent = range > 0 ? Math.min(100, Math.round((gained / range) * 100)) : 100;
  const isMax = levelInfo.level === 10;

  // Animação de preenchimento (material ease, 700ms) ao mudar a porcentagem.
  const fill = useRef(new Animated.Value(percent)).current;
  useEffect(() => {
    Animated.timing(fill, {
      toValue: percent,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [percent]);
  const widthInterp = fill.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });

  if (compact) {
    return (
      <View className="px-3 py-2">
        <View className="flex-row justify-between items-center mb-1">
          <Text style={{ fontSize: 11, fontWeight: '700', color: T.g700 }}>Nível {levelInfo.level}</Text>
          <Text style={{ fontSize: 11, color: T.s500 }}>{isMax ? 'MAX' : `${percent}%`}</Text>
        </View>
        <View style={{ height: 8, backgroundColor: T.g50, borderRadius: 99, overflow: 'hidden' }}>
          <Animated.View style={{ height: '100%', width: widthInterp, backgroundColor: T.g500, borderRadius: 99 }} />
        </View>
      </View>
    );
  }

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: percent, text: isMax ? 'Nível máximo' : `${percent}% para o próximo nível` }}
    >
      <View className="flex-row justify-between items-center mb-2">
        <View>
          <Text style={{ fontSize: 17, fontWeight: '800', color: T.s900 }}>Nível {levelInfo.level}</Text>
          <Text style={{ fontSize: 13, color: T.g500, fontWeight: '600' }}>{levelInfo.name}</Text>
        </View>
        <View className="items-end">
          <Text style={{ fontSize: 24, fontWeight: '800', color: T.g500 }}>{currentXP}</Text>
          <Text style={{ fontSize: 11, color: T.s400 }}>XP total</Text>
        </View>
      </View>
      <View style={{ height: 6, backgroundColor: T.g50, borderRadius: 99, overflow: 'hidden', marginBottom: 4 }}>
        <Animated.View style={{ height: '100%', width: widthInterp, backgroundColor: T.g500, borderRadius: 99 }} />
      </View>
      <View className="flex-row justify-between">
        <Text style={{ fontSize: 11, color: T.s400 }}>{currentXP} XP</Text>
        {isMax ? (
          <Text style={{ fontSize: 11, fontWeight: '700', color: T.g500 }}>NÍVEL MÁXIMO!</Text>
        ) : (
          <Text style={{ fontSize: 11, color: T.s400 }}>{nextLevelXP} XP</Text>
        )}
      </View>
    </View>
  );
}
