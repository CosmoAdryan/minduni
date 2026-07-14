import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert, Modal, Image, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { LogOut, Flame, Award, Zap, BookOpen, MessageCircle, Calendar, Shield, Pencil, Bell } from 'lucide-react-native';
import { useUser } from '../../src/context/UserContext';
import { BADGES } from '../../src/data/badges';
import { CATEGORY_META } from '../../src/data/challenges';
import { getUserMessageCount } from '../../src/services/chatService';
import { getPracticeStats } from '../../src/services/challengeService';
import {
  getReminderPrefs, setReminderEnabled, setReminderTime, REMINDER_PRESETS,
} from '../../src/services/notificationService';
import XPBar from '../../src/components/XPBar';
import BadgeCard from '../../src/components/BadgeCard';

// Meta da badge por categoria: 10 práticas concluídas.
const CATEGORY_BADGE_GOAL = 10;

export default function ProfilePage() {
  const { currentUser, progress, logout } = useUser();
  const router = useRouter();
  const [messageCount, setMessageCount] = useState(0);
  const [practiceStats, setPracticeStats] = useState({ total: 0, byCategory: {} });
  const [selectedBadge, setSelectedBadge] = useState(null);
  // Lembrete diário local (engajamento).
  const [reminderEnabled, setReminderEnabledState] = useState(false);
  const [reminderTime, setReminderTimeState] = useState('20:00');

  useEffect(() => {
    let active = true;
    getReminderPrefs()
      .then((p) => { if (active) { setReminderEnabledState(p.enabled); setReminderTimeState(p.time); } })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  async function toggleReminder(value) {
    // Otimista: reflete na UI e reverte se a permissão for negada.
    setReminderEnabledState(value);
    const { enabled, denied } = await setReminderEnabled(value, reminderTime);
    setReminderEnabledState(enabled);
    if (denied) {
      Alert.alert(
        'Permissão necessária',
        'Para receber lembretes, ative as notificações do MindUni nas configurações do seu aparelho.',
      );
    }
  }

  async function pickTime(time) {
    setReminderTimeState(time);
    await setReminderTime(time);
  }
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
      getPracticeStats()
        .then((s) => { if (active) setPracticeStats(s); })
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
        {/* Botão de editar perfil */}
        <View className="flex-row justify-end mb-1">
          <TouchableOpacity
            className="flex-row items-center bg-white border border-stone-200 px-3 py-2 rounded-full"
            onPress={() => router.push('/edit-profile')}
            accessibilityRole="button"
            accessibilityLabel="Editar perfil"
          >
            <Pencil size={14} color="#3D7A67" style={{ marginRight: 6 }} />
            <Text style={{ color: '#2D6254' }} className="font-semibold text-sm">Editar</Text>
          </TouchableOpacity>
        </View>

        {/* Avatar */}
        <View className="items-center mb-6">
          <View className="w-24 h-24 rounded-full bg-sage-500 items-center justify-center mb-3 shadow-md overflow-hidden">
            {currentUser?.avatarUrl ? (
              <Image source={{ uri: currentUser.avatarUrl }} style={{ width: '100%', height: '100%' }} />
            ) : (
              <Text className="text-white text-3xl font-bold">{initials}</Text>
            )}
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

        {/* Histórico de práticas por categoria */}
        <View className="flex-row items-center justify-between mb-3">
          <Text className="font-bold text-stone-900 text-lg">Práticas concluídas</Text>
          {practiceStats.total > 0 && (
            <Text className="text-sm font-semibold text-sage-500">{practiceStats.total} no total</Text>
          )}
        </View>
        {practiceStats.total === 0 ? (
          <View className="bg-white rounded-2xl p-4 shadow-sm mb-6">
            <Text className="text-stone-500 text-sm text-center">
              Você ainda não concluiu práticas. Comece pelos desafios de hoje 🌱
            </Text>
          </View>
        ) : (
          <View className="bg-white rounded-2xl p-4 shadow-sm mb-6">
            {Object.entries(CATEGORY_META)
              .map(([key, meta]) => ({ key, meta, count: practiceStats.byCategory[key] || 0 }))
              .sort((a, b) => b.count - a.count)
              .map(({ key, meta, count }, idx, arr) => {
                const pct = Math.min(count / CATEGORY_BADGE_GOAL, 1) * 100;
                return (
                  <View
                    key={key}
                    style={{ marginBottom: idx === arr.length - 1 ? 0 : 14 }}
                    accessibilityLabel={`${meta.label}: ${count} ${count === 1 ? 'prática' : 'práticas'}`}
                  >
                    <View className="flex-row items-center mb-1.5">
                      <Text style={{ fontSize: 18, marginRight: 8 }}>{meta.emoji}</Text>
                      <Text className="flex-1 text-sm font-semibold text-stone-700">{meta.label}</Text>
                      <Text className="text-sm font-bold" style={{ color: meta.color }}>{count}</Text>
                    </View>
                    {/* Progresso rumo à badge da categoria (10 práticas) */}
                    <View className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#F1EEE9' }}>
                      <View className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: meta.color }} />
                    </View>
                  </View>
                );
              })}
          </View>
        )}

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

        {/* Lembrete diário */}
        <Text className="font-bold text-stone-900 text-lg mb-3">Lembretes</Text>
        <View className="bg-white rounded-2xl p-4 shadow-sm mb-6">
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-2xl items-center justify-center mr-3" style={{ backgroundColor: '#EEF5F1' }}>
              <Bell size={20} color="#3D7A67" />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-stone-800">Lembrete diário</Text>
              <Text className="text-xs text-stone-500 mt-0.5">Um empurrãozinho para seu check-in de humor</Text>
            </View>
            <Switch
              value={reminderEnabled}
              onValueChange={toggleReminder}
              trackColor={{ false: '#E6E2DB', true: '#A9D3BF' }}
              thumbColor={reminderEnabled ? '#3D7A67' : '#FAFAF8'}
              accessibilityLabel="Ativar lembrete diário"
            />
          </View>

          {reminderEnabled && (
            <View className="mt-4 pt-4 border-t border-stone-100">
              <Text className="text-xs font-semibold text-stone-500 mb-2">HORÁRIO</Text>
              <View className="flex-row gap-2">
                {REMINDER_PRESETS.map(({ label, time }) => {
                  const selected = reminderTime === time;
                  return (
                    <TouchableOpacity
                      key={time}
                      className="flex-1 py-2.5 rounded-xl items-center"
                      style={{
                        backgroundColor: selected ? '#3D7A67' : '#F4F2EE',
                        borderWidth: selected ? 0 : 1,
                        borderColor: '#E6E2DB',
                      }}
                      onPress={() => pickTime(time)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      accessibilityLabel={`Lembrete às ${time}, ${label}`}
                    >
                      <Text className="text-sm font-semibold" style={{ color: selected ? 'white' : '#57534E' }}>{label}</Text>
                      <Text className="text-xs mt-0.5" style={{ color: selected ? 'rgba(255,255,255,0.8)' : '#A29D95' }}>{time}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
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
