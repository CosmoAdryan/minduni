// Testa a lógica pura de parsing de horário do lembrete. Os módulos nativos
// (expo-notifications, AsyncStorage) são mockados porque o serviço os importa
// no topo — mas parseTime não depende deles.
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  SchedulableTriggerInputTypes: { DAILY: 'daily' },
  AndroidImportance: { DEFAULT: 3 },
}));
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

import { parseTime, DEFAULT_TIME, REMINDER_PRESETS } from '../services/notificationService';

describe('parseTime', () => {
  it('converte "HH:MM" válido', () => {
    expect(parseTime('09:00')).toEqual({ hour: 9, minute: 0 });
    expect(parseTime('20:30')).toEqual({ hour: 20, minute: 30 });
  });

  it('usa fallback 20:00 para entradas inválidas', () => {
    expect(parseTime('')).toEqual({ hour: 20, minute: 0 });
    expect(parseTime('abc')).toEqual({ hour: 20, minute: 0 });
    expect(parseTime(null)).toEqual({ hour: 20, minute: 0 });
  });

  it('faz clamp de valores fora do intervalo', () => {
    expect(parseTime('25:99')).toEqual({ hour: 23, minute: 59 });
  });
});

describe('REMINDER_PRESETS', () => {
  it('todos os presets têm horário parseável', () => {
    for (const { time } of REMINDER_PRESETS) {
      const { hour, minute } = parseTime(time);
      expect(hour).toBeGreaterThanOrEqual(0);
      expect(hour).toBeLessThanOrEqual(23);
      expect(minute).toBeGreaterThanOrEqual(0);
      expect(minute).toBeLessThanOrEqual(59);
    }
  });

  it('o horário padrão está entre os presets', () => {
    expect(REMINDER_PRESETS.some((p) => p.time === DEFAULT_TIME)).toBe(true);
  });
});
