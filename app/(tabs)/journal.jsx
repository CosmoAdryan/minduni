import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Search, X, Flame, Lightbulb, Lock, Download } from 'lucide-react-native';
import { useUser } from '../../src/context/UserContext';
import MoodOption from '../../src/components/MoodOption';
import MoodChart from '../../src/components/MoodChart';
import WeeklyInsights from '../../src/components/WeeklyInsights';
import { journalStreak } from '../../src/lib/journalInsights';
import { getDailyPrompt } from '../../src/data/journalPrompts';
import { getPracticeDates } from '../../src/services/challengeService';
import { isJournalLockEnabled, authenticate } from '../../src/services/journalLockService';
import { exportJournalPdf } from '../../src/services/journalExportService';

const MOODS = [
  { value: 1, emoji: '😢', label: 'Muito mal' },
  { value: 2, emoji: '😔', label: 'Mal' },
  { value: 3, emoji: '😐', label: 'Neutro' },
  { value: 4, emoji: '😊', label: 'Bem' },
  { value: 5, emoji: '😄', label: 'Ótimo' },
];

// Escala Jonauskaite (2020) — tristeza é azul profundo, nunca vermelho.
const MOOD_COLORS = ['#3B6FAB', '#6B8FAB', '#888787', '#5E9B84', '#C9963A'];

