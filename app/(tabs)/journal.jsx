import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Search, X, BookOpen } from 'lucide-react-native';
import { useUser } from '../../src/context/UserContext';
import { STORAGE_KEYS } from '../../src/services/storage';
import { T, MOOD_COLORS, SAGE_FONT } from '../../src/theme';

const MOODS = [
  { value: 1, emoji: '😢', label: 'Muito mal' },
  { value: 2, emoji: '😔', label: 'Mal' },
  { value: 3, emoji: '😐', label: 'Neutro' },
  { value: 4, emoji: '😊', label: 'Bem' },
  { value: 5, emoji: '😄', label: 'Ótimo' },
];

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// Data contextual: "Hoje" / "Ontem" para os 2 últimos dias, "DD/MM" antes.
function formatEntryDate(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const startOf = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const dayDiff = Math.round((startOf(now) - startOf(d)) / 86400000);
  const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  if (dayDiff === 0) return `Hoje · ${time}`;
  if (dayDiff === 1) return `Ontem · ${time}`;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function MoodChart({ entries }) {
  const data = entries.slice(0, 7).reverse();
  if (data.length === 0) return null;

  const avg = data.reduce((s, e) => s + e.mood, 0) / data.length;
  const insight =
    avg >= 4 ? 'Semana tranquila. Seu cuidado está valendo.'
    : avg >= 3 ? 'Semana equilibrada. Continue registrando.'
    : 'Semana difícil. Falar com o Sage pode ajudar.';

  return (
    <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 16, elevation: 1 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: T.s900 }}>Humor recente</Text>
        <Text style={{ fontSize: 12, color: T.g500, fontWeight: '600' }}>Média: {avg.toFixed(1)}/5</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 72, marginBottom: 4 }}>
        {data.map((e, i) => {
          const dayLabel = DAY_LABELS[new Date(e.date).getDay()];
          const barH = Math.max(8, (e.mood / 5) * 60);
          return (
            <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
              <View style={{ width: 20, borderRadius: 6, height: barH, backgroundColor: MOOD_COLORS[e.mood - 1], opacity: 0.9 }} />
              <Text style={{ fontSize: 9, color: T.s400, marginTop: 3 }}>{dayLabel}</Text>
            </View>
          );
        })}
      </View>
      <Text style={{ fontSize: 12, color: T.s500, marginTop: 4, fontStyle: 'italic' }}>{insight}</Text>
    </View>
  );
}

