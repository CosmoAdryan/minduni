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

  if (error) return [];
  return data.map((row) => ({
    id: row.id,
    mood: row.mood,
    text: row.text,
    date: row.created_at,
  }));
}

export async function addEntry(mood, text) {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('journal_entries')
    .insert({ user_id: userId, mood, text })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return {
    id: data.id,
    mood: data.mood,
    text: data.text,
    date: data.created_at,
  };
}
