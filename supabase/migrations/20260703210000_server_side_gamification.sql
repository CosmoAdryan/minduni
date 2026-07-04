-- Gamificação server-side: XP, streaks e badges passam a ser calculados no
-- Postgres via RPCs. Antes, o cliente escrevia direto na tabela `progress`,
-- o que permitia forjar XP/streak com o próprio token e criava corridas de
-- leitura-modificação-escrita entre dispositivos.
--
-- Decisões:
--   * Datas de streak usam o dia do servidor em America/Sao_Paulo (antes era
--     o relógio do aparelho, manipulável). Colunas text passam a guardar
--     'YYYY-MM-DD'.
--   * XP é definido apenas aqui (login +10, chat 5→50, desafio por ID,
--     diário +20). O cliente não envia valores de XP.
--   * SECURITY DEFINER + filtro por auth.uid(): a RLS continua valendo para
--     leitura; escrita em progress/challenge_logs/journal_entries só via RPC.

-- ── 0) Normaliza datas legadas (formato JS toDateString: 'Thu Jul 03 2026') ──
UPDATE public.progress
SET last_login = to_char(to_date(substring(last_login from 5), 'Mon DD YYYY'), 'YYYY-MM-DD')
WHERE last_login ~ '^[A-Za-z]{3} [A-Za-z]{3} [0-9]{2} [0-9]{4}$';

UPDATE public.progress
SET chat_streak_date = to_char(to_date(substring(chat_streak_date from 5), 'Mon DD YYYY'), 'YYYY-MM-DD')
WHERE chat_streak_date ~ '^[A-Za-z]{3} [A-Za-z]{3} [0-9]{2} [0-9]{4}$';

-- ── 1) Helpers ───────────────────────────────────────────────────────────────

-- Dia "de hoje" no fuso do público-alvo (estudantes brasileiros).
CREATE OR REPLACE FUNCTION public.gam_today()
RETURNS date
LANGUAGE sql STABLE
SET search_path = ''
AS $$
  SELECT (now() AT TIME ZONE 'America/Sao_Paulo')::date;
$$;

-- Nível a partir do XP total (espelho de LEVELS no app).
CREATE OR REPLACE FUNCTION public.gam_calc_level(p_xp integer)
RETURNS integer
LANGUAGE sql IMMUTABLE
SET search_path = ''
AS $$
  SELECT CASE
    WHEN p_xp >= 2700 THEN 10
    WHEN p_xp >= 2200 THEN 9
    WHEN p_xp >= 1750 THEN 8
    WHEN p_xp >= 1350 THEN 7
    WHEN p_xp >= 1000 THEN 6
    WHEN p_xp >=  700 THEN 5
    WHEN p_xp >=  450 THEN 4
    WHEN p_xp >=  250 THEN 3
    WHEN p_xp >=  100 THEN 2
    ELSE 1
  END;
$$;

-- Badges cuja condição depende só do estado de `progress`. `all_challenges`
-- depende de challenge_logs e é tratado em gam_complete_challenge.
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
  RETURN b;
END;
$$;

-- Carrega (com lock) a linha de progresso do usuário, criando se faltar.
-- Interna: sem EXECUTE para papéis de cliente.
CREATE OR REPLACE FUNCTION public.gam_progress_for_update(p_uid uuid)
RETURNS public.progress
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  p public.progress;
BEGIN
  SELECT * INTO p FROM public.progress WHERE user_id = p_uid FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO public.progress (user_id) VALUES (p_uid) ON CONFLICT (user_id) DO NOTHING;
    SELECT * INTO p FROM public.progress WHERE user_id = p_uid FOR UPDATE;
  END IF;
  RETURN p;
END;
$$;

-- ── 2) RPCs ──────────────────────────────────────────────────────────────────

-- Login diário: +10 XP e streak, uma vez por dia.
CREATE OR REPLACE FUNCTION public.gam_apply_login()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  uid uuid := auth.uid();
  today date := public.gam_today();
  p public.progress;
  xp int := 0;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  p := public.gam_progress_for_update(uid);

  IF p.last_login IS DISTINCT FROM today::text THEN
    xp := 10;
    p.streak := CASE WHEN p.last_login = (today - 1)::text THEN coalesce(p.streak, 0) + 1 ELSE 1 END;
    p.last_login := today::text;
    p.days_active := coalesce(p.days_active, 0) + 1;
    p.total_xp := coalesce(p.total_xp, 0) + xp;
    p.level := public.gam_calc_level(p.total_xp);
    p.unlocked_badges := public.gam_compute_badges(p);
    UPDATE public.progress SET
      streak = p.streak, last_login = p.last_login, days_active = p.days_active,
      total_xp = p.total_xp, level = p.level, unlocked_badges = p.unlocked_badges,
      updated_at = now()
    WHERE user_id = uid;
  END IF;

  RETURN jsonb_build_object('progress', to_jsonb(p), 'awarded_xp', xp);