export default function JournalPage() {
  const { addJournalEntry, getJournalEntries, addXP } = useUser();
  const [selectedMood, setSelectedMood] = useState(null);
  const [text, setText] = useState('');
  const [entries, setEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [filterMood, setFilterMood] = useState(null);
  const [searchText, setSearchText] = useState('');
  // Prompt suave só na 1ª abertura do Diário (flag em AsyncStorage).
  const [firstOpen, setFirstOpen] = useState(false);

  useEffect(() => {
    loadEntries();
    (async () => {
      const opened = await AsyncStorage.getItem(STORAGE_KEYS.DIARY_OPENED);
      if (opened !== 'true') {
        setFirstOpen(true);
        await AsyncStorage.setItem(STORAGE_KEYS.DIARY_OPENED, 'true');
      }
    })();
  }, []);

  async function loadEntries() {
    setLoadingEntries(true);
    try {
      const data = await getJournalEntries();
      setEntries(data);
    } finally {
      setLoadingEntries(false);
    }
  }

  function showToast(type, message) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 2500);
  }

  async function handleSave() {
    if (!selectedMood || !text.trim()) return;
    setSaving(true);
    try {
      await addJournalEntry(selectedMood, text.trim());
      await addXP(20);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSelectedMood(null);
      setText('');
      setFirstOpen(false);
      showToast('success', 'Entrada salva · +20 XP');
      loadEntries();
    } catch (e) {
      showToast('error', 'Não foi possível salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  const filteredEntries = entries.filter((e) => {
    const moodMatch = filterMood === null || e.mood === filterMood;
    const textMatch = searchText.trim() === '' || e.text.toLowerCase().includes(searchText.toLowerCase());
    return moodMatch && textMatch;
  });

  const canSave = selectedMood && text.trim().length > 0 && !saving;

  return (
    <SafeAreaView className="flex-1 bg-stone-50">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <Text className="text-2xl font-bold text-gray-900 mb-4">Diário emocional</Text>

        {/* Prompt suave — apenas na 1ª abertura */}
        {firstOpen && entries.length === 0 && (
          <View style={{ backgroundColor: '#fff', borderRadius: 18, padding: 18, borderWidth: 1.5, borderColor: T.g100, marginBottom: 16 }}>
            <View style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: T.g50, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <BookOpen size={22} color={T.g500} />
            </View>
            <Text style={{ fontSize: 15, fontWeight: '800', color: T.s900, marginBottom: 8 }}>Seu espaço de escrita</Text>
            <Text style={{ fontFamily: SAGE_FONT, fontStyle: 'italic', fontSize: 13, color: T.s500, lineHeight: 22 }}>
              Não precisa ser elaborado. Escreva o que está na sua cabeça agora — uma frase já conta.
            </Text>
            <Text style={{ fontSize: 11, color: T.s400, marginTop: 10 }}>Só você lê isso.</Text>
          </View>
        )}

        {/* Toast */}
        {toast && (
          <View
            style={{
              backgroundColor: toast.type === 'success' ? T.g50 : T.crL,
              borderWidth: 1,
              borderColor: toast.type === 'success' ? T.g100 : T.crB,
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 10,
              marginBottom: 12,
            }}
            accessibilityLiveRegion="polite"
          >
            <Text style={{ color: toast.type === 'success' ? T.g700 : T.crD, fontWeight: '600', textAlign: 'center' }}>
              {toast.message}
            </Text>
          </View>
        )}

        {/* Mood picker */}
        <View className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <Text className="font-semibold text-gray-700 mb-3">Como você está?</Text>
          <View className="flex-row justify-around">
            {MOODS.map((m) => {
              const on = selectedMood === m.value;
              const c = MOOD_COLORS[m.value - 1];
              return (
                <TouchableOpacity
                  key={m.value}
                  style={{ alignItems: 'center', padding: 8, borderRadius: 13, borderWidth: 2, borderColor: on ? c : 'transparent', backgroundColor: on ? c + '18' : 'transparent' }}
                  onPress={() => setSelectedMood(m.value)}
                  accessibilityLabel={m.label}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                >
                  <Text style={{ fontSize: 32 }}>{m.emoji}</Text>
                  <Text style={{ fontSize: 11, color: on ? c : T.s500, marginTop: 4, fontWeight: on ? '700' : '400' }}>{m.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Text input */}
        <View className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <Text className="font-semibold text-gray-700 mb-2">O que está no seu coração?</Text>
          <TextInput
            className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-800 min-h-28"
            placeholder="Escreva livremente sobre como está se sentindo..."
            value={text}
            onChangeText={(t) => setText(t.slice(0, 1000))}
            multiline
            accessibilityLabel="Campo de texto do diário"
          />
          <Text className="text-xs text-gray-400 text-right mt-1">{text.length}/1000</Text>
        </View>

        <TouchableOpacity
          className={`py-4 rounded-2xl items-center mb-6 ${canSave ? 'bg-sage-500' : 'bg-gray-200'}`}
          onPress={handleSave}
          disabled={!canSave}
          accessibilityLabel="Salvar entrada do diário e ganhar 20 XP"
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSave }}
        >
          {saving ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className={`font-bold ${canSave ? 'text-white' : 'text-gray-400'}`}>
              Salvar entrada (+20 XP)
            </Text>
          )}
        </TouchableOpacity>

        {/* Mood Chart */}
        <MoodChart entries={entries} />

        {/* History with filter + search */}
        {entries.length > 0 ? (
          <>
            <Text className="font-semibold text-gray-900 mb-3">Histórico</Text>

            {/* Emoji filter row */}
            <View style={{ flexDirection: 'row', marginBottom: 10, gap: 8, flexWrap: 'wrap' }}>
              <TouchableOpacity
                style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: filterMood === null ? T.g500 : T.s100 }}
                onPress={() => setFilterMood(null)}
                accessibilityLabel="Mostrar todos os humores"
                accessibilityRole="radio"
                accessibilityState={{ selected: filterMood === null }}
              >
                <Text style={{ fontSize: 12, fontWeight: '600', color: filterMood === null ? 'white' : T.s500 }}>Todos</Text>
              </TouchableOpacity>
              {MOODS.map((m) => {
                const on = filterMood === m.value;
                const c = MOOD_COLORS[m.value - 1];
                return (
                  <TouchableOpacity
                    key={m.value}
                    style={{
                      width: 36, height: 36, borderRadius: 18,
                      alignItems: 'center', justifyContent: 'center',
                      backgroundColor: on ? c + '22' : T.s100,
                      borderWidth: on ? 2 : 0,
                      borderColor: c,
                    }}
                    onPress={() => setFilterMood(on ? null : m.value)}
                    accessibilityLabel={`Filtrar por humor: ${m.label}`}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: on }}
                  >
                    <Text style={{ fontSize: 18 }}>{m.emoji}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Search */}
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 12, borderWidth: 1, borderColor: T.s200, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 12 }}>
              <Search size={16} color={T.s400} style={{ marginRight: 8 }} />
              <TextInput
                style={{ flex: 1, fontSize: 14, color: T.s900 }}
                placeholder="Buscar no diário..."
                placeholderTextColor={T.s400}
                value={searchText}
                onChangeText={setSearchText}
                accessibilityLabel="Buscar entradas do diário"
              />
              {searchText.length > 0 && (
                <TouchableOpacity onPress={() => setSearchText('')} accessibilityLabel="Limpar busca" accessibilityRole="button">
                  <X size={16} color={T.s400} />
                </TouchableOpacity>
              )}
            </View>

            {/* Entry list */}
            {loadingEntries ? (
              <ActivityIndicator color={T.g500} style={{ marginTop: 16 }} />
            ) : filteredEntries.length === 0 ? (
              <Text style={{ textAlign: 'center', color: T.s400, marginTop: 8, fontSize: 14 }}>
                Nenhuma entrada encontrada.
              </Text>
            ) : (
              filteredEntries.slice(0, 20).map((entry) => {
                const mood = MOODS.find((m) => m.value === entry.mood);
                const c = MOOD_COLORS[entry.mood - 1];
                return (
                  <View
                    key={entry.id}
                    className="bg-white rounded-2xl p-4 shadow-sm mb-3"
                    accessibilityLabel={`Entrada de ${formatEntryDate(entry.date)}: humor ${mood?.label}`}
                  >
                    <View className="flex-row items-center mb-2">
                      <Text style={{ fontSize: 24 }}>{mood?.emoji}</Text>
                      <Text style={{ marginLeft: 8, fontWeight: '600', color: c }}>{mood?.label}</Text>
                      <Text className="ml-auto text-xs text-gray-400">
                        {formatEntryDate(entry.date)}
                      </Text>
                    </View>
                    <Text className="text-gray-600 text-sm" numberOfLines={3}>{entry.text}</Text>
                  </View>
                );
              })
            )}
          </>
        ) : !firstOpen && (
          /* Empty state limpo (2ª+ abertura sem entradas) */
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 48, gap: 12 }}>
            <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: T.s200, alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={22} color={T.s400} />
            </View>
            <Text style={{ fontSize: 13, color: T.s400 }}>Nenhuma entrada ainda</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
