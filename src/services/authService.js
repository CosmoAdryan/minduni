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
