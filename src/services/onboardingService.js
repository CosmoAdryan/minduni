import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './storage';

// Versão atual da Política de Privacidade aceita no onboarding. Incrementar
// quando o texto mudar de forma relevante (permite pedir novo consentimento).
// 1.2: o envio das conversas ao Gemini passou a ter aceite próprio e opcional.
// 1.3: Gemini na modalidade paga (sem uso para melhorar produtos); agenda e
//      foto de perfil listadas nos dados coletados; "limpar dados" nos direitos.
export const CONSENT_VERSION = '1.3';

// true quando o usuário logado aceitou uma versão anterior do consentimento (ou
// nenhuma). Sem `consentVersion` carregado (perfil ainda não buscado ou falha
// de rede) retorna false: não bloqueia o app por falta de dado.
export function needsReconsent(user) {
  if (!user || !('consentVersion' in user)) return false;
  return user.consentVersion !== CONSENT_VERSION;
}

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

// Aceite (opcional) do envio das conversas do Sage ao Gemini, no onboarding.
// Sem aceite, apaga o registro local: o cadastro grava ai_consent_at = NULL.
export async function markAiConsent(given) {
  if (given) await AsyncStorage.setItem(STORAGE_KEYS.AI_CONSENT, new Date().toISOString());
  else await AsyncStorage.removeItem(STORAGE_KEYS.AI_CONSENT);
}

export async function getAiConsentDate() {
  return AsyncStorage.getItem(STORAGE_KEYS.AI_CONSENT);
}
