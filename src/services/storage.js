export const STORAGE_KEYS = {
  USERS: 'minduni_users',
  USER: 'minduni_user',
  PROGRESS: 'minduni_progress',
  JOURNAL: 'minduni_journal',
  GRATITUDE: 'minduni_gratitude',
  ONBOARDING: 'minduni_onboarding_done',
};

export function challengeKey(date) {
  return `minduni_challenges_${date}`;
}
