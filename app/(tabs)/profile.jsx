import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, SafeAreaView, Alert,
} from 'react-native';
import { LogOut, Flame, Award, Zap, BookOpen, MessageCircle, Calendar } from 'lucide-react-native';
import { useUser } from '../../src/context/UserContext';
import { BADGES } from '../../src/data/badges';
import XPBar from '../../src/components/XPBar';
import BadgeCard from '../../src/components/BadgeCard';
import { T } from '../../src/theme';

export default function ProfilePage() {
  const { currentUser, progress, logout } = useUser();

  function handleLogout() {
    Alert.alert('Sair', 'Tem certeza que quer sair?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: logout },
    ]);
  }

  const initials = currentUser?.name
    ? currentUser.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'MQ';

  const stats = [
    { label: 'XP Total', value: progress.totalXP || 0, icon: Zap, color: T.a400 },
    { label: 'Streak', value: `${progress.streak || 0}d`, icon: Flame, color: T.a400 },
    { label: 'Conquistas', value: (progress.unlockedBadges || []).length, icon: Award, color: T.g500 },
    { label: 'Dias ativos', value: progress.daysActive || 1, icon: Calendar, color: T.g600 },
    { label: 'Entradas', value: progress.journalEntries || 0, icon: BookOpen, color: T.g500 },
    { label: 'Sessões', value: progress.chatSessions || 0, icon: MessageCircle, color: T.g400 },
  ];

  return (
    <SafeAreaView className="flex-1 bg-stone-50">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {/* Avatar */}
        <View className="items-center mb-6">
          <View className="w-24 h-24 rounded-full bg-sage-500 items-center justify-center mb-3 shadow-md">
            <Text className="text-white text-3xl font-bold">{initials}</Text>
          </View>
          <Text className="text-xl font-bold text-gray-900">{currentUser?.name}</Text>
          <Text className="text-gray-500 text-sm">{currentUser?.email}</Text>
          {currentUser?.createdAt && (
            <Text className="text-gray-400 text-xs mt-1">
              Membro desde {new Date(currentUser.createdAt).toLocaleDateString('pt-BR')}
            </Text>
          )}
        </View>

        {/* XP Bar */}
        <View className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <XPBar />
        </View>

        {/* Stats */}
        <Text className="font-bold text-gray-900 text-lg mb-3">Estatísticas</Text>
        <View className="flex-row flex-wrap gap-3 mb-6">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <View key={label} className="bg-white rounded-2xl p-4 shadow-sm items-center" style={{ width: '30%', flexGrow: 1 }}>
              <Icon size={22} color={color} />
              <Text className="text-xl font-bold text-gray-900 mt-1">{value}</Text>
              <Text className="text-xs text-gray-500 text-center">{label}</Text>
            </View>
          ))}
        </View>

        {/* Badges */}
        <Text className="font-bold text-gray-900 text-lg mb-3">Conquistas</Text>
        <View className="flex-row flex-wrap mb-6">
          {BADGES.map((badge) => (
            <BadgeCard
              key={badge.id}
              badge={badge}
              unlocked={(progress.unlockedBadges || []).includes(badge.id)}
            />
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity
          className="bg-red-50 border border-red-200 py-4 rounded-2xl flex-row items-center justify-center"
          onPress={handleLogout}
        >
          <LogOut size={18} color="#EF4444" style={{ marginRight: 8 }} />
          <Text className="text-red-500 font-semibold">Sair da conta</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
