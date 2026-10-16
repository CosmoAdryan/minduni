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

// Todas as entradas, para a exportação em PDF. getEntries() limita a 50 (tela,
// gráfico); aqui pagina em blocos de 1000, o teto padrão de linhas do PostgREST.
const EXPORT_PAGE = 1000;

export async function getAllEntries() {
  const userId = await getCurrentUserId();
  const rows = [];
  for (let from = 0; ; from += EXPORT_PAGE) {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('id, mood, text, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, from + EXPORT_PAGE - 1);

    if (error) throw new Error(error.message);
    rows.push(...data);
    if (data.length < EXPORT_PAGE) break;
  }
  return rows.map((row) => ({
    id: row.id,
    mood: row.mood,
    text: row.text,
    date: row.created_at,
  }));
}

// Cria a entrada via RPC (gam_add_journal_entry): o servidor grava a entrada,
// atualiza o contador, premia +20 XP (só a 1ª entrada do dia) e recalcula badges numa única transação.
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
