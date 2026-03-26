import React from 'react';
import { View, Text } from 'react-native';

export default function BadgeCard({ badge, unlocked }) {
  return (
    <View
      className={`items-center p-3 rounded-2xl ${unlocked ? badge.color : 'bg-gray-100'} m-1`}
      style={{ opacity: unlocked ? 1 : 0.5, flex: 1, minWidth: 70 }}
    >
      <Text style={{ fontSize: 28, marginBottom: 4, filter: unlocked ? 'none' : 'grayscale(100%)' }}>
        {badge.icon}
      </Text>
      <Text
        className={`text-xs font-semibold text-center ${unlocked ? badge.textColor : 'text-gray-400'}`}
        numberOfLines={2}
      >
        {badge.name}
      </Text>
    </View>
  );
}
