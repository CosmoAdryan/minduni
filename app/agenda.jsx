import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  ChevronLeft, ChevronRight, Plus, Check, Trash2, Repeat, Clock, CalendarDays, History,
} from 'lucide-react-native';
import { useUser } from '../src/context/UserContext';
import TaskFormModal from '../src/components/TaskFormModal';
import { stone, sage } from '../src/theme/tokens';
import {
  toISODate, fromISODate, occurrencesForDay, occurrenceDatesInRange,
} from '../src/lib/recurrence';

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
const RECURRENCE_LABEL = { daily: 'Todo dia', weekly: 'Toda semana', none: null };

// dd/mm a partir de 'YYYY-MM-DD'.
const ddmm = (iso) => iso.split('-').reverse().slice(0, 2).join('/');

export default function AgendaScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { getTasks, getTaskCompletions, addTask, deleteTask, toggleTaskDone, getTaskHistory } = useUser();

  const today = useMemo(() => toISODate(new Date()), []);
  const [selectedDate, setSelectedDate] = useState(today);
  const [viewDate, setViewDate] = useState(() => fromISODate(today)); // 1º dia visível do mês
  const [tab, setTab] = useState('calendar'); // 'calendar' | 'history'

  const [tasks, setTasks] = useState([]);
  const [completions, setCompletions] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth(); // 0-based
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const monthStartISO = toISODate(new Date(viewYear, viewMonth, 1));
  const monthEndISO = toISODate(new Date(viewYear, viewMonth, daysInMonth));

  // Carrega tarefas + conclusões do mês visível.
  const loadData = useCallback(async () => {
    try {
      const [t, c] = await Promise.all([
        getTasks(),
        getTaskCompletions(monthStartISO, monthEndISO),
      ]);
      setTasks(t);
      setCompletions(c);
    } catch (e) {
      console.error('Falha ao carregar a agenda:', e?.message);
    } finally {
      setLoading(false);
    }
  }, [getTasks, getTaskCompletions, monthStartISO, monthEndISO]);

  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    loadData().finally(() => { if (!active) return; });
    return () => { active = false; };
  }, [loadData]));

  // Se veio com ?date=YYYY-MM-DD (ex.: do card do Sage), foca esse dia.
  useFocusEffect(useCallback(() => {
    if (typeof params.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(params.date)) {
      setSelectedDate(params.date);
      setViewDate(fromISODate(params.date));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.date]));

  const datesWithTasks = useMemo(
    () => occurrenceDatesInRange(tasks, monthStartISO, monthEndISO),
    [tasks, monthStartISO, monthEndISO],
  );

  const dayOccurrences = useMemo(
    () => occurrencesForDay(tasks, completions, selectedDate),
    [tasks, completions, selectedDate],
  );

  function shiftMonth(delta) {
    setViewDate(new Date(viewYear, viewMonth + delta, 1));
  }

  async function handleToggle(occ) {
    try {
      Haptics.selectionAsync();
      await toggleTaskDone(occ.task.id, occ.date);
      // Recarrega as conclusões do mês para refletir o novo estado.
      const c = await getTaskCompletions(monthStartISO, monthEndISO);
      setCompletions(c);
    } catch (e) {
      Alert.alert('Ops', e?.message || 'Não foi possível atualizar a tarefa.');
    }
  }

  async function handleAddTask({ title, time, recurrence }) {
    await addTask({ title, date: selectedDate, time, recurrence, source: 'user' });
    setModalVisible(false);
    await loadData();
  }

  function confirmDelete(task) {
    Alert.alert(
      'Excluir tarefa',
      `Remover "${task.title}" da agenda? O histórico de conclusões é mantido.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTask(task.id);
              await loadData();
            } catch (e) {
              Alert.alert('Ops', e?.message || 'Não foi possível excluir.');
            }
          },
        },
      ],
    );
  }

  async function openHistory() {
    setTab('history');
    try {
      const h = await getTaskHistory(100);
      setHistory(h);
    } catch (e) {
      console.error('Falha ao carregar histórico:', e?.message);
    }
  }

  // Semanas do mês: cada uma é um array de 7 posições (ISO do dia ou null).
  // Montado com a API Date (getDay do 1º dia define o deslocamento inicial) e
  // renderizado como linhas de 7 células flex:1 — sem depender de larguras em
  // porcentagem, que arredondam no React Native e quebram o alinhamento.
  const weeks = useMemo(() => {
    const firstWeekday = new Date(viewYear, viewMonth, 1).getDay(); // 0=Dom..6=Sáb
    const out = [];
    let week = new Array(firstWeekday).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
      week.push(toISODate(new Date(viewYear, viewMonth, d)));
      if (week.length === 7) { out.push(week); week = []; }
    }
    if (week.length > 0) {
      while (week.length < 7) week.push(null);
      out.push(week);
    }
    return out;
  }, [viewYear, viewMonth, daysInMonth]);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: stone[50] }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: stone[200] }}>
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Voltar" accessibilityRole="button" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <ChevronLeft size={26} color={stone[700]} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '700', color: stone[900], marginLeft: 8 }}>Agenda</Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          onPress={() => (tab === 'calendar' ? openHistory() : setTab('calendar'))}
          accessibilityRole="button"
          accessibilityLabel={tab === 'calendar' ? 'Ver histórico' : 'Ver calendário'}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: stone[100] }}
        >
          {tab === 'calendar'
            ? <><History size={16} color={stone[600]} /><Text style={{ fontSize: 13, color: stone[600], fontWeight: '600' }}>Histórico</Text></>
            : <><CalendarDays size={16} color={stone[600]} /><Text style={{ fontSize: 13, color: stone[600], fontWeight: '600' }}>Calendário</Text></>}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={sage[500]} />
        </View>
      ) : tab === 'history' ? (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: stone[900], marginBottom: 12 }}>Tarefas concluídas</Text>
          {history.length === 0 ? (
            <Text style={{ color: stone[400], fontSize: 14 }}>Nada concluído ainda. Conclua uma tarefa para começar seu histórico.</Text>
          ) : history.map((h) => (
            <View key={h.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: stone[200] }}>
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: sage[100], alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                <Check size={16} color={sage[600]} />
              </View>
              <Text style={{ flex: 1, color: stone[800], fontSize: 14 }} numberOfLines={1}>{h.title}</Text>
              <Text style={{ color: stone[400], fontSize: 12 }}>{ddmm(h.date)}</Text>
            </View>
          ))}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 96 }}>
          {/* Cabeçalho do mês */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <TouchableOpacity onPress={() => shiftMonth(-1)} accessibilityLabel="Mês anterior" accessibilityRole="button" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <ChevronLeft size={22} color={stone[600]} />
            </TouchableOpacity>
            <Text style={{ fontSize: 16, fontWeight: '700', color: stone[900] }}>{MONTHS[viewMonth]} {viewYear}</Text>
            <TouchableOpacity onPress={() => shiftMonth(1)} accessibilityLabel="Próximo mês" accessibilityRole="button" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <ChevronRight size={22} color={stone[600]} />
            </TouchableOpacity>
          </View>

          {/* Grade do calendário */}
          <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 10, borderWidth: 1, borderColor: stone[200] }}>
            <View style={{ flexDirection: 'row' }}>
              {WEEKDAYS.map((w, i) => (
                <View key={i} style={{ flex: 1, alignItems: 'center', paddingVertical: 4 }}>
                  <Text style={{ fontSize: 11, color: stone[400], fontWeight: '600' }}>{w}</Text>
                </View>
              ))}
            </View>
            {weeks.map((week, wi) => (
              <View key={wi} style={{ flexDirection: 'row' }}>
                {week.map((iso, ci) => {
                  if (!iso) return <View key={`b${wi}-${ci}`} style={{ flex: 1, height: 46 }} />;
                  const dayNum = Number(iso.slice(-2));
                  const isSelected = iso === selectedDate;
                  const isToday = iso === today;
                  const hasTasks = datesWithTasks.has(iso);
                  return (
                    <TouchableOpacity
                      key={iso}
                      onPress={() => setSelectedDate(iso)}
                      accessibilityRole="button"
                      accessibilityLabel={`Dia ${dayNum}${hasTasks ? ', com tarefas' : ''}`}
                      accessibilityState={{ selected: isSelected }}
                      style={{ flex: 1, height: 46, alignItems: 'center', justifyContent: 'center' }}
                    >
                      <View style={{
                        width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center',
                        backgroundColor: isSelected ? sage[500] : isToday ? sage[100] : 'transparent',
                      }}>
                        <Text style={{
                          fontSize: 14,
                          fontWeight: isSelected || isToday ? '700' : '400',
                          color: isSelected ? 'white' : stone[800],
                        }}>{dayNum}</Text>
                      </View>
                      <View style={{
                        width: 5, height: 5, borderRadius: 3, marginTop: 2,
                        backgroundColor: hasTasks && !isSelected ? sage[400] : 'transparent',
                      }} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>

          {/* Lista do dia selecionado */}
          <Text style={{ fontSize: 15, fontWeight: '700', color: stone[900], marginTop: 20, marginBottom: 10 }}>
            {selectedDate === today ? 'Hoje' : ddmm(selectedDate)}
          </Text>

          {dayOccurrences.length === 0 ? (
            <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: stone[200], alignItems: 'center' }}>
              <Text style={{ color: stone[400], fontSize: 14, textAlign: 'center' }}>Nenhuma tarefa neste dia.{'\n'}Toque em + para adicionar.</Text>
            </View>
          ) : dayOccurrences.map((occ) => {
            const rec = RECURRENCE_LABEL[occ.task.recurrence];
            return (
              <View key={`${occ.task.id}-${occ.date}`} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: stone[200] }}>
                <TouchableOpacity
                  onPress={() => handleToggle(occ)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: occ.done }}
                  accessibilityLabel={`Marcar "${occ.task.title}" como ${occ.done ? 'não concluída' : 'concluída'}`}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  style={{
                    width: 26, height: 26, borderRadius: 13, marginRight: 12,
                    alignItems: 'center', justifyContent: 'center',
                    backgroundColor: occ.done ? sage[500] : 'transparent',
                    borderWidth: occ.done ? 0 : 2, borderColor: stone[300],
                  }}
                >
                  {occ.done && <Check size={16} color="white" />}
                </TouchableOpacity>

                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, color: occ.done ? stone[400] : stone[800], textDecorationLine: occ.done ? 'line-through' : 'none' }} numberOfLines={2}>
                    {occ.task.title}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 3 }}>
                    {occ.time && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                        <Clock size={12} color={stone[400]} />
                        <Text style={{ fontSize: 12, color: stone[400] }}>{occ.time}</Text>
                      </View>
                    )}
                    {rec && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                        <Repeat size={12} color={stone[400]} />
                        <Text style={{ fontSize: 12, color: stone[400] }}>{rec}</Text>
                      </View>
                    )}
                    {occ.task.source === 'sage' && (
                      <Text style={{ fontSize: 12, color: sage[600], fontWeight: '600' }}>· Sage</Text>
                    )}
                  </View>
                </View>

                <TouchableOpacity onPress={() => confirmDelete(occ.task)} accessibilityLabel="Excluir tarefa" accessibilityRole="button" hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                  <Trash2 size={18} color={stone[300]} />
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* FAB */}
      {tab === 'calendar' && !loading && (
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          accessibilityLabel="Adicionar tarefa"
          accessibilityRole="button"
          style={{ position: 'absolute', right: 20, bottom: 28, width: 56, height: 56, borderRadius: 28, backgroundColor: sage[500], alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 5 }}
        >
          <Plus size={26} color="white" />
        </TouchableOpacity>
      )}

      <TaskFormModal
        visible={modalVisible}
        defaultDate={selectedDate}
        onClose={() => setModalVisible(false)}
        onSubmit={handleAddTask}
      />
    </SafeAreaView>
  );
}
