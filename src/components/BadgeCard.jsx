import React from 'react';
import { View, Text } from 'react-native';

// Mapa ESTÁTICO de variantes — corrige o bug de className dinâmico do NativeWind.
// (Antes: className={badge.color} não funcionava no build.)
const VARIANTS = {
  'unlocked-sage':  { bg: '#EEF5F1', text: '#1E4D41' },
  'unlocked-amber': { bg: '#FEF8EC', text: '#B87A28' },
  locked:           { bg: '#F4F2EE', text: '#A29D95' },
};

export default function BadgeCard({ badge, unlocked }) {
  const key = unlocked ? `unlocked-${badge.variant || 'sage'}` : 'locked';
  const v = VARIANTS[key] || VARIANTS.locked;

  return (
    <View
      className="items-center p-3 rounded-lg m-1"
      style={{ backgroundColor: v.bg, opacity: unlocked ? 1 : 0.55, flex: 1, minWidth: 70 }}
      accessibilityLabel={unlocked ? badge.name : `${badge.name} ainda não conquistado`}
    >
      <Text style={{ fontSize: 28, marginBottom: 4, opacity: unlocked ? 1 : 0.5 }}>
        {badge.icon}
      </Text>
      <Text
        className="text-xs font-semibold text-center"
        style={{ color: v.text }}
        numberOfLines={2}
      >
        {badge.name}
      </Text>
    </View>
  );
}
