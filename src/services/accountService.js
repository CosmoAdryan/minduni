import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { INITIAL_PROGRESS, saveProgress } from './progressService';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Sessão expirada. Entre novamente.');
  return user;
}

// Atualiza o nome de exibição no perfil.
export async function updateName(name) {
  const trimmed = (name || '').trim();
  if (trimmed.length < 2) throw new Error('O nome deve ter pelo menos 2 caracteres.');
  const user = await getCurrentUser();
  const { error } = await supabase
    .from('profiles')
    .update({ name: trimmed })
    .eq('id', user.id);
  if (error) throw new Error(error.message);
  return trimmed;
}

// Abre a galeria, deixa o usuário recortar (quadrado) e devolve o asset
// selecionado (com base64). Retorna null se o usuário cancelar.
export async function pickAvatarImage() {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    throw new Error('Precisamos da permissão de acesso às fotos para alterar o avatar.');
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.5,
    base64: true,
  });
  if (result.canceled) return null;
  return result.assets[0];
}

// Envia o avatar e grava a URL pública no perfil. Retorna a URL salva.
//
// O upload passa pela Edge Function `upload-avatar` (service_role): a RLS do
// Storage recusava o upload direto a partir do React Native mesmo com o token
// do usuário válido. A função identifica o usuário pelo próprio token e grava
// em {uid}/avatar.jpg — mesmo padrão usado pelo chat (sage-chat).
export async function uploadAvatar(asset) {
  if (!asset?.base64) throw new Error('Não foi possível ler a imagem selecionada.');
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Sessão expirada. Entre novamente.');

  const res = await fetch(`${SUPABASE_URL}/functions/v1/upload-avatar`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ image: asset.base64, contentType: asset.mimeType }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || `Falha ao enviar a imagem (${res.status}).`);
  }
  return data.url;
}

// Altera a senha do usuário logado. Confirma a senha atual reautenticando
// antes de definir a nova (evita troca indevida com sessão aberta).
export async function changePassword(currentPassword, newPassword) {
  if (!newPassword || newPassword.length < 6) {
    throw new Error('A nova senha deve ter pelo menos 6 caracteres.');
  }
  const user = await getCurrentUser();

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (signInError) throw new Error('Senha atual incorreta.');

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
}

// Limpa os dados de uso (humor, diário, conversas, práticas e progresso),
// mantendo a conta e a identidade (nome/avatar). Direito de exclusão de dados
// sem encerrar a conta — Política de Privacidade, seção 9.
export async function clearUserData() {
  const user = await getCurrentUser();
  const uid = user.id;

  // chat_messages antes de chat_sessions (FK). Demais são independentes.
  const ops = [
    supabase.from('chat_messages').delete().eq('user_id', uid),
    supabase.from('challenge_logs').delete().eq('user_id', uid),
    supabase.from('journal_entries').delete().eq('user_id', uid),
  ];
  for (const op of ops) {
    const { error } = await op;
    if (error) throw new Error(error.message);
  }
  const { error: sessErr } = await supabase.from('chat_sessions').delete().eq('user_id', uid);
  if (sessErr) throw new Error(sessErr.message);

  // Zera o progresso para o estado inicial.
  await saveProgress({ ...INITIAL_PROGRESS, lastLogin: new Date().toDateString() });
}

// Exclui definitivamente a conta (auth + todos os dados via cascade) através da
// Edge Function com service_role. O cliente não tem permissão para apagar a
// própria conta de auth, por isso o servidor faz a exclusão.
export async function deleteAccount() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Sessão expirada. Entre novamente.');

  const response = await fetch(`${SUPABASE_URL}/functions/v1/delete-account`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      apikey: SUPABASE_ANON_KEY,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || 'Não foi possível excluir a conta. Tente novamente.');
  }
}
