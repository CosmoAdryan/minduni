import { supabase } from '../lib/supabase';
import { completeTask as rpcCompleteTask } from './progressService';

async function getCurrentUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

// Normaliza a linha do banco para o formato usado pela lib de recorrência e UI.
function mapTask(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? null,
    scheduled_date: row.scheduled_date,
    scheduled_time: row.scheduled_time ? row.scheduled_time.slice(0, 5) : null,
    recurrence: row.recurrence ?? 'none',
    recurrence_until: row.recurrence_until ?? null,
    source: row.source ?? 'user',
    archived_at: row.archived_at ?? null,
    created_at: row.created_at,
  };
}

// Todas as tarefas ativas (não arquivadas) do usuário. A expansão em ocorrências
// por dia é feita no cliente (src/lib/recurrence).
export async function getTasks() {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .is('archived_at', null)
    .order('scheduled_date', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapTask);
}

// Conclusões dentro de um intervalo [fromISO, toISO] (inclusivo), para cruzar
// com as ocorrências expandidas.
export async function getCompletions(fromISO, toISO) {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('task_completions')
    .select('id, task_id, occurrence_date, done, completed_at')
    .eq('user_id', userId)
    .gte('occurrence_date', fromISO)
    .lte('occurrence_date', toISO);
  if (error) throw new Error(error.message);
  return data ?? [];
}

// Histórico: ocorrências concluídas (done=true), mais recentes primeiro, com o
// título da tarefa via join. Usado na aba "Histórico" da agenda.
export async function getHistory(limit = 100) {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('task_completions')
    .select('id, occurrence_date, completed_at, tasks(title)')
    .eq('user_id', userId)
    .eq('done', true)
    .order('completed_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: row.id,
    date: row.occurrence_date,
    completedAt: row.completed_at,
    title: row.tasks?.title ?? 'Tarefa',
  }));
}

// Cria uma tarefa. `date` e `until` são 'YYYY-MM-DD'; `time` é 'HH:MM' ou null;
// `recurrence` ∈ none|daily|weekly; `source` ∈ user|sage.
export async function addTask({ title, description, date, time, recurrence, recurrenceUntil, source }) {
  const userId = await getCurrentUserId();
  const clean = (title || '').trim();
  if (!clean) throw new Error('Informe um título para a tarefa.');

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id: userId,
      title: clean.slice(0, 200),
      description: description ? String(description).slice(0, 1000) : null,
      scheduled_date: date,
      scheduled_time: time || null,
      recurrence: recurrence || 'none',
      recurrence_until: recurrenceUntil || null,
      source: source || 'user',
    })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return mapTask(data);
}

// Edição de campos da tarefa (título, hora, recorrência...).
export async function updateTask(taskId, patch) {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('tasks')
    .update(patch)
    .eq('id', taskId)
    .eq('user_id', userId)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return mapTask(data);
}

// Remoção suave: marca archived_at. Preserva o histórico de conclusões e não
// quebra a aba "Histórico" (que faz join com tasks).
export async function deleteTask(taskId) {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from('tasks')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', taskId)
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
}

// Alterna a conclusão de UMA ocorrência (task + data) via RPC gam_complete_task.
// Retorna { progress, taskXP, done }.
export async function toggleCompletion(taskId, isoDate) {
  return rpcCompleteTask(taskId, isoDate);
}
