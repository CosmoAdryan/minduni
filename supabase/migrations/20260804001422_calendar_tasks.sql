-- Agenda / Calendário: tarefas e cronogramas com recorrência.
--
-- Duas tabelas:
--   * tasks              — o "template" da tarefa (título, data, hora, recorrência).
--   * task_completions   — estado de conclusão POR OCORRÊNCIA (data). Necessário
--                          porque uma tarefa recorrente é concluída dia a dia.
--
-- Decisões (espelham a gamificação server-side existente):
--   * RLS por auth.uid(); anon sem GRANT (defense-in-depth).
--   * A conclusão passa pela RPC gam_complete_task (SECURITY DEFINER): o XP é
--     decidido no servidor e concedido UMA única vez por ocorrência (o cliente
--     não envia XP e não pode farmar marcando/desmarcando).
--   * Datas de ocorrência são `date` (dia do fuso do público, calculado no app
--     a partir do calendário — a expansão de recorrência é feita no cliente).

-- ── 1) Tabelas ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.tasks (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title            text NOT NULL,
  description      text,
  scheduled_date   date NOT NULL,
  scheduled_time   time,
  recurrence       text NOT NULL DEFAULT 'none' CHECK (recurrence IN ('none', 'daily', 'weekly')),
  recurrence_until date,
  source           text NOT NULL DEFAULT 'user' CHECK (source IN ('user', 'sage')),
  archived_at      timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tasks_user_date_idx ON public.tasks (user_id, scheduled_date);

CREATE TABLE IF NOT EXISTS public.task_completions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id         uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  occurrence_date date NOT NULL,
  done            boolean NOT NULL DEFAULT true,
  -- true depois que a ocorrência foi concluída ao menos uma vez (trava o XP).
  xp_awarded      boolean NOT NULL DEFAULT false,
  completed_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (task_id, occurrence_date)
);

CREATE INDEX IF NOT EXISTS task_completions_user_idx ON public.task_completions (user_id, occurrence_date);

-- ── 2) RLS ───────────────────────────────────────────────────────────────────

ALTER TABLE public.tasks             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_completions  ENABLE ROW LEVEL SECURITY;

-- tasks: o dono cria/edita/apaga suas tarefas direto (leitura e escrita).
CREATE POLICY "tasks_select_own" ON public.tasks
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "tasks_insert_own" ON public.tasks
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tasks_update_own" ON public.tasks
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tasks_delete_own" ON public.tasks
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- task_completions: leitura do dono; escrita SÓ via RPC (SECURITY DEFINER
-- ignora a RLS). Sem policy de insert/update/delete = escrita direta barrada.
CREATE POLICY "task_completions_select_own" ON public.task_completions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ── 3) Grants (defense-in-depth: anon nunca toca nestas tabelas) ─────────────

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks            TO authenticated;
GRANT SELECT                          ON public.task_completions TO authenticated;
REVOKE ALL ON public.tasks            FROM anon;
REVOKE ALL ON public.task_completions FROM anon;

-- ── 4) Coluna de progresso (alimenta badges de tarefas) ──────────────────────

ALTER TABLE public.progress
  ADD COLUMN IF NOT EXISTS tasks_completed_count integer NOT NULL DEFAULT 0;

-- ── 5) Badges: inclui tasks_5 / tasks_25 no cálculo central ──────────────────
-- (mesma assinatura; CREATE OR REPLACE reaproveita a função existente.)

CREATE OR REPLACE FUNCTION public.gam_compute_badges(p public.progress)
RETURNS text[]
LANGUAGE plpgsql IMMUTABLE
SET search_path = ''
AS $$
DECLARE
  b text[] := coalesce(p.unlocked_badges, '{}');
  moods_len int := jsonb_array_length(coalesce(p.moods, '[]'::jsonb));
BEGIN
  IF coalesce(p.chat_sessions, 0) >= 1     AND NOT 'first_chat'    = ANY(b) THEN b := b || 'first_chat';    END IF;
  IF coalesce(p.streak, 0) >= 3            AND NOT 'streak_3'      = ANY(b) THEN b := b || 'streak_3';      END IF;
  IF coalesce(p.streak, 0) >= 7            AND NOT 'streak_7'      = ANY(b) THEN b := b || 'streak_7';      END IF;
  IF coalesce(p.streak, 0) >= 30           AND NOT 'streak_30'     = ANY(b) THEN b := b || 'streak_30';     END IF;
  IF moods_len >= 7                        AND NOT 'mood_7'        = ANY(b) THEN b := b || 'mood_7';        END IF;
  IF moods_len >= 30                       AND NOT 'mood_30'       = ANY(b) THEN b := b || 'mood_30';       END IF;
  IF coalesce(p.level, 1) >= 3             AND NOT 'level_3'       = ANY(b) THEN b := b || 'level_3';       END IF;
  IF coalesce(p.level, 1) >= 5             AND NOT 'level_5'       = ANY(b) THEN b := b || 'level_5';       END IF;
  IF coalesce(p.level, 1) >= 10            AND NOT 'level_10'      = ANY(b) THEN b := b || 'level_10';      END IF;
  IF coalesce(p.journal_entries_count, 0) >= 5  AND NOT 'journal_5'  = ANY(b) THEN b := b || 'journal_5';   END IF;
  IF coalesce(p.journal_entries_count, 0) >= 15 AND NOT 'journal_15' = ANY(b) THEN b := b || 'journal_15';  END IF;
  IF coalesce(p.total_xp, 0) >= 1000       AND NOT 'xp_1000'       = ANY(b) THEN b := b || 'xp_1000';       END IF;
  IF coalesce(p.chat_streak, 0) >= 7       AND NOT 'chat_streak_7' = ANY(b) THEN b := b || 'chat_streak_7'; END IF;
  IF coalesce(p.days_active, 0) >= 30      AND NOT 'active_30'     = ANY(b) THEN b := b || 'active_30';     END IF;
  IF coalesce(p.tasks_completed_count, 0) >= 5  AND NOT 'tasks_5'  = ANY(b) THEN b := b || 'tasks_5';       END IF;
  IF coalesce(p.tasks_completed_count, 0) >= 25 AND NOT 'tasks_25' = ANY(b) THEN b := b || 'tasks_25';      END IF;
  RETURN b;
