import React from 'react';
import { Text, TouchableOpacity } from 'react-native';

// Mapa estático de variantes — substitui o className dinâmico (badge.color),
// que não era resolvido pelo build do NativeWind. Valores dos tokens da Fase 4.
const VARIANTS = {
  sage:  { bg: '#EEF5F1', text: '#1E4D41' }, // sage-50 / sage-700
  amber: { bg: '#FEF8EC', text: '#B87A28' }, // xp-light / xp-dark
};
const LOCKED = { bg: '#F4F2EE', text: '#A29D95' }; // stone-100 / stone-400

export default function BadgeCard({ badge, unlocked, onPress }) {
  const style = unlocked ? (VARIANTS[badge.variant] || VARIANTS.sage) : LOCKED;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        flex: 1,
        minWidth: 70,
        alignItems: 'center',
        padding: 12,
        margin: 4,
        borderRadius: 16,
        backgroundColor: style.bg,
        opacity: unlocked ? 1 : 0.6,
      }}
      accessibilityRole="button"
      accessibilityLabel={unlocked ? `${badge.name}, conquistado` : `${badge.name}, ainda não conquistado`}
      accessibilityHint="Toque para ver a descrição"
    >
      <Text style={{ fontSize: 28, marginBottom: 4, opacity: unlocked ? 1 : 0.45 }}>
        {badge.icon}
      </Text>
      <Text
        style={{ fontSize: 11, fontWeight: '600', textAlign: 'center', color: style.text }}
        numberOfLines={2}
      >
        {badge.name}
      </Text>
    </TouchableOpacity>
  );
}
