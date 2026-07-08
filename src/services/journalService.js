import { supabase } from '../lib/supabase';

async function getCurrentUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

export async function getEntries() {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);
  return data.map((row) => ({
    id: row.id,
    mood: row.mood,
    text: row.text,
    date: row.created_at,
  }));
}

// Cria a entrada via RPC (gam_add_journal_entry): o servidor grava a entrada,
// atualiza o contador, premia +20 XP e recalcula badges numa única transação.
// Returns { entry, progress: <linha db>, journalXP }.
export async function addEntry(mood, text) {
  const { data, error } = await supabase.rpc('gam_add_journal_entry', {
    p_mood: mood,
    p_text: text,
  });
  if (error) throw new Error(error.message);

  const row = data?.entry ?? {};
  return {
    entry: {
      id: row.id,
      mood: row.mood,
      text: row.text,
      date: row.created_at,
    },
    progressRow: data?.progress ?? {},
    journalXP: data?.awarded_xp ?? 0,
  };
}
