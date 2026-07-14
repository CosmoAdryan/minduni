import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';

// Bloqueio do diário por biometria com fallback para a senha/PIN do aparelho.
// Nunca guardamos um PIN próprio — delegamos à autenticação segura do
// dispositivo (expo-local-authentication). A preferência fica no AsyncStorage.
const LOCK_KEY = 'minduni_journal_lock';

// O dispositivo tem alguma proteção utilizável (biometria OU senha/PIN)?
export async function canUseDeviceAuth() {
  try {
    const level = await LocalAuthentication.getEnrolledLevelAsync();
    return level !== LocalAuthentication.SecurityLevel.NONE;
  } catch {
    return false;
  }
}

// Autentica com biometria e fallback para a senha/PIN do aparelho.
export async function authenticate(reason = 'Desbloquear diário') {
  try {
    const res = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      cancelLabel: 'Cancelar',
      disableDeviceFallback: false,
    });
    return res.success;
  } catch {
    return false;
  }
}

export async function isJournalLockEnabled() {
  return (await AsyncStorage.getItem(LOCK_KEY)) === 'true';
}

// Liga/desliga o bloqueio. Ao ligar, exige proteção no dispositivo e confirma
// com uma autenticação. Returns { enabled, unavailable, cancelled }.
export async function setJournalLockEnabled(enabled) {
  if (!enabled) {
    await AsyncStorage.setItem(LOCK_KEY, 'false');
    return { enabled: false, unavailable: false, cancelled: false };
  }
  if (!(await canUseDeviceAuth())) {
    return { enabled: false, unavailable: true, cancelled: false };
  }
  const ok = await authenticate('Confirme para ativar o bloqueio do diário');
  if (!ok) return { enabled: false, unavailable: false, cancelled: true };
  await AsyncStorage.setItem(LOCK_KEY, 'true');
  return { enabled: true, unavailable: false, cancelled: false };
}
