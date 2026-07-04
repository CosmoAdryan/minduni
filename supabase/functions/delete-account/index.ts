import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.99.1';

// Exclusão definitiva da conta (direito de exclusão — LGPD art. 18, VI).
// Remove o usuário de auth.users; as tabelas com FK ON DELETE CASCADE
// (profiles, progress, journal_entries, challenge_logs, chat_sessions,
// chat_messages) são apagadas automaticamente. Os arquivos do Storage não
// sofrem cascade, então removemos a pasta de avatar manualmente.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Método não permitido' }, 405);

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'Não autenticado' }, 401);
  const token = authHeader.replace('Bearer ', '');

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Identifica o usuário a partir do próprio token (impede apagar conta alheia).
  const { data: { user }, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !user) return json({ error: 'Sessão inválida' }, 401);
  const uid = user.id;

  // Remove os arquivos de avatar (Storage não tem cascade).
  try {
    const { data: files } = await admin.storage.from('avatars').list(uid);
    if (files && files.length > 0) {
      await admin.storage.from('avatars').remove(files.map((f) => `${uid}/${f.name}`));
    }
  } catch (_) {
    // Falha ao limpar avatar não deve impedir a exclusão da conta.
  }

  // Exclui o usuário do Auth; o cascade apaga todos os dados nas tabelas.
  const { error: delErr } = await admin.auth.admin.deleteUser(uid);
  if (delErr) return json({ error: delErr.message }, 500);

  return json({ success: true });
});
