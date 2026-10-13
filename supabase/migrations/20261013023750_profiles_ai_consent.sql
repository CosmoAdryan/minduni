-- Consentimento específico e destacado para o envio das conversas do Sage ao
-- Google (Gemini) — LGPD art. 11, I. Separado do aceite geral (consent_*):
-- NULL = sem aceite; o chat fica bloqueado na Edge Function sage-chat.
-- Revogar = voltar a NULL e apagar chat_messages/chat_sessions (feito pelo app).
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ai_consent_at timestamptz;

COMMENT ON COLUMN public.profiles.ai_consent_at IS
  'Data do aceite do envio das conversas do Sage ao Google (Gemini). NULL = sem aceite / revogado.';
