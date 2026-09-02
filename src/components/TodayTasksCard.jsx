import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { CalendarDays, Check, ChevronRight, Plus } from 'lucide-react-native';
import { useUser } from '../context/UserContext';
import { toISODate, occurrencesForDay } from '../lib/recurrence';
import { stone, sage } from '../theme/tokens';

// Widget da Home: tarefas de hoje com checkbox. Mostra até 3; leva à agenda.
export default function TodayTasksCard() {
  const router = useRouter();
  const { getTasks, getTaskCompletions, toggleTaskDone } = useUser();
  const [occ, setOcc] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const today = toISODate(new Date());

  const load = useCallback(async () => {
    try {
      const [tasks, completions] = await Promise.all([
        getTasks(),
        getTaskCompletions(today, today),
      ]);
      setOcc(occurrencesForDay(tasks, completions, today));
    } catch (e) {
      console.error('TodayTasksCard load falhou:', e?.message);
    } finally {
      setLoaded(true);
    }
  }, [getTasks, getTaskCompletions, today]);

  useFocusEffect(useCallback(() => {
    let active = true;
    load().finally(() => { if (!active) return; });
    return () => { active = false; };
  }, [load]));

  async function toggle(o) {
    // Atualização otimista + persistência.
    setOcc((prev) => prev.map((x) => (x.task.id === o.task.id ? { ...x, done: !x.done } : x)));
    try {
      await toggleTaskDone(o.task.id, o.date);
    } catch {
      setOcc((prev) => prev.map((x) => (x.task.id === o.task.id ? { ...x, done: o.done } : x)));
    }
  }

  if (!loaded) return null;

  const pending = occ.filter((o) => !o.done).length;
  const visible = occ.slice(0, 3);

  return (
    <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: stone[200], marginBottom: 16 }}>
      <TouchableOpacity
        onPress={() => router.push('/agenda')}
        accessibilityRole="button"
        accessibilityLabel="Abrir a agenda"
        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: occ.length ? 12 : 0 }}
      >
        <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: sage[100], alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
          <CalendarDays size={18} color={sage[600]} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: stone[900] }}>Agenda de hoje</Text>
          <Text style={{ fontSize: 12, color: stone[400] }}>
            {occ.length === 0 ? 'Nenhuma tarefa para hoje' : `${pending} pendente${pending === 1 ? '' : 's'} de ${occ.length}`}
          </Text>
        </View>
        <ChevronRight size={20} color={stone[300]} />
      </TouchableOpacity>

      {visible.map((o) => (
        <TouchableOpacity
          key={`${o.task.id}-${o.date}`}
          onPress={() => toggle(o)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: o.done }}
          accessibilityLabel={`${o.task.title}, ${o.done ? 'concluída' : 'pendente'}`}
          style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6 }}
        >
          <View style={{
            width: 22, height: 22, borderRadius: 11, marginRight: 10,
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: o.done ? sage[500] : 'transparent',
            borderWidth: o.done ? 0 : 2, borderColor: stone[300],
          }}>
            {o.done && <Check size={14} color="white" />}
          </View>
          <Text
            style={{ flex: 1, fontSize: 14, color: o.done ? stone[400] : stone[700], textDecorationLine: o.done ? 'line-through' : 'none' }}
            numberOfLines={1}
          >
            {o.time ? `${o.time}  ` : ''}{o.task.title}
          </Text>
        </TouchableOpacity>
      ))}

      {occ.length === 0 && (
        <TouchableOpacity
          onPress={() => router.push('/agenda')}
          accessibilityRole="button"
          accessibilityLabel="Criar uma tarefa"
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }}
        >
          <Plus size={16} color={sage[600]} />
          <Text style={{ fontSize: 13, color: sage[600], fontWeight: '600' }}>Planejar meu dia</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
