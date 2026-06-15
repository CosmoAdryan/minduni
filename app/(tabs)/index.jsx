import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MessageCircle, Target, BookOpen, User, Flame, Award, Zap, ChevronRight } from 'lucide-react-native';
import { useUser } from '../../src/context/UserContext';
import XPBar from '../../src/components/XPBar';
import { DashboardSkeleton } from '../../src/components/Skeleton';
import { getDailyChallenges } from '../../src/data/challenges';
import { getCompletedToday } from '../../src/services/challengeService';
import { T, MOOD_COLORS, MOOD_EMOJIS } from '../../src/theme';

const QUICK_ACTIONS = [
  { title: 'Sage', icon: MessageCircle, color: T.g500, bg: T.g50, route: '/chat' },
  { title: 'Práticas', icon: Target, color: T.g600, bg: T.g50, route: '/challenges' },
  { title: 'Diário', icon: BookOpen, color: T.a400, bg: T.a50, route: '/journal' },
  { title: 'Jornada', icon: User, color: T.g500, bg: T.g50, route: '/profile' },
];

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function MoodChart({ moodData }) {
  if (moodData.length === 0) return null;

  const avg = moodData.reduce((s, m) => s + m.mood, 0) / moodData.length;
  const insight =
    avg >= 4
      ? 'Sua semana foi tranquila. Continue no seu ritmo.'
      : avg >= 3
      ? 'Semana estável. Pequenos passos importam.'
      : 'Semana desafiadora. O Sage está aqui para te ouvir.';

  return (
    <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, elevation: 1 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: T.s900 }}>Humor recente</Text>
        <Text style={{ fontSize: 12, color: T.g500, fontWeight: '600' }}>
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
                  style={{ width: 20, borderRadius: 6, height: barH, backgroundColor: MOOD_COLORS[m.mood - 1], opacity: 0.9 }}
                />
                <Text style={{ fontSize: 9, color: '#9CA3AF', marginTop: 3 }}>{dayLabel}</Text>
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
            backgroundColor: T.g500,
            opacity: 0.55,
            borderRadius: 1,
          }}
        />
      </View>
      <Text style={{ fontSize: 12, color: T.s500, marginTop: 4, fontStyle: 'italic' }}>{insight}</Text>
    </View>
  );
}

export default function Dashboard() {
  const { currentUser, progress, loading } = useUser();
  const router = useRouter();
  const [featuredChallenge, setFeaturedChallenge] = useState(null);
  const [loadingChallenge, setLoadingChallenge] = useState(true);

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

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-stone-50">
        <DashboardSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-stone-50">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Header */}
        <View style={{ backgroundColor: T.s900, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 }}>
          <Text style={{ color: T.s400, fontSize: 13 }}>{greeting},</Text>
          <Text style={{ color: '#fff', fontSize: 24, fontWeight: '800', letterSpacing: -0.4 }}>{firstName}</Text>
        </View>

        <View className="px-4 -mt-6">
          {/* XP Card */}
          <View
            className="bg-white rounded-2xl p-4 shadow-md mb-4"
            accessibilityLabel={`Nível ${progress.level}, ${progress.totalXP || 0} XP total`}
          >
            <XPBar />
          </View>

          {/* Featured Challenge — Desafio do Dia */}
          {!loadingChallenge && (
            <TouchableOpacity
              className="rounded-2xl p-4 mb-4 shadow-md"
              style={{ backgroundColor: featuredChallenge ? T.g500 : T.g50, borderWidth: featuredChallenge ? 0 : 1, borderColor: T.g100 }}
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
                    <Text style={{ fontSize: 14, color: T.g700, fontWeight: '700' }}>Todas as práticas concluídas</Text>
                    <Text style={{ fontSize: 12, color: T.g600 }}>Volte amanhã para novas práticas</Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          )}

          {/* Stats Row */}
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1 bg-white rounded-2xl p-3 shadow-sm items-center" accessibilityLabel={`Streak: ${progress.streak || 0} dias seguidos`}>
              <Flame size={22} color={T.a400} />
              <Text className="text-xl font-bold text-gray-900 mt-1">{progress.streak || 0}</Text>
              <Text className="text-xs text-gray-500">Dias</Text>
            </View>
            <View className="flex-1 bg-white rounded-2xl p-3 shadow-sm items-center" accessibilityLabel={`${(progress.unlockedBadges || []).length} conquistas`}>
              <Award size={22} color={T.g500} />
              <Text className="text-xl font-bold text-gray-900 mt-1">{(progress.unlockedBadges || []).length}</Text>
              <Text className="text-xs text-gray-500">Badges</Text>
            </View>
            <View className="flex-1 bg-white rounded-2xl p-3 shadow-sm items-center" accessibilityLabel={`${progress.totalXP || 0} XP total`}>
              <Zap size={22} color={T.a400} />
              <Text className="text-xl font-bold text-gray-900 mt-1">{progress.totalXP || 0}</Text>
              <Text className="text-xs text-gray-500">XP</Text>
            </View>
          </View>

          {/* Quick Actions */}
          <Text className="text-base font-bold text-gray-800 mb-3">Ações rápidas</Text>
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
                <Text className="text-sm font-semibold text-gray-700 text-center">{title}</Text>
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
