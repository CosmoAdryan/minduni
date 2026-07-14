-- Badges por categoria de prática: acumular 10 práticas concluídas de uma mesma
-- categoria desbloqueia a badge '<categoria>_10' (ex.: 'breathing_10').
--
-- A contagem por categoria vive em challenge_logs (não na tabela progress), então
-- a regra entra em gam_complete_challenge — que já carrega challenge_logs para o
-- badge all_challenges. Como só a categoria recém-concluída pode cruzar o limite
-- nesta chamada, basta contar essa categoria (não há loop pelas 6).
--
-- A categoria é o id do desafio sem o sufixo "_<n>" (regexp_replace). O CASE de XP
-- e a lógica de all_challenges continuam idênticos à migration anterior.
-- CREATE OR REPLACE preserva os grants (só authenticated executa).
--
-- Retroativo: para quem já tinha >10 práticas antes desta migration, a badge é
-- concedida na próxima conclusão da categoria (a contagem inclui todo o histórico).

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
$$;
