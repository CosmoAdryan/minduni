// Regressões dos defeitos achados no teste funcional da v1.0-avaliacao.
// O defeito das insígnias (CT-03) é do banco e tem autoverificação na própria
// migration 20261017175053_gam_badges_array_append.

jest.mock('../lib/supabase', () => ({
  supabase: { auth: { getUser: jest.fn() }, from: jest.fn() },
}));
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { getCompletedToday, getWeeklyCompletion } from '../services/challengeService';
import { moodPracticeCorrelation } from '../lib/journalInsights';
import {
  pickAvatarImage, galleryErrorMessage, GALLERY_UNAVAILABLE_MESSAGE,
} from '../services/accountService';

// 16/10/2026 às 22:30 em Brasília = 17/10 01:30 em UTC.
const NIGHT_BRT = new Date('2026-10-17T01:30:00Z');

// Encadeia from().select().eq().eq()/gte() guardando os filtros usados.
function mockQuery(rows) {
  const filters = [];
  const q = {
    select: () => q,
    eq: (col, val) => { filters.push([col, val]); return q; },
    gte: (col, val) => { filters.push([col, val]); return q; },
    then: (resolve) => resolve({ data: rows, error: null }),
  };
  supabase.from.mockReturnValue(q);
  return filters;
}

describe('CT-07: datas dos desafios no fuso de Brasília', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(NIGHT_BRT);
    supabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
  });
  afterEach(() => jest.useRealTimers());

  it('às 22:30 consulta os desafios de hoje com a data de Brasília (não a de UTC)', async () => {
    const filters = mockQuery([{ challenge_id: 'gratitude_1' }]);
    const done = await getCompletedToday();
    expect(filters).toContainEqual(['completed_date', '2026-10-16']);
    expect(done).toEqual(['gratitude_1']);
  });

  it('marca o desafio de hoje no último dia da semana, e não no dia anterior', async () => {
    mockQuery([{ completed_date: '2026-10-16' }]);
    const week = await getWeeklyCompletion();
    expect(week).toHaveLength(7);
    expect(week[6]).toBe(true);
    expect(week[5]).toBe(false);
  });

  it('a correlação humor × prática casa entradas feitas à noite com a prática do mesmo dia', () => {
    const entries = [
      { mood: 5, date: NIGHT_BRT },
      { mood: 5, date: new Date('2026-10-15T15:00:00Z') },
      { mood: 1, date: new Date('2026-10-14T15:00:00Z') },
      { mood: 1, date: new Date('2026-10-13T15:00:00Z') },
    ];
    const corr = moodPracticeCorrelation(entries, new Set(['2026-10-16', '2026-10-15']));
    expect(corr.daysWith).toBe(2);
    expect(corr.meanWith).toBeCloseTo(5, 5);
  });
});

describe('CT-11: erro da galeria vira orientação ao usuário', () => {
  it('traduz o erro de launcher não registrado', () => {
    const err = new Error("Call to function 'ExponentImagePicker.launchImageLibraryAsync' has been rejected. → Caused by: java.lang.IllegalStateException: Attempting to launch an unregistered ActivityResultLauncher with contract ...");
    expect(galleryErrorMessage(err)).toBe(GALLERY_UNAVAILABLE_MESSAGE);
  });

  it('mantém outras mensagens de erro', () => {
    expect(galleryErrorMessage(new Error('outra falha'))).toBe('outra falha');
  });

  it('pickAvatarImage lança a mensagem amigável quando a galeria falha', async () => {
    ImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({ granted: true });
    ImagePicker.launchImageLibraryAsync.mockRejectedValue(
      new Error('Attempting to launch an unregistered ActivityResultLauncher'));
    await expect(pickAvatarImage()).rejects.toThrow(GALLERY_UNAVAILABLE_MESSAGE);
  });
});
