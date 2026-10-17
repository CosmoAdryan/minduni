import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { resetProgress } from './progressService';
import { CONSENT_VERSION, markConsentGiven } from './onboardingService';

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

// Registra o aceite da versão atual do consentimento LGPD (reconsentimento após
// mudança no texto). Grava data e versão no perfil e o aceite local. O aceite
// do Sage é decidido junto: marcado grava a data; desmarcado equivale a revogar
// (apaga as conversas). Retorna { version, aiConsentAt }.
export async function acceptConsent(aiConsent) {
  const user = await getCurrentUser();
  const now = new Date().toISOString();
  if (!aiConsent) await deleteChatHistory(user.id);
  const { error } = await supabase
    .from('profiles')
    .update({
      consent_given_at: now,
      consent_version: CONSENT_VERSION,
      ai_consent_at: aiConsent ? now : null,
    })
    .eq('id', user.id);
  if (error) throw new Error(error.message);
  await markConsentGiven();
  return { version: CONSENT_VERSION, aiConsentAt: aiConsent ? now : null };
}

// Apaga todas as conversas do usuário (mensagens antes das sessões, por FK).
// As sessões levam junto o resumo acumulado (chat_sessions.summary).
async function deleteChatHistory(uid) {
  const { error: msgErr } = await supabase.from('chat_messages').delete().eq('user_id', uid);
  if (msgErr) throw new Error(msgErr.message);
  const { error: sessErr } = await supabase.from('chat_sessions').delete().eq('user_id', uid);
  if (sessErr) throw new Error(sessErr.message);
}

// Ativa o Sage: aceite específico do envio das conversas ao Gemini
// (LGPD art. 11, I). Retorna a data registrada.
export async function grantAiConsent() {
  const user = await getCurrentUser();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('profiles')
    .update({ ai_consent_at: now })
    .eq('id', user.id);
  if (error) throw new Error(error.message);
  return now;
}

// Desativa o Sage (revogação, LGPD art. 8º, § 5º): apaga o histórico e o resumo
// das conversas e retira o aceite. Apaga antes de retirar o aceite para que uma
// falha no meio não deixe o usuário sem aceite e com as conversas guardadas.
export async function revokeAiConsent() {
  const user = await getCurrentUser();
  await deleteChatHistory(user.id);
  const { error } = await supabase
    .from('profiles')
    .update({ ai_consent_at: null })
    .eq('id', user.id);
  if (error) throw new Error(error.message);
}

// Abre a galeria, deixa o usuário recortar (quadrado) e devolve o asset
// selecionado (com base64). Retorna null se o usuário cancelar.
export async function pickAvatarImage() {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    throw new Error('Precisamos da permissão de acesso às fotos para alterar o avatar.');
  }
  let result;
  try {
    result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });
  } catch (e) {
    throw new Error(galleryErrorMessage(e));
  }
  if (result.canceled) return null;
  return result.assets[0];
}

// Android: depois de um uso longo, o vínculo nativo com a galeria pode se
// perder ("unregistered ActivityResultLauncher", expo-modules-core) e só volta
// ao reabrir o app (teste funcional da v1.0, CT-11). A causa está na
// biblioteca; aqui só trocamos o erro técnico por uma orientação.
export const GALLERY_UNAVAILABLE_MESSAGE =
  'Não foi possível abrir a galeria agora. Feche o MindUni por completo, abra de novo e tente outra vez.';

export function galleryErrorMessage(error) {
  const msg = String(error?.message || '');
  if (msg.includes('unregistered ActivityResultLauncher')) return GALLERY_UNAVAILABLE_MESSAGE;
  return msg || 'Não foi possível abrir a galeria.';
}

// Envia o avatar; a função grava o caminho no perfil e devolve uma URL
// assinada (o bucket é privado) para exibir na hora.
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
  if (!newPassword || newPassword.length < 8) {
    throw new Error('A nova senha deve ter pelo menos 8 caracteres.');
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
    // tasks: as task_completions caem por ON DELETE CASCADE.
    supabase.from('tasks').delete().eq('user_id', uid),
  ];
  for (const op of ops) {
    const { error } = await op;
    if (error) throw new Error(error.message);
  }
  const { error: sessErr } = await supabase.from('chat_sessions').delete().eq('user_id', uid);
  if (sessErr) throw new Error(sessErr.message);

  // Zera o progresso no servidor (RPC gam_reset_progress) e devolve o estado
  // inicial para a UI.
  return resetProgress();
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
