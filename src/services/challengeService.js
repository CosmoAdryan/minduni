import { supabase } from '../lib/supabase';
import { categoryOf } from '../data/challenges';
import { todayKeySaoPaulo } from '../lib/streak';

async function getCurrentUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

// YYYY-MM-DD no fuso do servidor (America/Sao_Paulo), o mesmo de
// challenge_logs.completed_date (gam_today). toISOString() usava UTC e, entre
// 21h e 23h59, apontava para o dia seguinte: o desafio feito não aparecia
// como concluído e a semana marcava o dia anterior.
function toISODate(date) {
  return todayKeySaoPaulo(date);
}

// Data de `days` dias atrás (24h por dia; o Brasil não tem horário de verão).
function daysAgo(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
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
  const { data, error } = await supabase
    .from('challenge_logs')
    .select('completed_date')
    .eq('user_id', userId)
    .gte('completed_date', toISODate(daysAgo(6)));

  const datesWithActivity = new Set((data || []).map((row) => row.completed_date));

  const results = [];
  for (let i = 6; i >= 0; i--) {
    results.push(datesWithActivity.has(toISODate(daysAgo(i))));
  }
  return results;
}

// Datas (YYYY-MM-DD) com ao menos uma prática concluída nos últimos `days` dias.
// Usado para cruzar humor × prática nos insights do diário.
export async function getPracticeDates(days = 30) {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('challenge_logs')
    .select('completed_date')
    .eq('user_id', userId)
    .gte('completed_date', toISODate(daysAgo(days - 1)));

  if (error) return new Set();
  return new Set((data || []).map((row) => row.completed_date));
}

// Histórico de práticas concluídas, agregado por categoria (todo o período).
// Returns { total, byCategory: { <categoria>: <contagem> } }.
export async function getPracticeStats() {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('challenge_logs')
    .select('challenge_id')
    .eq('user_id', userId);

  if (error) return { total: 0, byCategory: {} };

  const byCategory = {};
  for (const row of data || []) {
    const cat = categoryOf(row.challenge_id);
    byCategory[cat] = (byCategory[cat] || 0) + 1;
  }
  return { total: (data || []).length, byCategory };
}

// A conclusão de desafios agora é feita pela RPC gam_complete_challenge
// (via progressService.completeChallenge): o servidor valida o ID, define o
// XP e grava o log — o INSERT direto em challenge_logs foi revogado.
