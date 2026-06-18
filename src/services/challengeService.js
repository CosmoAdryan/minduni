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

export async function markChallengeComplete(challengeId) {
  const userId = await getCurrentUserId();
  const today = toISODate(new Date());

  await supabase
    .from('challenge_logs')
    .upsert(
      { user_id: userId, challenge_id: challengeId, completed_date: today },
      { onConflict: 'user_id,challenge_id,completed_date' },
    );
}