END;
$$;

-- Primeira mensagem do dia no chat: streak próprio com XP 5→50.
-- Também marca chat_sessions >= 1 (badge first_chat).
CREATE OR REPLACE FUNCTION public.gam_apply_chat_streak()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  uid uuid := auth.uid();
  today date := public.gam_today();
  p public.progress;
  xp int := 0;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  p := public.gam_progress_for_update(uid);

  IF p.chat_streak_date IS DISTINCT FROM today::text THEN
    p.chat_streak := CASE WHEN p.chat_streak_date = (today - 1)::text THEN coalesce(p.chat_streak, 0) + 1 ELSE 1 END;
    xp := least(p.chat_streak, 10) * 5;
    p.chat_streak_date := today::text;
    p.total_xp := coalesce(p.total_xp, 0) + xp;
    p.level := public.gam_calc_level(p.total_xp);
  END IF;
  p.chat_sessions := greatest(coalesce(p.chat_sessions, 0), 1);
  p.unlocked_badges := public.gam_compute_badges(p);

  UPDATE public.progress SET
    chat_streak = p.chat_streak, chat_streak_date = p.chat_streak_date,
    chat_sessions = p.chat_sessions, total_xp = p.total_xp, level = p.level,
    unlocked_badges = p.unlocked_badges, updated_at = now()
  WHERE user_id = uid;

  RETURN jsonb_build_object('progress', to_jsonb(p), 'awarded_xp', xp);
END;
$$;

