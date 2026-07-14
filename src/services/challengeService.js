import { supabase } from '../lib/supabase';

async function getCurrentUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

function toISODate(date) {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

export async function getCompletedToday() {
  const userId = await getCurrentUserId();
  const today = toISODate(new Date());

  const { data, error } = await supabase
    .from('challenge_logs')
    .select('challenge_id')
    .eq('user_id', userId)
    .eq('completed_date', today);

  if (error) return [];
  return data.map((row) => row.challenge_id);
}

// Returns array of 7 booleans: [6 days ago, ..., today]
// true = at least 1 challenge completed that day
export async function getWeeklyCompletion() {
  const userId = await getCurrentUserId();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const { data, error } = await supabase
    .from('challenge_logs')
    .select('completed_date')
    .eq('user_id', userId)
    .gte('completed_date', toISODate(sevenDaysAgo));

  const datesWithActivity = new Set((data || []).map((row) => row.completed_date));

  const results = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    results.push(datesWithActivity.has(toISODate(date)));
  }
  return results;
}

// Datas (YYYY-MM-DD) com ao menos uma prática concluída nos últimos `days` dias.
// Usado para cruzar humor × prática nos insights do diário.
export async function getPracticeDates(days = 30) {
  const userId = await getCurrentUserId();
  const since = new Date();
  since.setDate(since.getDate() - (days - 1));

  const { data, error } = await supabase
    .from('challenge_logs')
    .select('completed_date')
    .eq('user_id', userId)
    .gte('completed_date', toISODate(since));

  if (error) return new Set();
  return new Set((data || []).map((row) => row.completed_date));
}

// A conclusão de desafios agora é feita pela RPC gam_complete_challenge
// (via progressService.completeChallenge): o servidor valida o ID, define o
// XP e grava o log — o INSERT direto em challenge_logs foi revogado.
