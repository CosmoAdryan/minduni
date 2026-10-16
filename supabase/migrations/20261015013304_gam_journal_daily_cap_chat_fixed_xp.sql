-- Ajustes de gamificação (seção 4.7 do TCC):
-- 1. Diário: só a PRIMEIRA entrada do dia (dia de Brasília) vale +20 XP. As
--    demais são salvas normalmente, sem XP — premia a reflexão, não a
--    quantidade de entradas.
-- 2. Sage: XP fixo de +10 por dia de conversa (antes 5 × dias seguidos, até
--    50). Evita recompensar cada vez mais a conversa diária com a IA e que
--    quebrar a sequência "custe" XP. O contador chat_streak continua existindo
--    só para a badge chat_streak_7.

CREATE OR REPLACE FUNCTION public.gam_add_journal_entry(p_mood integer, p_text text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  uid uuid := auth.uid();
  p public.progress;
  entry public.journal_entries;
  xp int := 0;
  today_count int;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF p_mood IS NULL OR p_mood < 1 OR p_mood > 5 THEN RAISE EXCEPTION 'invalid mood'; END IF;
  IF p_text IS NULL OR length(btrim(p_text)) = 0 OR length(p_text) > 5000 THEN
    RAISE EXCEPTION 'invalid text';
  END IF;

  -- O lock da linha de progress serializa chamadas do mesmo usuário, então a
  -- contagem abaixo não sofre corrida (duas entradas simultâneas premiadas).
  p := public.gam_progress_for_update(uid);

  SELECT count(*) INTO today_count
  FROM public.journal_entries
  WHERE user_id = uid
    AND (created_at AT TIME ZONE 'America/Sao_Paulo')::date = public.gam_today();
  IF today_count = 0 THEN xp := 20; END IF;

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
$function$;

CREATE OR REPLACE FUNCTION public.gam_apply_chat_streak()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
    xp := 10;
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
$function$;
