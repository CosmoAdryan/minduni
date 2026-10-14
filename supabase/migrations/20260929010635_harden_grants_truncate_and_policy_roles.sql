-- Hardening de grants e papéis das policies (defense-in-depth).
--
-- Contexto: os default privileges do Supabase concedem ALL em toda tabela nova
-- para `anon`/`authenticated` no momento do CREATE TABLE. As migrations
-- anteriores adicionaram os GRANTs desejados e revogaram `anon`, mas os
-- privilégios herdados que sobraram para `authenticated` nunca foram removidos.
-- Esta migration alinha as permissões com a intenção já documentada.
--
--   1) TRUNCATE ignora RLS por completo. Estava concedido nas 8 tabelas: um
--      TRUNCATE apagaria os dados de TODOS os usuários, não só os do chamador.
--      TRIGGER e REFERENCES também não têm uso legítimo para um cliente.
--   2) task_completions: a migration calendar_tasks documenta "escrita SÓ via
--      RPC (gam_complete_task, SECURITY DEFINER)" e concede apenas SELECT, mas
--      INSERT/UPDATE/DELETE continuaram herdados. Hoje a RLS barra (não existe
--      policy de escrita), porém basta alguém adicionar uma policy permissiva
--      para a escrita direta abrir. Revogar fecha as duas camadas.
--      O "limpar dados" não é afetado: ele apaga `tasks` e as conclusões caem
--      por ON DELETE CASCADE, que roda com o privilégio do dono da tabela.
--   3) As 6 policies mais antigas foram criadas sem TO, ou seja, valem para o
--      papel `public` — que inclui `anon`. Na prática `anon` já não tem GRANT
--      nenhum, mas restringir a `authenticated` torna a regra explícita e
--      evita que um GRANT futuro reabra o acesso por descuido.
--      `service_role` tem BYPASSRLS, então as Edge Functions não são afetadas.

-- ── 1) Privilégios que nunca devem pertencer a um papel de cliente ───────────
REVOKE TRUNCATE, TRIGGER, REFERENCES ON public.profiles         FROM anon, authenticated;
REVOKE TRUNCATE, TRIGGER, REFERENCES ON public.progress         FROM anon, authenticated;
REVOKE TRUNCATE, TRIGGER, REFERENCES ON public.journal_entries  FROM anon, authenticated;
REVOKE TRUNCATE, TRIGGER, REFERENCES ON public.challenge_logs   FROM anon, authenticated;
REVOKE TRUNCATE, TRIGGER, REFERENCES ON public.chat_sessions    FROM anon, authenticated;
REVOKE TRUNCATE, TRIGGER, REFERENCES ON public.chat_messages    FROM anon, authenticated;
REVOKE TRUNCATE, TRIGGER, REFERENCES ON public.tasks            FROM anon, authenticated;
REVOKE TRUNCATE, TRIGGER, REFERENCES ON public.task_completions FROM anon, authenticated;

-- ── 2) task_completions: leitura do dono, escrita só via RPC ─────────────────
REVOKE INSERT, UPDATE, DELETE ON public.task_completions FROM authenticated;

-- ── 3) Policies restritas ao papel `authenticated` ──────────────────────────
DROP POLICY IF EXISTS "own profile" ON public.profiles;
CREATE POLICY "own profile" ON public.profiles
  FOR ALL TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "own progress" ON public.progress;
CREATE POLICY "own progress" ON public.progress
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "own journal" ON public.journal_entries;
CREATE POLICY "own journal" ON public.journal_entries
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "own challenges" ON public.challenge_logs;
CREATE POLICY "own challenges" ON public.challenge_logs
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "own sessions" ON public.chat_sessions;
CREATE POLICY "own sessions" ON public.chat_sessions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "own messages" ON public.chat_messages;
CREATE POLICY "own messages" ON public.chat_messages
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
