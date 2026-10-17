-- Corrige a concessão de insígnias (defeito encontrado no teste funcional da
-- v1.0-avaliacao, CT-03).
--
-- `b := b || 'first_chat'` com b text[]: o literal sem tipo é lido como array,
-- e o Postgres falha com "malformed array literal". Toda RPC que liberava uma
-- insígnia (Sage, diário, desafios, tarefas, login) abortava com 400 — sem XP
-- e sem insígnia. array_append(b, '...') fixa o tipo do elemento.
--
-- Mesmo defeito em gam_complete_challenge (`|| 'all_challenges'`), que faria o
-- 3º desafio do dia falhar.

CREATE OR REPLACE FUNCTION public.gam_compute_badges(p public.progress)
 RETURNS text[]
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO ''
AS $function$
DECLARE
  b text[] := coalesce(p.unlocked_badges, '{}');
  moods_len int := jsonb_array_length(coalesce(p.moods, '[]'::jsonb));
BEGIN
  IF coalesce(p.chat_sessions, 0) >= 1     AND NOT 'first_chat'    = ANY(b) THEN b := array_append(b, 'first_chat');    END IF;
  IF coalesce(p.streak, 0) >= 3            AND NOT 'streak_3'      = ANY(b) THEN b := array_append(b, 'streak_3');      END IF;
  IF coalesce(p.streak, 0) >= 7            AND NOT 'streak_7'      = ANY(b) THEN b := array_append(b, 'streak_7');      END IF;
  IF coalesce(p.streak, 0) >= 30           AND NOT 'streak_30'     = ANY(b) THEN b := array_append(b, 'streak_30');     END IF;
  IF moods_len >= 7                        AND NOT 'mood_7'        = ANY(b) THEN b := array_append(b, 'mood_7');        END IF;
  IF moods_len >= 30                       AND NOT 'mood_30'       = ANY(b) THEN b := array_append(b, 'mood_30');       END IF;
  IF coalesce(p.level, 1) >= 3             AND NOT 'level_3'       = ANY(b) THEN b := array_append(b, 'level_3');       END IF;
  IF coalesce(p.level, 1) >= 5             AND NOT 'level_5'       = ANY(b) THEN b := array_append(b, 'level_5');       END IF;
  IF coalesce(p.level, 1) >= 10            AND NOT 'level_10'      = ANY(b) THEN b := array_append(b, 'level_10');      END IF;
  IF coalesce(p.journal_entries_count, 0) >= 5  AND NOT 'journal_5'  = ANY(b) THEN b := array_append(b, 'journal_5');   END IF;
  IF coalesce(p.journal_entries_count, 0) >= 15 AND NOT 'journal_15' = ANY(b) THEN b := array_append(b, 'journal_15');  END IF;
  IF coalesce(p.total_xp, 0) >= 1000       AND NOT 'xp_1000'       = ANY(b) THEN b := array_append(b, 'xp_1000');       END IF;
  IF coalesce(p.chat_streak, 0) >= 7       AND NOT 'chat_streak_7' = ANY(b) THEN b := array_append(b, 'chat_streak_7'); END IF;
  IF coalesce(p.days_active, 0) >= 30      AND NOT 'active_30'     = ANY(b) THEN b := array_append(b, 'active_30');     END IF;
  IF coalesce(p.tasks_completed_count, 0) >= 5  AND NOT 'tasks_5'  = ANY(b) THEN b := array_append(b, 'tasks_5');       END IF;
  IF coalesce(p.tasks_completed_count, 0) >= 25 AND NOT 'tasks_25' = ANY(b) THEN b := array_append(b, 'tasks_25');      END IF;
  RETURN b;
END;
$function$;

CREATE OR REPLACE FUNCTION public.gam_complete_challenge(p_challenge_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  uid uuid := auth.uid();
  today date := public.gam_today();
  p public.progress;
  xp int;
  inserted int;
  done_before int;
  done_today int;
  cat text;
  cat_count int;
  cat_badge text;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  xp := CASE p_challenge_id
    WHEN 'mindfulness_1'    THEN 30
    WHEN 'mindfulness_2'    THEN 30
    WHEN 'gratitude_1'      THEN 25
    WHEN 'gratitude_2'      THEN 25
    WHEN 'breathing_1'      THEN 20
    WHEN 'breathing_2'      THEN 20
    WHEN 'thought_record_1' THEN 30
    WHEN 'grounding_1'      THEN 20
    WHEN 'relaxation_1'     THEN 25
    ELSE NULL
  END;
  IF xp IS NULL THEN RAISE EXCEPTION 'invalid challenge id'; END IF;

  -- O lock da linha de progress serializa chamadas do mesmo usuário, então a
  -- contagem do dia não sofre corrida.
  p := public.gam_progress_for_update(uid);

  SELECT count(*) INTO done_before
  FROM public.challenge_logs
  WHERE user_id = uid AND completed_date = today;

  INSERT INTO public.challenge_logs (user_id, challenge_id, completed_date)
  VALUES (uid, p_challenge_id, today)
  ON CONFLICT (user_id, challenge_id, completed_date) DO NOTHING;
  GET DIAGNOSTICS inserted = ROW_COUNT;

  IF inserted = 0 OR done_before >= 3 THEN
    xp := 0; -- já concluído hoje ou teto de 3 desafios premiados atingido
  ELSE
    p.total_xp := coalesce(p.total_xp, 0) + xp;
    p.level := public.gam_calc_level(p.total_xp);
  END IF;

  -- 3 desafios no dia => badge all_challenges (a UI oferece 3 por dia,
  -- rotacionando entre as categorias; contar 3 distintos é equivalente).
  done_today := done_before + inserted;
  IF done_today >= 3 AND NOT 'all_challenges' = ANY(coalesce(p.unlocked_badges, '{}')) THEN
    p.unlocked_badges := array_append(coalesce(p.unlocked_badges, '{}'), 'all_challenges');
  END IF;

  -- Badge por categoria: 10 práticas concluídas de uma mesma categoria.
  cat := regexp_replace(p_challenge_id, '_[0-9]+$', '');
  SELECT count(*) INTO cat_count
  FROM public.challenge_logs
  WHERE user_id = uid
    AND regexp_replace(challenge_id, '_[0-9]+$', '') = cat;
  cat_badge := cat || '_10';
  IF cat_count >= 10 AND NOT cat_badge = ANY(coalesce(p.unlocked_badges, '{}')) THEN
    p.unlocked_badges := array_append(coalesce(p.unlocked_badges, '{}'), cat_badge);
  END IF;

  p.unlocked_badges := public.gam_compute_badges(p);
  UPDATE public.progress SET
    total_xp = p.total_xp, level = p.level,
    unlocked_badges = p.unlocked_badges, updated_at = now()
  WHERE user_id = uid;

  RETURN jsonb_build_object('progress', to_jsonb(p), 'awarded_xp', xp);
END;
$function$;

-- Autoverificação: a migration falha se a concessão continuar quebrada.
DO $$
DECLARE
  p public.progress;
  b text[];
BEGIN
  p.unlocked_badges := '{}';
  p.chat_sessions := 1;
  p.streak := 3;
  p.journal_entries_count := 5;
  p.tasks_completed_count := 5;
  b := public.gam_compute_badges(p);
  IF NOT b @> ARRAY['first_chat', 'streak_3', 'journal_5', 'tasks_5'] THEN
    RAISE EXCEPTION 'gam_compute_badges não concedeu as insígnias esperadas: %', b;
  END IF;
END;
$$;
