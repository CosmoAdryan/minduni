import { supabase } from '../lib/supabase';

export const LEVELS = [
  { level: 1, name: 'Explorador Mental', minXP: 0, maxXP: 100 },
  { level: 2, name: 'Buscador de Luz', minXP: 100, maxXP: 250 },
  { level: 3, name: 'Mente Curiosa', minXP: 250, maxXP: 450 },
  { level: 4, name: 'Navegador Emocional', minXP: 450, maxXP: 700 },
  { level: 5, name: 'Guardião do Equilíbrio', minXP: 700, maxXP: 1000 },
  { level: 6, name: 'Mestre da Resiliência', minXP: 1000, maxXP: 1350 },
  { level: 7, name: 'Sábio Interior', minXP: 1350, maxXP: 1750 },
  { level: 8, name: 'Iluminado', minXP: 1750, maxXP: 2200 },
  { level: 9, name: 'Arquiteto Mental', minXP: 2200, maxXP: 2700 },
  { level: 10, name: 'Mestre MindUni', minXP: 2700, maxXP: 2700 },
];

export const INITIAL_PROGRESS = {
  totalXP: 0,
  level: 1,
  streak: 0,
  lastLogin: null,
  unlockedBadges: [],
  moods: [],
  chatSessions: 0,
  journalEntries: 0,
  daysActive: 1,
  // Streak de engajamento no chat (independente do streak de login).
  chatStreak: 0,
  chatStreakDate: null,
  // Total de ocorrências de tarefas já concluídas (agenda). Alimenta badges.
  tasksCompleted: 0,
};

export function calculateLevel(xp) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXP) return LEVELS[i];
  }
  return LEVELS[0];
}

async function getCurrentUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

// Converte a linha do banco para o formato usado na UI. Exportado porque o
// journalService também recebe a linha de progresso na resposta da RPC.
export function dbToProgress(row) {
  return {
    totalXP: row.total_xp ?? 0,
    level: row.level ?? 1,
    streak: row.streak ?? 0,
    lastLogin: row.last_login ?? null,
    unlockedBadges: row.unlocked_badges ?? [],
    moods: row.moods ?? [],
    chatSessions: row.chat_sessions ?? 0,
    journalEntries: row.journal_entries_count ?? 0,
    daysActive: row.days_active ?? 1,
    chatStreak: row.chat_streak ?? 0,
    chatStreakDate: row.chat_streak_date ?? null,
    tasksCompleted: row.tasks_completed_count ?? 0,
  };
}

export async function getProgress() {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('progress')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) return { ...INITIAL_PROGRESS };
  return dbToProgress(data);
}

// ─── RPCs de gamificação ─────────────────────────────────────────────────────
// XP, streaks e badges são calculados NO SERVIDOR (funções gam_* no Postgres):
// o cliente não define valores de XP nem grava direto na tabela `progress`.
// Cada RPC retorna { progress: <linha>, awarded_xp?: <int> }.

async function callRpc(fn, args) {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw new Error(error.message);
  return {
    progress: dbToProgress(data?.progress ?? {}),
    awardedXP: data?.awarded_xp ?? 0,
    raw: data,
  };
}

// Login diário: +10 XP e streak, 1x/dia (dia do servidor).
// Returns { progress, loginXP } — loginXP é 0 se já logou hoje.
export async function applyLogin() {
  const { progress, awardedXP } = await callRpc('gam_apply_login');
  return { progress, loginXP: awardedXP };
}

// Primeira mensagem do dia no chat: streak próprio (5 → 50) e first_chat.
// Returns { progress, chatXP } — chatXP é 0 se já recompensou hoje.
export async function applyChatStreak() {
  const { progress, awardedXP } = await callRpc('gam_apply_chat_streak');
  return { progress, chatXP: awardedXP };
}

// Conclui um desafio do dia. XP definido no servidor pelo ID; idempotente.
// Returns { progress, challengeXP } — challengeXP é 0 se já concluído hoje.
export async function completeChallenge(challengeId) {
  const { progress, awardedXP } = await callRpc('gam_complete_challenge', {
    p_challenge_id: challengeId,
  });
  return { progress, challengeXP: awardedXP };
}

// Conclui/reabre UMA ocorrência de tarefa (agenda). O XP (+15) é decidido no
// servidor e concedido só na primeira conclusão da ocorrência; idempotente.
// Returns { progress, taskXP, done } — taskXP é 0 se já premiado ou ao desmarcar.
export async function completeTask(taskId, isoDate) {
  const { progress, awardedXP, raw } = await callRpc('gam_complete_task', {
    p_task_id: taskId,
    p_date: isoDate,
  });
  return { progress, taskXP: awardedXP, done: raw?.done ?? false };
}

// Registra um humor (check-in). Sem XP; alimenta badges mood_7/mood_30.
export async function addMoodEntry(mood, phase) {
  const { progress } = await callRpc('gam_add_mood', { p_mood: mood, p_phase: phase });
  return progress;
}

// Zera o progresso (usado no cadastro e em "limpar dados").
export async function resetProgress() {
  const { progress } = await callRpc('gam_reset_progress');
  return progress;
}
