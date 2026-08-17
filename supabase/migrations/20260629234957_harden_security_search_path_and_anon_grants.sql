-- Endurecimento de segurança (aplicado via MCP no projeto remoto em 2026-06-29).
-- Arquivo mantido para versionamento/rastreabilidade.
--
-- Resolve os avisos do database linter:
--   0011 function_search_path_mutable
--   0026 pg_graphql_anon_table_exposed
--   0028 anon_security_definer_function_executable
--   0029 authenticated_security_definer_function_executable

-- 1) handle_new_user: fixa search_path (impede sequestro de resolução de nomes)
--    e remove EXECUTE de papéis públicos. É função de TRIGGER (roda como owner),
--    portanto não precisa ser chamável por anon/authenticated/PUBLIC via RPC.
ALTER FUNCTION public.handle_new_user() SET search_path = '';

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

-- 2) Defense-in-depth: o papel anon (não autenticado) não tem uso legítimo em
--    nenhuma destas tabelas — o app sempre opera como usuário autenticado.
--    A RLS já barra o acesso (auth.uid() = null), mas removemos também o GRANT
--    para que as tabelas deixem de ser expostas/discoveráveis pela anon key.
REVOKE ALL ON public.profiles        FROM anon;
REVOKE ALL ON public.progress        FROM anon;
REVOKE ALL ON public.journal_entries FROM anon;
REVOKE ALL ON public.challenge_logs  FROM anon;
REVOKE ALL ON public.chat_sessions   FROM anon;
REVOKE ALL ON public.chat_messages   FROM anon;
