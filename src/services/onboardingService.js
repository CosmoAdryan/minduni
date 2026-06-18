import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './storage';

// Versão atual da Política de Privacidade aceita no onboarding. Incrementar
// quando o texto mudar de forma relevante (permite pedir novo consentimento).
export const CONSENT_VERSION = '1.0';

export async function hasCompletedOnboarding() {
  const val = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING);
  return val === 'true';
}

export async function markOnboardingDone() {
  await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING, 'true');
}

// Registra o consentimento LGPD com a data/hora do aceite (base de auditoria).
export async function markConsentGiven() {
  await AsyncStorage.setItem(STORAGE_KEYS.CONSENT, new Date().toISOString());
}

export async function hasGivenConsent() {
  const val = await AsyncStorage.getItem(STORAGE_KEYS.CONSENT);
  return !!val;
}

// Data/hora (ISO) do aceite do consentimento, ou null se ainda não houve.
export async function getConsentDate() {
  return AsyncStorage.getItem(STORAGE_KEYS.CONSENT);
}
