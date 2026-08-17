-- A UI voltou a oferecer 3 desafios por dia, agora rotacionando entre as 6
-- categorias (janela deslizante em src/data/challenges.js). O badge
-- all_challenges ("complete todos os desafios do dia") volta a exigir 3
-- desafios distintos no dia. O CASE de XP não muda: os 9 IDs continuam
-- válidos — qual subconjunto aparece em cada dia é decisão do cliente.

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

  -- 3 desafios no dia => badge all_challenges (a UI oferece 3 por dia,
  -- rotacionando entre as categorias; contar 3 distintos é equivalente).
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
