import React from 'react';
import { View, Text } from 'react-native';
import { useUser } from '../context/UserContext';
import { LEVELS } from '../context/UserContext';

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
          <Text className="text-xs font-semibold text-purple-700">Nível {levelInfo.level}</Text>
          <Text className="text-xs text-gray-500">{isMax ? 'MAX' : `${percent}%`}</Text>
        </View>
        <View className="h-2 bg-purple-100 rounded-full overflow-hidden">
          <View
            className="h-full bg-purple-500 rounded-full"
            style={{ width: `${percent}%` }}
          />
        </View>
      </View>
    );
  }

  return (
    <View className="bg-white rounded-2xl p-4 shadow-sm">
      <View className="flex-row justify-between items-center mb-2">
        <View>
          <Text className="text-lg font-bold text-gray-800">Nível {levelInfo.level}</Text>
          <Text className="text-sm text-purple-600 font-medium">{levelInfo.name}</Text>
        </View>
        <View className="items-end">
          <Text className="text-2xl font-bold text-purple-600">{currentXP}</Text>
          <Text className="text-xs text-gray-500">XP total</Text>
        </View>
      </View>
      <View className="h-3 bg-purple-100 rounded-full overflow-hidden mb-1">
        <View
          className="h-full rounded-full"
          style={{
            width: `${percent}%`,
            backgroundColor: '#8B5CF6',
          }}
        />
      </View>
      <View className="flex-row justify-between">
        <Text className="text-xs text-gray-500">{currentXP} XP</Text>
        {isMax ? (
          <Text className="text-xs font-bold text-purple-600">NÍVEL MÁXIMO!</Text>
        ) : (
          <Text className="text-xs text-gray-500">{nextLevelXP} XP</Text>
        )}
      </View>
    </View>
  );
}
