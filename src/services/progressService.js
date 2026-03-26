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
};

export function calculateLevel(xp) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXP) return LEVELS[i];
  }
  return LEVELS[0];
}

export function checkBadges(progress) {
  const newBadges = [...(progress.unlockedBadges || [])];
  const add = (id) => { if (!newBadges.includes(id)) newBadges.push(id); };

  if (progress.chatSessions >= 1) add('first_chat');
  if (progress.streak >= 3) add('streak_3');
  if (progress.streak >= 7) add('streak_7');
  if (progress.streak >= 30) add('streak_30');
  if (progress.moods && progress.moods.length >= 7) add('mood_7');
  if (progress.level >= 5) add('level_5');
  if (progress.level >= 10) add('level_10');
  if (progress.journalEntries >= 5) add('journal_5');
  if (progress.totalXP >= 1000) add('xp_1000');
  return newBadges;
}

async function getCurrentUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

function dbToProgress(row) {
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
  };
}

function progressToDb(progress) {
  return {
    total_xp: progress.totalXP,
    level: progress.level,
    streak: progress.streak,
    last_login: progress.lastLogin,
    unlocked_badges: progress.unlockedBadges,
    moods: progress.moods,
    chat_sessions: progress.chatSessions,
    journal_entries_count: progress.journalEntries,
    days_active: progress.daysActive,
    updated_at: new Date().toISOString(),
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

export async function saveProgress(progress) {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from('progress')
    .upsert({ user_id: userId, ...progressToDb(progress) });
  if (error) throw new Error(error.message);
  return progress;
}

// Returns { progress, loginXP } — loginXP is 0 if already logged in today
export async function applyLogin(savedProgress) {
  const today = new Date().toDateString();
  if (savedProgress.lastLogin === today) {
    return { progress: savedProgress, loginXP: 0 };
  }
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const isConsecutive = savedProgress.lastLogin === yesterday.toDateString();
  const updated = {
    ...savedProgress,
    streak: isConsecutive ? (savedProgress.streak || 0) + 1 : 1,
    lastLogin: today,
    daysActive: (savedProgress.daysActive || 0) + 1,
    totalXP: (savedProgress.totalXP || 0) + 10,
  };
  const levelInfo = calculateLevel(updated.totalXP);
  updated.level = levelInfo.level;
  updated.unlockedBadges = checkBadges(updated);
  await saveProgress(updated);
  return { progress: updated, loginXP: 10 };
}

export async function addXP(currentProgress, amount) {
  const newXP = (currentProgress.totalXP || 0) + amount;
  const levelInfo = calculateLevel(newXP);
  const updated = { ...currentProgress, totalXP: newXP, level: levelInfo.level };
  updated.unlockedBadges = checkBadges(updated);
  await saveProgress(updated);
  return updated;
}

export async function addMoodEntry(currentProgress, mood, phase) {
  const entry = { mood, phase, date: new Date().toISOString() };
  const updated = {
    ...currentProgress,
    moods: [...(currentProgress.moods || []), entry],
  };
  updated.unlockedBadges = checkBadges(updated);
  await saveProgress(updated);
  return updated;
}

export async function addChatSession(currentProgress) {
  const updated = {
    ...currentProgress,
    chatSessions: (currentProgress.chatSessions || 0) + 1,
  };
  updated.unlockedBadges = checkBadges(updated);
  await saveProgress(updated);
  return updated;
}

export async function incrementJournalEntries(currentProgress) {
  const updated = {
    ...currentProgress,
    journalEntries: (currentProgress.journalEntries || 0) + 1,
  };
  updated.unlockedBadges = checkBadges(updated);
  await saveProgress(updated);
  return updated;
}
