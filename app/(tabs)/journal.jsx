import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Search, X } from 'lucide-react-native';
import { useUser } from '../../src/context/UserContext';

const MOODS = [
  { value: 1, emoji: '😢', label: 'Muito mal' },
  { value: 2, emoji: '😔', label: 'Mal' },
  { value: 3, emoji: '😐', label: 'Neutro' },
  { value: 4, emoji: '😊', label: 'Bem' },
  { value: 5, emoji: '😄', label: 'Ótimo' },
];

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MOOD_COLORS = ['#EF4444', '#F97316', '#F59E0B', '#10B981', '#8B5CF6'];

function MoodChart({ entries }) {
  const data = entries.slice(0, 7).reverse();
  if (data.length === 0) return null;

  const avg = data.reduce((s, e) => s + e.mood, 0) / data.length;
  const insight =
    avg >= 4 ? 'Semana ótima! Seu esforço está valendo 🌟'
    : avg >= 3 ? 'Semana equilibrada. Continue registrando 💜'
    : 'Semana difícil. Falar com o Sage pode ajudar 💙';

  return (
    <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 16, elevation: 1 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: '#1F2937' }}>Humor recente</Text>
        <Text style={{ fontSize: 12, color: '#8B5CF6', fontWeight: '600' }}>Média: {avg.toFixed(1)}/5</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 72, marginBottom: 4 }}>
        {data.map((e, i) => {
          const dayLabel = DAY_LABELS[new Date(e.date).getDay()];
          const barH = Math.max(8, (e.mood / 5) * 60);
          return (
            <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
              <View style={{ width: 20, borderRadius: 6, height: barH, backgroundColor: MOOD_COLORS[e.mood - 1], opacity: 0.85 }} />
              <Text style={{ fontSize: 9, color: '#9CA3AF', marginTop: 3 }}>{dayLabel}</Text>
            </View>
          );
        })}
      </View>
      <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4, fontStyle: 'italic' }}>{insight}</Text>
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

  useEffect(() => {
    loadEntries();
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
      showToast('success', '✅ Entrada salva! +20 XP');
      loadEntries();
    } catch (e) {
      showToast('error', '❌ Erro ao salvar. Tente novamente.');
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
    <SafeAreaView className="flex-1 bg-purple-50">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <Text className="text-2xl font-bold text-gray-800 mb-4">Diário emocional</Text>

        {/* Toast */}
        {toast && (
          <View
            style={{
              backgroundColor: toast.type === 'success' ? '#F0FDF4' : '#FEF2F2',
              borderWidth: 1,
              borderColor: toast.type === 'success' ? '#BBF7D0' : '#FECACA',
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 10,
              marginBottom: 12,
            }}
            accessibilityLiveRegion="polite"
          >
            <Text style={{ color: toast.type === 'success' ? '#166534' : '#991B1B', fontWeight: '600', textAlign: 'center' }}>
              {toast.message}
            </Text>
          </View>
        )}

        {/* Mood picker */}
        <View className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <Text className="font-semibold text-gray-700 mb-3">Como você está?</Text>
          <View className="flex-row justify-around">
            {MOODS.map((m) => (
              <TouchableOpacity
                key={m.value}
                className={`items-center p-2 rounded-xl ${selectedMood === m.value ? 'bg-purple-100 border-2 border-purple-400' : ''}`}
                onPress={() => setSelectedMood(m.value)}
                accessibilityLabel={m.label}
                accessibilityRole="radio"
                accessibilityState={{ selected: selectedMood === m.value }}
              >
                <Text style={{ fontSize: 32 }}>{m.emoji}</Text>
                <Text className="text-xs text-gray-500 mt-1">{m.label}</Text>
              </TouchableOpacity>
            ))}
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
          className={`py-4 rounded-2xl items-center mb-6 ${canSave ? 'bg-purple-600' : 'bg-gray-200'}`}
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
        {entries.length > 0 && (
          <>
            <Text className="font-semibold text-gray-800 mb-3">Histórico</Text>

            {/* Emoji filter row */}
            <View style={{ flexDirection: 'row', marginBottom: 10, gap: 8, flexWrap: 'wrap' }}>
              <TouchableOpacity
                style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: filterMood === null ? '#8B5CF6' : '#F3F4F6' }}
                onPress={() => setFilterMood(null)}
                accessibilityLabel="Mostrar todos os humores"
                accessibilityRole="radio"
                accessibilityState={{ selected: filterMood === null }}
              >
                <Text style={{ fontSize: 12, fontWeight: '600', color: filterMood === null ? 'white' : '#6B7280' }}>Todos</Text>
              </TouchableOpacity>
              {MOODS.map((m) => (
                <TouchableOpacity
                  key={m.value}
                  style={{
                    width: 36, height: 36, borderRadius: 18,
                    alignItems: 'center', justifyContent: 'center',
                    backgroundColor: filterMood === m.value ? '#EDE9FE' : '#F3F4F6',
                    borderWidth: filterMood === m.value ? 2 : 0,
                    borderColor: '#8B5CF6',
                  }}
                  onPress={() => setFilterMood(filterMood === m.value ? null : m.value)}
                  accessibilityLabel={`Filtrar por humor: ${m.label}`}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: filterMood === m.value }}
                >
                  <Text style={{ fontSize: 18 }}>{m.emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Search */}
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 12, paddingVertical: 8, marginBottom: 12 }}>
              <Search size={16} color="#9CA3AF" style={{ marginRight: 8 }} />
              <TextInput
                style={{ flex: 1, fontSize: 14, color: '#1F2937' }}
                placeholder="Buscar no diário..."
                value={searchText}
                onChangeText={setSearchText}
                accessibilityLabel="Buscar entradas do diário"
              />
              {searchText.length > 0 && (
                <TouchableOpacity onPress={() => setSearchText('')} accessibilityLabel="Limpar busca" accessibilityRole="button">
                  <X size={16} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>

            {/* Entry list */}
            {loadingEntries ? (
              <ActivityIndicator color="#8B5CF6" style={{ marginTop: 16 }} />
            ) : filteredEntries.length === 0 ? (
              <Text style={{ textAlign: 'center', color: '#9CA3AF', marginTop: 8, fontSize: 14 }}>
                Nenhuma entrada encontrada.
              </Text>
            ) : (
              filteredEntries.slice(0, 20).map((entry) => {
                const mood = MOODS.find((m) => m.value === entry.mood);
                return (
                  <View
                    key={entry.id}
                    className="bg-white rounded-2xl p-4 shadow-sm mb-3"
                    accessibilityLabel={`Entrada de ${new Date(entry.date).toLocaleDateString('pt-BR')}: humor ${mood?.label}`}
                  >
                    <View className="flex-row items-center mb-2">
                      <Text style={{ fontSize: 24 }}>{mood?.emoji}</Text>
                      <Text className="ml-2 font-semibold text-gray-700">{mood?.label}</Text>
                      <Text className="ml-auto text-xs text-gray-400">
                        {new Date(entry.date).toLocaleDateString('pt-BR')}
                      </Text>
                    </View>
                    <Text className="text-gray-600 text-sm" numberOfLines={3}>{entry.text}</Text>
                  </View>
                );
              })
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
