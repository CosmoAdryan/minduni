import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MessageCircle, Target, BookOpen, User, Flame, Award, Zap, ChevronRight } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '../../src/context/UserContext';
import XPBar from '../../src/components/XPBar';
import StreakCard from '../../src/components/StreakCard';
import { getDailyChallenges } from '../../src/data/challenges';
import { getCompletedToday } from '../../src/services/challengeService';

const QUICK_ACTIONS = [
  { title: 'Conversar com o Sage', icon: MessageCircle, color: '#3D7A67', bg: '#D4E9DE', route: '/chat' },
  { title: 'Práticas', icon: Target, color: '#3D7A67', bg: '#EEF5F1', route: '/challenges' },
  { title: 'Diário', icon: BookOpen, color: '#D4973E', bg: '#FEF8EC', route: '/journal' },
  { title: 'Jornada', icon: User, color: '#5A544C', bg: '#F4F2EE', route: '/profile' },
];

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
// Escala Jonauskaite (2020) — tristeza é azul profundo, nunca vermelho.
const MOOD_COLORS = ['#3B6FAB', '#6B8FAB', '#888787', '#5E9B84', '#C9963A'];
const MOOD_EMOJIS = ['😢', '😔', '😐', '😊', '😄'];

function MoodChart({ moodData }) {
  if (moodData.length === 0) return null;

  const avg = moodData.reduce((s, m) => s + m.mood, 0) / moodData.length;
  const insight =
    avg >= 4
      ? 'Sua semana foi excelente! Continue assim 🌟'
      : avg >= 3
      ? 'Semana estável. Pequenos passos importam 💚'
      : 'Semana desafiadora. O Sage está aqui para te ouvir 💙';

  return (
    <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, elevation: 1 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: '#1C1917' }}>Humor recente</Text>
        <Text style={{ fontSize: 12, color: '#3D7A67', fontWeight: '600' }}>
          Média: {MOOD_EMOJIS[Math.round(avg) - 1]}
        </Text>
      </View>
      {/* Chart area with average line overlay */}
      <View style={{ position: 'relative' }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 72, marginBottom: 4 }}>
          {moodData.map((m, i) => {
            const dayLabel = DAY_LABELS[new Date(m.date).getDay()];
            const barH = Math.max(8, (m.mood / 5) * 60);
            return (
              <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
                <View
                  style={{ width: 20, borderRadius: 6, height: barH, backgroundColor: MOOD_COLORS[m.mood - 1], opacity: 0.85 }}
                />
                <Text style={{ fontSize: 9, color: '#A29D95', marginTop: 3 }}>{dayLabel}</Text>
              </View>
            );
          })}
        </View>
        {/* Linha de média — posicionada na altura correspondente ao valor médio */}
        <View
          accessibilityLabel={`Linha de média de humor`}
          style={{
            position: 'absolute',
            left: 4,
            right: 4,
            // 12px = espaço dos labels de dia; avg bar height proporcional a 60px de área
            bottom: 12 + Math.max(8, (avg / 5) * 60),
            height: 1.5,
            backgroundColor: '#3D7A67',
            opacity: 0.55,
            borderRadius: 1,
          }}
        />
      </View>
      <Text style={{ fontSize: 12, color: '#756F66', marginTop: 4, fontStyle: 'italic' }}>{insight}</Text>
    </View>
  );
}