END;
$$;

-- ── 6) RPC de conclusão de tarefa ────────────────────────────────────────────
-- Alterna a conclusão de UMA ocorrência (task_id + data). Concede +15 XP só na
-- primeira vez que a ocorrência é concluída (xp_awarded trava). Desmarcar não
-- remove XP. Idempotente por ocorrência.

CREATE OR REPLACE FUNCTION public.gam_complete_task(p_task_id uuid, p_date date)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  uid uuid := auth.uid();
  p public.progress;
  t public.tasks;
  comp public.task_completions;
  xp int := 0;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF p_date IS NULL THEN RAISE EXCEPTION 'invalid date'; END IF;

  -- A tarefa precisa existir e pertencer ao usuário.
  SELECT * INTO t FROM public.tasks WHERE id = p_task_id AND user_id = uid;
  IF NOT FOUND THEN RAISE EXCEPTION 'task not found'; END IF;

  -- Lock por usuário: serializa chamadas concorrentes do mesmo dono.
  p := public.gam_progress_for_update(uid);

  SELECT * INTO comp FROM public.task_completions
  WHERE task_id = p_task_id AND occurrence_date = p_date;

  IF NOT FOUND THEN
    -- Primeira conclusão da ocorrência: cria concluída e premia.
    INSERT INTO public.task_completions (user_id, task_id, occurrence_date, done, xp_awarded, completed_at)
    VALUES (uid, p_task_id, p_date, true, true, now())
    RETURNING * INTO comp;
    xp := 15;
  ELSIF comp.done THEN
    -- Desmarcar: mantém o XP já concedido.
    UPDATE public.task_completions SET done = false WHERE id = comp.id RETURNING * INTO comp;
  ELSE
    -- Remarcar: só premia se ainda não tinha ganhado XP nesta ocorrência.
    xp := CASE WHEN comp.xp_awarded THEN 0 ELSE 15 END;
    UPDATE public.task_completions
    SET done = true, xp_awarded = true, completed_at = now()
    WHERE id = comp.id
    RETURNING * INTO comp;
  END IF;

  IF xp > 0 THEN
    p.total_xp := coalesce(p.total_xp, 0) + xp;
    p.level := public.gam_calc_level(p.total_xp);
  END IF;

  -- Recontagem estável: ocorrências já concluídas alguma vez (imune a drift).
  SELECT count(*) INTO p.tasks_completed_count
  FROM public.task_completions WHERE user_id = uid AND xp_awarded = true;

  p.unlocked_badges := public.gam_compute_badges(p);

  UPDATE public.progress SET
    total_xp = p.total_xp, level = p.level,
    tasks_completed_count = p.tasks_completed_count,
    unlocked_badges = p.unlocked_badges, updated_at = now()
  WHERE user_id = uid;

  RETURN jsonb_build_object('progress', to_jsonb(p), 'awarded_xp', xp, 'done', comp.done);
END;
$$;

-- ── 7) Reset de progresso: também zera a contagem de tarefas ─────────────────
-- (redefine gam_reset_progress incluindo tasks_completed_count.)

CREATE OR REPLACE FUNCTION public.gam_reset_progress()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  uid uuid := auth.uid();
  today date := public.gam_today();
  p public.progress;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  p := public.gam_progress_for_update(uid);

  UPDATE public.progress SET
    total_xp = 0, level = 1, streak = 0, last_login = today::text,
    unlocked_badges = '{}', moods = '[]'::jsonb, chat_sessions = 0,
    journal_entries_count = 0, days_active = 1, chat_streak = 0,
    chat_streak_date = NULL, tasks_completed_count = 0, updated_at = now()
  WHERE user_id = uid
  RETURNING * INTO p;

  RETURN jsonb_build_object('progress', to_jsonb(p));
END;
$$;

-- ── 8) Permissões da RPC ─────────────────────────────────────────────────────

REVOKE EXECUTE ON FUNCTION public.gam_complete_task(uuid, date) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.gam_complete_task(uuid, date) TO authenticated;
