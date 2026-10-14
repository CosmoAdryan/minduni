export const STORAGE_KEYS = {
  USERS: 'minduni_users',
  USER: 'minduni_user',
  PROGRESS: 'minduni_progress',
  JOURNAL: 'minduni_journal',
  GRATITUDE: 'minduni_gratitude',
  ONBOARDING: 'minduni_onboarding_done',
  CONSENT: 'minduni_consent_lgpd',
  // Aceite do envio das conversas do Sage ao Gemini, dado no onboarding (antes
  // de existir conta); copiado para profiles.ai_consent_at no cadastro.
  AI_CONSENT: 'minduni_consent_ai',
};

export function challengeKey(date) {
  return `minduni_challenges_${date}`;
}
