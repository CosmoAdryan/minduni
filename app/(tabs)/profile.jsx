import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { LogOut, Flame, Award, Zap, BookOpen, MessageCircle, Calendar, Shield } from 'lucide-react-native';
import { useUser } from '../../src/context/UserContext';
import { BADGES } from '../../src/data/badges';
import { getUserMessageCount } from '../../src/services/chatService';
import XPBar from '../../src/components/XPBar';
import BadgeCard from '../../src/components/BadgeCard';

export default function ProfilePage() {
  const { currentUser, progress, logout } = useUser();
  const router = useRouter();
  const [messageCount, setMessageCount] = useState(0);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const selectedUnlocked = selectedBadge
    ? (progress.unlockedBadges || []).includes(selectedBadge.id)
    : false;

  // Recarrega a contagem de mensagens ao focar o perfil.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      getUserMessageCount()
        .then((n) => { if (active) setMessageCount(n); })
        .catch(() => {});
      return () => { active = false; };
    }, [])
  );

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
    { label: 'XP Total', value: progress.totalXP || 0, icon: Zap, color: '#D4973E' },
    { label: 'Streak', value: `${progress.streak || 0}d`, icon: Flame, color: '#F97316' },
    { label: 'Conquistas', value: (progress.unlockedBadges || []).length, icon: Award, color: '#3D7A67' },
    { label: 'Dias ativos', value: progress.daysActive || 1, icon: Calendar, color: '#10B981' },
    { label: 'Entradas', value: progress.journalEntries || 0, icon: BookOpen, color: '#6366F1' },
    { label: 'Mensagens', value: messageCount, icon: MessageCircle, color: '#3B82F6' },
  ];

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-stone-50">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {/* Avatar */}
        <View className="items-center mb-6">
          <View className="w-24 h-24 rounded-full bg-sage-500 items-center justify-center mb-3 shadow-md">
            <Text className="text-white text-3xl font-bold">{initials}</Text>
          </View>
          <Text className="text-xl font-bold text-stone-900">{currentUser?.name}</Text>
          <Text className="text-stone-500 text-sm">{currentUser?.email}</Text>
          {currentUser?.createdAt && (
            <Text className="text-stone-400 text-xs mt-1">
              Membro desde {new Date(currentUser.createdAt).toLocaleDateString('pt-BR')}
            </Text>
          )}
        </View>

        {/* XP Bar */}
        <View className="mb-4">
          <XPBar />
        </View>

        {/* Stats */}
        <Text className="font-bold text-stone-900 text-lg mb-3">Estatísticas</Text>
        <View className="flex-row flex-wrap gap-3 mb-6">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <View key={label} className="bg-white rounded-2xl p-4 shadow-sm items-center" style={{ width: '30%', flexGrow: 1 }}>
              <Icon size={22} color={color} />
              <Text className="text-xl font-bold text-stone-900 mt-1">{value}</Text>
              <Text className="text-xs text-stone-500 text-center">{label}</Text>
            </View>
          ))}
        </View>

        {/* Badges */}
        <Text className="font-bold text-stone-900 text-lg mb-3">Conquistas</Text>
        <View className="flex-row flex-wrap mb-6">
          {BADGES.map((badge) => (
            <BadgeCard
              key={badge.id}
              badge={badge}
              unlocked={(progress.unlockedBadges || []).includes(badge.id)}
              onPress={() => setSelectedBadge(badge)}
            />
          ))}
        </View>

        {/* Política de Privacidade */}
        <TouchableOpacity
          className="bg-white border border-stone-200 py-4 rounded-2xl flex-row items-center justify-center mb-3"
          onPress={() => router.push('/privacy-policy')}
          accessibilityRole="link"
          accessibilityLabel="Abrir a Política de Privacidade"
        >
          <Shield size={18} color="#3D7A67" style={{ marginRight: 8 }} />
          <Text style={{ color: '#2D6254' }} className="font-semibold">Política de Privacidade</Text>
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity
          className="bg-red-50 border border-red-200 py-4 rounded-2xl flex-row items-center justify-center"
          onPress={handleLogout}
        >
          <LogOut size={18} color="#EF4444" style={{ marginRight: 8 }} />
          <Text className="text-red-500 font-semibold">Sair da conta</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal de descrição da conquista */}
      <Modal
        visible={!!selectedBadge}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedBadge(null)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setSelectedBadge(null)}
          style={{ flex: 1, backgroundColor: 'rgba(28,25,23,0.45)', alignItems: 'center', justifyContent: 'center', padding: 32 }}
        >
          {selectedBadge && (
            <View style={{ backgroundColor: 'white', borderRadius: 24, padding: 24, alignItems: 'center', width: '100%', maxWidth: 320 }}>
              <Text style={{ fontSize: 56, marginBottom: 8, opacity: selectedUnlocked ? 1 : 0.4 }}>
                {selectedBadge.icon}
              </Text>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#1C1917', textAlign: 'center' }}>
                {selectedBadge.name}
              </Text>
              <View style={{
                marginTop: 8, marginBottom: 12, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999,
                backgroundColor: selectedUnlocked ? '#EEF5F1' : '#F4F2EE',
              }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: selectedUnlocked ? '#1E4D41' : '#A29D95' }}>
                  {selectedUnlocked ? '✓ Conquistado' : '🔒 Bloqueado'}
                </Text>
              </View>
              {!selectedUnlocked && (
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#A29D95', letterSpacing: 0.5, marginBottom: 4 }}>
                  COMO CONQUISTAR
                </Text>
              )}
              <Text style={{ fontSize: 14, color: '#57534E', textAlign: 'center', lineHeight: 20 }}>
                {selectedBadge.description}
              </Text>
              <TouchableOpacity
                onPress={() => setSelectedBadge(null)}
                style={{ marginTop: 20, backgroundColor: '#3D7A67', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 16 }}
                accessibilityRole="button"
                accessibilityLabel="Fechar"
              >
                <Text style={{ color: 'white', fontWeight: '700' }}>Fechar</Text>
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
