import { supabase } from '../lib/supabase';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Tempo máximo de espera por uma resposta da Edge Function. Sem isso, uma
// requisição que trava deixaria o chat "digitando" para sempre.
const REQUEST_TIMEOUT_MS = 30000;

// Quantas mensagens carregar do histórico ao abrir o chat corrido.
const HISTORY_PAGE_SIZE = 50;

// POST para a função sage-chat com token do usuário e timeout via AbortController.
async function postToSage(body) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Not authenticated');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(`${SUPABASE_URL}/functions/v1/sage-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw new Error('A resposta demorou demais. Tente novamente.');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// Chat corrido: cada usuário tem UMA conversa contínua. Reaproveita a sessão
// mais recente; cria uma só na primeira vez.
export async function getOrCreateSession() {
  const { data: { user } } = await supabase.auth.getUser();

  const { data: existing } = await supabase
    .from('chat_sessions')
    .select('id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.id) return existing;

  const { data, error } = await supabase
    .from('chat_sessions')
    .insert({ user_id: user.id })
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Carrega as últimas mensagens da conversa para exibição. Retorna em ordem
// cronológica (mais antiga primeiro), no formato usado pela UI.
export async function getMessages(sessionId, limit = HISTORY_PAGE_SIZE) {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('id, role, content, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);

  return (data ?? [])
    .reverse()
    .map((m) => ({
      id: m.id,
      role: m.role === 'model' ? 'sage' : 'user',
      content: m.content,
      timestamp: m.created_at,
    }));
}

// Total de mensagens enviadas pelo usuário ao Sage (role 'user'). Usado como
// estatística no perfil. Conta direto no banco — sem contador redundante.
export async function getUserMessageCount() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;
  const { count, error } = await supabase
    .from('chat_messages')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('role', 'user');
  if (error) return 0;
  return count ?? 0;
}

// Saudação de abertura, só usada quando a conversa está vazia.
// Não conta para nenhum limite.
export async function getIntroMessage(sessionId, mood) {
  const response = await postToSage({ session_id: sessionId, intro: true, mood });

  const data = await response.json();
  if (!response.ok) throw new Error(data?.error || `Erro ${response.status}`);
  if (!data?.response) throw new Error('Resposta inválida do servidor');
  return data;
}

// Returns { response: string, crisis?: boolean }
export async function sendMessage(sessionId, message, history, mood) {
  const response = await postToSage({ session_id: sessionId, message, history, mood });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || `Erro ${response.status}`);
  }

  if (!data?.response) throw new Error('Resposta inválida do servidor');
  return data;
}
