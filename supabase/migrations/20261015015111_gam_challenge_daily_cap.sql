-- Teto diário de desafios premiados (seção 4.7 do TCC): no máximo 3 desafios
-- valem XP por dia (dia de Brasília). A UI já oferece 3 por dia em rodízio,
-- mas o servidor aceitava os 9 IDs; agora o limite é garantido aqui, sem
-- copiar o rodízio. Conclusões além da 3ª ainda são registradas (a prática
-- aconteceu), só não somam XP.

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
    p.unlocked_badges := coalesce(p.unlocked_badges, '{}') || 'all_challenges';
  END IF;

  -- Badge por categoria: 10 práticas concluídas de uma mesma categoria.
  cat := regexp_replace(p_challenge_id, '_[0-9]+$', '');
  SELECT count(*) INTO cat_count
  FROM public.challenge_logs
  WHERE user_id = uid
    AND regexp_replace(challenge_id, '_[0-9]+$', '') = cat;
  cat_badge := cat || '_10';
  IF cat_count >= 10 AND NOT cat_badge = ANY(coalesce(p.unlocked_badges, '{}')) THEN
    p.unlocked_badges := coalesce(p.unlocked_badges, '{}') || cat_badge;
  END IF;

  p.unlocked_badges := public.gam_compute_badges(p);
  UPDATE public.progress SET
    total_xp = p.total_xp, level = p.level,
    unlocked_badges = p.unlocked_badges, updated_at = now()
  WHERE user_id = uid;

  RETURN jsonb_build_object('progress', to_jsonb(p), 'awarded_xp', xp);
END;
$function$;
