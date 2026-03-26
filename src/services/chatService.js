import { supabase } from '../lib/supabase';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export async function createSession(preMood) {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('chat_sessions')
    .insert({ user_id: user.id, pre_mood: preMood })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateSessionPostMood(sessionId, postMood) {
  await supabase
    .from('chat_sessions')
    .update({ post_mood: postMood })
    .eq('id', sessionId);
}

// Generates the AI-powered opening greeting, personalised by pre-mood.
// Does NOT count toward the daily message limit.
export async function getIntroMessage(sessionId, preMood) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Not authenticated');

  const response = await fetch(`${SUPABASE_URL}/functions/v1/sage-chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ session_id: sessionId, intro: true, pre_mood: preMood }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data?.error || `Erro ${response.status}`);
  if (!data?.response) throw new Error('Resposta inválida do servidor');
  return data;
}


// Returns { response: string, crisis?: boolean }
// Throws with code 'DAILY_LIMIT_REACHED' when limit is hit
export async function sendMessage(sessionId, message, history) {
  // Get the current session token explicitly
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Not authenticated');

  const response = await fetch(`${SUPABASE_URL}/functions/v1/sage-chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ session_id: sessionId, message, history }),
  });

  const data = await response.json();

  if (response.status === 429 || data?.error === 'DAILY_LIMIT_REACHED') {
    const err = new Error('DAILY_LIMIT_REACHED');
    err.code = 'DAILY_LIMIT_REACHED';
    throw err;
  }

  if (!response.ok) {
    throw new Error(data?.error || `Erro ${response.status}`);
  }

  if (!data?.response) throw new Error('Resposta inválida do servidor');
  return data;
}