export default function JournalPage() {
  const { addJournalEntry, getJournalEntries, currentUser } = useUser();
  const [selectedMood, setSelectedMood] = useState(null);
  const [text, setText] = useState('');
  const [entries, setEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [filterMood, setFilterMood] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [practiceDates, setPracticeDates] = useState(null);
  // Bloqueio do diário: lockEnabled null = preferência ainda desconhecida.
  const [lockEnabled, setLockEnabled] = useState(null);
  const [unlocked, setUnlocked] = useState(false);
  const [exporting, setExporting] = useState(false);

  const dailyPrompt = getDailyPrompt();
  const streak = journalStreak(entries);

  useEffect(() => {
    loadEntries();
    // Datas de prática para a correlação humor × prática (falha silenciosa).
    getPracticeDates(30).then(setPracticeDates).catch(() => {});
  }, []);

  // Bloqueio: ao focar o Diário, lê a preferência e (se ligada) pede autenticação.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const enabled = await isJournalLockEnabled();
        if (!active) return;
        setLockEnabled(enabled);
        if (enabled && !unlocked) {
          const ok = await authenticate();
          if (active && ok) setUnlocked(true);
        }
      })();
      return () => { active = false; };
    }, [unlocked])
  );

  // Re-bloqueia ao enviar o app para segundo plano (celular compartilhado).
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'background') setUnlocked(false);
    });
    return () => sub.remove();
  }, []);

  async function handleExport() {
    if (exporting) return;
    setExporting(true);
    try {
      await exportJournalPdf(entries, currentUser?.name);
    } catch (e) {
      showToast('error', '❌ Não foi possível exportar o diário.');
    } finally {
      setExporting(false);
    }
  }

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
      // O +20 XP é aplicado no servidor junto com a entrada e comunicado pelo
      // XPToast global (evita aviso duplicado).
      await addJournalEntry(selectedMood, text.trim());
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSelectedMood(null);
      setText('');
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

  // Enquanto a preferência de bloqueio não carrega, evita piscar o conteúdo.
  if (lockEnabled === null) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-stone-50 items-center justify-center">
        <ActivityIndicator size="large" color="#3D7A67" />
      </SafeAreaView>
    );
  }

  // Diário bloqueado: exige autenticação antes de mostrar qualquer entrada.
  if (lockEnabled && !unlocked) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-stone-50 items-center justify-center px-8">
        <View className="w-20 h-20 rounded-full items-center justify-center mb-5" style={{ backgroundColor: '#EEF5F1' }}>
          <Lock size={34} color="#3D7A67" />
        </View>
        <Text className="text-xl font-bold text-stone-900 mb-1">Diário bloqueado</Text>
        <Text className="text-stone-500 text-center mb-6">
          Seu diário está protegido. Autentique-se para acessar suas entradas.
        </Text>
        <TouchableOpacity
          className="bg-sage-500 px-6 py-3 rounded-2xl flex-row items-center"
          onPress={async () => { const ok = await authenticate(); if (ok) setUnlocked(true); }}
          accessibilityRole="button"
          accessibilityLabel="Desbloquear diário"
        >
          <Lock size={18} color="white" style={{ marginRight: 8 }} />
          <Text className="text-white font-bold">Desbloquear</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-stone-50">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-2xl font-bold text-stone-900">Diário emocional</Text>
          {streak > 0 && (
            <View
              className="flex-row items-center bg-orange-50 rounded-full px-3 py-1.5"
              accessibilityLabel={`Sequência de diário: ${streak} ${streak === 1 ? 'dia' : 'dias'}`}
            >
              <Flame size={15} color="#F97316" />
              <Text className="ml-1 text-sm font-bold text-orange-500">{streak}</Text>
              <Text className="ml-1 text-xs text-orange-400">{streak === 1 ? 'dia' : 'dias'}</Text>
            </View>
          )}
        </View>

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
          <Text className="font-semibold text-stone-700 mb-3">Como você está?</Text>
          <View className="flex-row justify-around">
            {MOODS.map((m) => (
              <MoodOption
                key={m.value}
                emoji={m.emoji}
                label={m.label}
                color={MOOD_COLORS[m.value - 1]}
                selected={selectedMood === m.value}
                onPress={() => setSelectedMood(m.value)}
              />
            ))}
          </View>
        </View>

        {/* Text input */}
        <View className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <Text className="font-semibold text-stone-700 mb-2">O que está no seu coração?</Text>
          {text.trim().length === 0 && (
            <TouchableOpacity
              className="flex-row items-center bg-sage-50 rounded-xl px-3 py-2.5 mb-2"
              onPress={() => setText(`${dailyPrompt}\n\n`)}
              accessibilityLabel={`Escrever a partir da pergunta: ${dailyPrompt}`}
              accessibilityRole="button"
            >
              <Lightbulb size={16} color="#3D7A67" style={{ marginRight: 8 }} />
              <Text className="flex-1 text-sm text-sage-700 italic">{dailyPrompt}</Text>
            </TouchableOpacity>
          )}
          <TextInput
            className="bg-stone-100 border border-stone-200 rounded-xl p-3 text-stone-900 min-h-28"
            placeholder="Escreva livremente sobre como está se sentindo..."
            placeholderTextColor="#A29D95"
            value={text}
            onChangeText={(t) => setText(t.slice(0, 1000))}
            multiline
            accessibilityLabel="Campo de texto do diário"
          />
          <Text className="text-xs text-stone-400 text-right mt-1">{text.length}/1000</Text>
        </View>

        <TouchableOpacity
          className={`py-4 rounded-2xl items-center mb-6 ${canSave ? 'bg-sage-500' : 'bg-stone-200'}`}
          onPress={handleSave}
          disabled={!canSave}
          accessibilityLabel="Salvar entrada do diário e ganhar 20 XP"
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSave }}
        >
          {saving ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className={`font-bold ${canSave ? 'text-white' : 'text-stone-400'}`}>
              Salvar entrada (+20 XP)
            </Text>
          )}
        </TouchableOpacity>

        {/* Mood Chart */}
        <MoodChart data={entries} containerStyle={{ marginBottom: 16 }} />

        {/* Insights da semana + correlação humor × prática */}
        <WeeklyInsights entries={entries} practiceDates={practiceDates} containerStyle={{ marginBottom: 16 }} />

        {/* History with filter + search */}
        {entries.length > 0 && (
          <>
            <View className="flex-row items-center justify-between mb-3">
              <Text className="font-semibold text-stone-900">Histórico</Text>
              <TouchableOpacity
                className="flex-row items-center bg-white border border-stone-200 rounded-full px-3 py-1.5"
                onPress={handleExport}
                disabled={exporting}
                accessibilityRole="button"
                accessibilityLabel="Exportar diário em PDF"
              >
                {exporting ? (
                  <ActivityIndicator size="small" color="#3D7A67" />
                ) : (
                  <>
                    <Download size={14} color="#3D7A67" style={{ marginRight: 6 }} />
                    <Text className="text-sm font-semibold" style={{ color: '#2D6254' }}>Exportar</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Emoji filter row */}
            <View style={{ flexDirection: 'row', marginBottom: 10, gap: 8, flexWrap: 'wrap' }}>
              <TouchableOpacity
                style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: filterMood === null ? '#3D7A67' : '#F4F2EE' }}
                onPress={() => setFilterMood(null)}
                accessibilityLabel="Mostrar todos os humores"
                accessibilityRole="radio"
                accessibilityState={{ selected: filterMood === null }}
              >
                <Text style={{ fontSize: 12, fontWeight: '600', color: filterMood === null ? 'white' : '#756F66' }}>Todos</Text>
              </TouchableOpacity>
              {MOODS.map((m) => (
                <TouchableOpacity
                  key={m.value}
                  style={{
                    width: 36, height: 36, borderRadius: 18,
                    alignItems: 'center', justifyContent: 'center',
                    backgroundColor: filterMood === m.value ? '#D4E9DE' : '#F4F2EE',
                    borderWidth: filterMood === m.value ? 2 : 0,
                    borderColor: '#3D7A67',
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
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 12, borderWidth: 1, borderColor: '#E6E2DB', paddingHorizontal: 12, paddingVertical: 8, marginBottom: 12 }}>
              <Search size={16} color="#A29D95" style={{ marginRight: 8 }} />
              <TextInput
                style={{ flex: 1, fontSize: 14, color: '#1C1917' }}
                placeholder="Buscar no diário..."
                placeholderTextColor="#A29D95"
                value={searchText}
                onChangeText={setSearchText}
                accessibilityLabel="Buscar entradas do diário"
              />
              {searchText.length > 0 && (
                <TouchableOpacity onPress={() => setSearchText('')} accessibilityLabel="Limpar busca" accessibilityRole="button">
                  <X size={16} color="#A29D95" />
                </TouchableOpacity>
              )}
            </View>

            {/* Entry list */}
            {loadingEntries ? (
              <ActivityIndicator color="#3D7A67" style={{ marginTop: 16 }} />
            ) : filteredEntries.length === 0 ? (
              <Text style={{ textAlign: 'center', color: '#A29D95', marginTop: 8, fontSize: 14 }}>
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
                      <Text className="ml-2 font-semibold text-stone-700">{mood?.label}</Text>
                      <Text className="ml-auto text-xs text-stone-400">
                        {new Date(entry.date).toLocaleDateString('pt-BR')}
                      </Text>
                    </View>
                    <Text className="text-stone-600 text-sm" numberOfLines={3}>{entry.text}</Text>
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