export default function Dashboard() {
  const { currentUser, progress, loading } = useUser();
  const router = useRouter();
  const [featuredChallenge, setFeaturedChallenge] = useState(null);
  const [loadingChallenge, setLoadingChallenge] = useState(true);
  const [showStreak, setShowStreak] = useState(false);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  const firstName = currentUser?.name?.split(' ')[0] || 'Explorador';

  const moodData = (progress.moods || []).filter((m) => m.date).slice(-7);

  useEffect(() => {
    async function loadFeaturedChallenge() {
      try {
        const completed = await getCompletedToday();
        const today = getDailyChallenges();
        const list = [
          { ...today.mindfulness, type: 'mindfulness' },
          { ...today.gratitude, type: 'gratitude' },
          { ...today.breathing, type: 'breathing' },
        ];
        const next = list.find((c) => !completed.includes(c.id));
        setFeaturedChallenge(next || null);
      } finally {
        setLoadingChallenge(false);
      }
    }
    loadFeaturedChallenge();
  }, []);

  // Streak pop — só no primeiro acesso do dia (flag por data no AsyncStorage).
  useEffect(() => {
    if (loading || !(progress.streak > 0)) return;
    (async () => {
      const today = new Date().toDateString();
      const last = await AsyncStorage.getItem('minduni_streak_pop');
      if (last !== today) {
        setShowStreak(true);
        await AsyncStorage.setItem('minduni_streak_pop', today);
      }
    })();
  }, [loading, progress.streak]);

  if (loading) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-stone-50 items-center justify-center">
        <ActivityIndicator size="large" color="#3D7A67" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-stone-50">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Header */}
        <View className="bg-sage-500 px-6 pt-6 pb-10">
          <Text className="text-sage-100 text-sm">{greeting},</Text>
          <Text className="text-white text-2xl font-bold">{firstName}! 👋</Text>
        </View>

        <View className="px-4 -mt-6">
          {/* XP Card */}
          <View
            className="bg-white rounded-2xl p-4 shadow-md mb-4"
            accessibilityLabel={`Nível ${progress.level}, ${progress.totalXP || 0} XP total`}
          >
            <XPBar />
          </View>

          {/* Streak pop — primeiro acesso do dia */}
          {showStreak && <StreakCard streak={progress.streak} />}

          {/* Featured Challenge — Desafio do Dia */}
          {!loadingChallenge && (
            <TouchableOpacity
              className="rounded-2xl p-4 mb-4 shadow-md"
              style={{ backgroundColor: featuredChallenge ? '#2D6254' : '#F0FDF4', borderWidth: featuredChallenge ? 0 : 1, borderColor: '#BBF7D0' }}
              onPress={() => router.push('/challenges')}
              accessibilityLabel={featuredChallenge ? `Desafio do dia: ${featuredChallenge.title}, +${featuredChallenge.xp} XP` : 'Todos os desafios concluídos hoje'}
              accessibilityRole="button"
            >
              {featuredChallenge ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <Text style={{ fontSize: 22 }}>{featuredChallenge.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', fontWeight: '700', letterSpacing: 0.5, marginBottom: 2 }}>
                      DESAFIO DO DIA
                    </Text>
                    <Text style={{ fontSize: 15, color: 'white', fontWeight: '700' }}>{featuredChallenge.title}</Text>
                    <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>+{featuredChallenge.xp} XP ao completar</Text>
                  </View>
                  <ChevronRight size={20} color="rgba(255,255,255,0.6)" />
                </View>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 28, marginRight: 12 }}>✅</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, color: '#166534', fontWeight: '700' }}>Todos os desafios concluídos!</Text>
                    <Text style={{ fontSize: 12, color: '#16A34A' }}>Volte amanhã para novos desafios</Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          )}

          {/* Stats Row */}
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1 bg-white rounded-2xl p-3 shadow-sm items-center" accessibilityLabel={`Streak: ${progress.streak || 0} dias seguidos`}>
              <Flame size={22} color="#F97316" />
              <Text className="text-xl font-bold text-stone-900 mt-1">{progress.streak || 0}</Text>
              <Text className="text-xs text-stone-500">Dias</Text>
            </View>
            <View className="flex-1 bg-white rounded-2xl p-3 shadow-sm items-center" accessibilityLabel={`${(progress.unlockedBadges || []).length} conquistas`}>
              <Award size={22} color="#3D7A67" />
              <Text className="text-xl font-bold text-stone-900 mt-1">{(progress.unlockedBadges || []).length}</Text>
              <Text className="text-xs text-stone-500">Badges</Text>
            </View>
            <View className="flex-1 bg-white rounded-2xl p-3 shadow-sm items-center" accessibilityLabel={`${progress.totalXP || 0} XP total`}>
              <Zap size={22} color="#D4973E" />
              <Text className="text-xl font-bold text-stone-900 mt-1">{progress.totalXP || 0}</Text>
              <Text className="text-xs text-stone-500">XP</Text>
            </View>
          </View>

          {/* Quick Actions */}
          <Text className="text-base font-bold text-stone-900 mb-3">Ações rápidas</Text>
          <View className="flex-row flex-wrap gap-3 mb-4">
            {QUICK_ACTIONS.map(({ title, icon: Icon, color, bg, route }) => (
              <TouchableOpacity
                key={title}
                className="bg-white rounded-2xl p-4 shadow-sm items-center"
                style={{ width: '47%' }}
                onPress={() => router.push(route)}
                accessibilityLabel={title}
                accessibilityRole="button"
              >
                <View className="w-12 h-12 rounded-2xl items-center justify-center mb-2" style={{ backgroundColor: bg }}>
                  <Icon size={24} color={color} />
                </View>
                <Text className="text-sm font-semibold text-stone-700 text-center">{title}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Mood Chart */}
          <MoodChart moodData={moodData} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
