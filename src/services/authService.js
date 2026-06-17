import { supabase } from '../lib/supabase';

export async function register(name, email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw new Error(error.message);
  const user = data.user;
  if (!user) throw new Error('Erro ao criar conta');

  const { error: profileError } = await supabase
    .from('profiles')
    .insert({ id: user.id, name });
  if (profileError) throw new Error(profileError.message);

  return { id: user.id, name, email, createdAt: user.created_at };
}

export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error('Email ou senha incorretos');

  const user = data.user;
  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .single();

  return {
    id: user.id,
    name: profile?.name ?? '',
    email: user.email,
    createdAt: user.created_at,
  };
}

export async function logout() {
  await supabase.auth.signOut();
}

// Envia o e-mail de recuperação de senha. Com o template de e-mail configurado
// para usar {{ .Token }}, o usuário recebe um código de 6 dígitos (OTP) — sem
// depender de deep link, funciona igual no Expo Go, no APK e na web.
export async function resetPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw new Error(error.message);
}

// Valida o código (OTP) recebido por e-mail e abre uma sessão de recuperação.
// Após isso, updatePassword() pode definir a nova senha.
export async function verifyRecoveryOtp(email, token) {
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'recovery',
  });
  if (error) throw new Error('Código inválido ou expirado. Verifique e tente novamente.');
}

// Define a nova senha. Requer uma sessão de recuperação ativa (criada por
// verifyRecoveryOtp).
export async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
}

export async function getCurrentUser() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const user = session.user;
  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .single();

  return {
    id: user.id,
    name: profile?.name ?? '',
    email: user.email,
    createdAt: user.created_at,
  };
}
