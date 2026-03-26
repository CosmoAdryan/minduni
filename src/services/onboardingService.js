import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './storage';

export async function hasCompletedOnboarding() {
  const val = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING);
  return val === 'true';
}

export async function markOnboardingDone() {
  await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING, 'true');
}