-- Conclui um desafio do dia. O XP é definido AQUI pelo ID (o cliente não
-- manda valor). Idempotente por (usuário, desafio, dia).
CREATE OR REPLACE FUNCTION public.gam_complete_challenge(p_challenge_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  uid uuid := auth.uid();
  today date := public.gam_today();
  p public.progress;
  xp int;
  inserted int;
  done_today int;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  xp := CASE p_challenge_id
    WHEN 'mindfulness_1' THEN 30
    WHEN 'mindfulness_2' THEN 30
    WHEN 'gratitude_1'   THEN 25
    WHEN 'gratitude_2'   THEN 25
    WHEN 'breathing_1'   THEN 20
    WHEN 'breathing_2'   THEN 20
    ELSE NULL
  END;
  IF xp IS NULL THEN RAISE EXCEPTION 'invalid challenge id'; END IF;

  p := public.gam_progress_for_update(uid);

  INSERT INTO public.challenge_logs (user_id, challenge_id, completed_date)
  VALUES (uid, p_challenge_id, today)
  ON CONFLICT (user_id, challenge_id, completed_date) DO NOTHING;
  GET DIAGNOSTICS inserted = ROW_COUNT;

  IF inserted = 0 THEN
    xp := 0; -- já concluído hoje: não premia de novo
  ELSE
    p.total_xp := coalesce(p.total_xp, 0) + xp;
    p.level := public.gam_calc_level(p.total_xp);
  END IF;

  -- 3 desafios no dia => badge all_challenges (um de cada tipo é o que a UI
  -- oferece; contar 3 distintos é equivalente na prática).
  SELECT count(*) INTO done_today
  FROM public.challenge_logs
  WHERE user_id = uid AND completed_date = today;
  IF done_today >= 3 AND NOT 'all_challenges' = ANY(coalesce(p.unlocked_badges, '{}')) THEN
    p.unlocked_badges := coalesce(p.unlocked_badges, '{}') || 'all_challenges';
  END IF;

  p.unlocked_badges := public.gam_compute_badges(p);
  UPDATE public.progress SET
    total_xp = p.total_xp, level = p.level,
    unlocked_badges = p.unlocked_badges, updated_at = now()
  WHERE user_id = uid;

  RETURN jsonb_build_object('progress', to_jsonb(p), 'awarded_xp', xp);
END;
$$;

-- Registra um humor (check-in). Sem XP; alimenta badges mood_7/mood_30.
CREATE OR REPLACE FUNCTION public.gam_add_mood(p_mood integer, p_phase text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  uid uuid := auth.uid();
  p public.progress;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF p_mood IS NULL OR p_mood < 1 OR p_mood > 5 THEN RAISE EXCEPTION 'invalid mood'; END IF;
  IF p_phase IS NULL OR p_phase !~ '^[a-z_]{1,20}$' THEN RAISE EXCEPTION 'invalid phase'; END IF;

  p := public.gam_progress_for_update(uid);
  p.moods := coalesce(p.moods, '[]'::jsonb) || jsonb_build_object(
    'mood', p_mood,
    'phase', p_phase,
    'date', to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
  );
  p.unlocked_badges := public.gam_compute_badges(p);

  UPDATE public.progress SET
    moods = p.moods, unlocked_badges = p.unlocked_badges, updated_at = now()
  WHERE user_id = uid;

  RETURN jsonb_build_object('progress', to_jsonb(p));
END;
$$;

-- Cria a entrada do diário e premia +20 XP numa única transação.
CREATE OR REPLACE FUNCTION public.gam_add_journal_entry(p_mood integer, p_text text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  uid uuid := auth.uid();
  p public.progress;
  entry public.journal_entries;
  xp int := 20;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF p_mood IS NULL OR p_mood < 1 OR p_mood > 5 THEN RAISE EXCEPTION 'invalid mood'; END IF;
  IF p_text IS NULL OR length(btrim(p_text)) = 0 OR length(p_text) > 5000 THEN
    RAISE EXCEPTION 'invalid text';
  END IF;

  p := public.gam_progress_for_update(uid);

  INSERT INTO public.journal_entries (user_id, mood, text)
  VALUES (uid, p_mood, p_text)
  RETURNING * INTO entry;

  -- Contagem real da tabela: imune a drift do contador.
  SELECT count(*) INTO p.journal_entries_count
  FROM public.journal_entries WHERE user_id = uid;

  p.total_xp := coalesce(p.total_xp, 0) + xp;
  p.level := public.gam_calc_level(p.total_xp);
  p.unlocked_badges := public.gam_compute_badges(p);

  UPDATE public.progress SET
    journal_entries_count = p.journal_entries_count, total_xp = p.total_xp,
    level = p.level, unlocked_badges = p.unlocked_badges, updated_at = now()
  WHERE user_id = uid;

  RETURN jsonb_build_object('entry', to_jsonb(entry), 'progress', to_jsonb(p), 'awarded_xp', xp);
END;
$$;

-- Zera o progresso (usado por "limpar dados" e no cadastro).
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
    chat_streak_date = NULL, updated_at = now()
  WHERE user_id = uid
  RETURNING * INTO p;

  RETURN jsonb_build_object('progress', to_jsonb(p));
END;
$$;

-- ── 3) Permissões ────────────────────────────────────────────────────────────

-- Escrita direta sai do cliente; leitura (RLS) continua.
REVOKE INSERT, UPDATE, DELETE ON public.progress        FROM authenticated;
REVOKE INSERT, UPDATE        ON public.challenge_logs  FROM authenticated; -- DELETE fica p/ "limpar dados"
REVOKE INSERT, UPDATE        ON public.journal_entries FROM authenticated; -- idem

-- RPCs: só authenticated executa. Helpers internos: ninguém do cliente.
REVOKE EXECUTE ON FUNCTION public.gam_today()                        FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.gam_calc_level(integer)            FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.gam_compute_badges(public.progress) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.gam_progress_for_update(uuid)      FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.gam_apply_login()                  FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.gam_apply_chat_streak()            FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.gam_complete_challenge(text)       FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.gam_add_mood(integer, text)        FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.gam_add_journal_entry(integer, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.gam_reset_progress()               FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.gam_apply_login()                    TO authenticated;
GRANT EXECUTE ON FUNCTION public.gam_apply_chat_streak()              TO authenticated;
GRANT EXECUTE ON FUNCTION public.gam_complete_challenge(text)         TO authenticated;
GRANT EXECUTE ON FUNCTION public.gam_add_mood(integer, text)          TO authenticated;
GRANT EXECUTE ON FUNCTION public.gam_add_journal_entry(integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.gam_reset_progress()                 TO authenticated;
