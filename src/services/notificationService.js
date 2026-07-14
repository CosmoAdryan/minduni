import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

// Lembrete diário local de check-in (engajamento). Tudo agendado no aparelho —
// não depende de servidor de push. Preferências ficam no AsyncStorage.
const ENABLED_KEY = 'minduni_reminder_enabled';
const TIME_KEY = 'minduni_reminder_time'; // "HH:MM"
const CHANNEL_ID = 'daily-reminder';
export const DEFAULT_TIME = '20:00';

// Presets de horário oferecidos na UI (evita depender de um date picker nativo).
export const REMINDER_PRESETS = [
  { label: 'Manhã', time: '09:00' },
  { label: 'Tarde', time: '15:00' },
  { label: 'Noite', time: '20:00' },
];

// Mensagens rotativas — variar o texto reduz a "cegueira de notificação".
const MESSAGES = [
  { title: 'Como você está hoje? 🌱', body: 'Um minutinho pra registrar seu humor no MindUni.' },
  { title: 'Seu momento de pausa 💚', body: 'Que tal um check-in rápido com o Sage?' },
  { title: 'Cuidar de si conta 🔥', body: 'Mantenha sua sequência: faça seu check-in de hoje.' },
];

// Converte "HH:MM" em { hour, minute }, com validação (fallback 20:00). Pura,
// para ser testável.
export function parseTime(str) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(str || '');
  if (!m) return { hour: 20, minute: 0 };
  return {
    hour: Math.min(23, Math.max(0, parseInt(m[1], 10))),
    minute: Math.min(59, Math.max(0, parseInt(m[2], 10))),
  };
}

// Mostra a notificação mesmo com o app em primeiro plano.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function ensureChannel() {
  if (Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Lembretes diários',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  } catch { /* Expo Go pode limitar; segue sem canal customizado */ }
}

async function requestPermission() {
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return true;
  const { status: asked } = await Notifications.requestPermissionsAsync();
  return asked === 'granted';
}

export async function getReminderPrefs() {
  const [enabled, time] = await Promise.all([
    AsyncStorage.getItem(ENABLED_KEY),
    AsyncStorage.getItem(TIME_KEY),
  ]);
  return { enabled: enabled === 'true', time: time || DEFAULT_TIME };
}

// Reagenda o lembrete diário (cancela o anterior). O app só agenda este, então
// cancelar todos é seguro. A mensagem é sorteada a cada agendamento.
export async function scheduleDailyReminder(time) {
  await ensureChannel();
  await Notifications.cancelAllScheduledNotificationsAsync();
  const { hour, minute } = parseTime(time);
  const msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
  await Notifications.scheduleNotificationAsync({
    content: { title: msg.title, body: msg.body },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: CHANNEL_ID,
    },
  });
}

export async function cancelDailyReminder() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Liga/desliga o lembrete. Ao ligar, pede permissão e agenda.
// Retorna { enabled, denied } — denied=true se o usuário negou a permissão.
export async function setReminderEnabled(enabled, time) {
  if (enabled) {
    const granted = await requestPermission();
    if (!granted) return { enabled: false, denied: true };
    await scheduleDailyReminder(time);
    await AsyncStorage.setItem(ENABLED_KEY, 'true');
    return { enabled: true, denied: false };
  }
  await cancelDailyReminder();
  await AsyncStorage.setItem(ENABLED_KEY, 'false');
  return { enabled: false, denied: false };
}

export async function setReminderTime(time) {
  await AsyncStorage.setItem(TIME_KEY, time);
  const { enabled } = await getReminderPrefs();
  if (enabled) await scheduleDailyReminder(time);
}

// Chamado no início do app: reagenda se estiver habilitado (garante que o
// lembrete persiste entre reinícios e roda uma mensagem nova). Best-effort:
// nunca deve quebrar a inicialização.
export async function syncReminderOnLaunch() {
  try {
    const { enabled, time } = await getReminderPrefs();
    await ensureChannel();
    if (!enabled) return;
    // Respeita revogação de permissão feita fora do app.
    const { status } = await Notifications.getPermissionsAsync();
    if (status === 'granted') await scheduleDailyReminder(time);
  } catch (e) {
    console.warn('syncReminderOnLaunch falhou:', e?.message);
  }
}
