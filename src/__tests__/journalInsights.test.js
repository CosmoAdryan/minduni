// Cobre os cálculos puros dos insights do diário: resumo semanal, streak de
// diário (independente do login) e correlação humor × prática.

import {
  weeklySummary,
  journalStreak,
  moodPracticeCorrelation,
  localDayKey,
  utcDayKey,
} from '../lib/journalInsights';
import { JOURNAL_PROMPTS, getDailyPrompt } from '../data/journalPrompts';

// Constrói uma data local a N dias atrás de `now`, ao meio-dia (evita virada de
// fuso na chave de dia).
function daysAgo(n, now = new Date()) {
  const d = new Date(now);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

describe('weeklySummary', () => {
  const now = new Date('2026-07-13T12:00:00'); // segunda

  it('retorna null sem registros na janela de 7 dias', () => {
    expect(weeklySummary([], now)).toBeNull();
    expect(weeklySummary([{ mood: 4, date: daysAgo(30, now) }], now)).toBeNull();
  });

  it('conta registros e calcula humor médio dos últimos 7 dias', () => {
    const entries = [
      { mood: 5, date: daysAgo(0, now) },
      { mood: 3, date: daysAgo(1, now) },
      { mood: 4, date: daysAgo(2, now) },
      { mood: 1, date: daysAgo(20, now) }, // fora da janela — ignorado
    ];
    const s = weeklySummary(entries, now);
    expect(s.count).toBe(3);
    expect(s.avgMood).toBeCloseTo(4, 5);
    expect(s.days).toBe(3);
  });

  it('identifica o melhor dia pela maior média diária', () => {
    const entries = [
      { mood: 2, date: daysAgo(0, now) },
      { mood: 5, date: daysAgo(1, now) }, // domingo, melhor
      { mood: 3, date: daysAgo(2, now) },
    ];
    const s = weeklySummary(entries, now);
    expect(s.bestDayAvg).toBe(5);
    expect(s.bestDayLabel).toBe('domingo');
  });
});

describe('journalStreak', () => {
  const now = new Date('2026-07-13T12:00:00');

  it('é 0 sem registros', () => {
    expect(journalStreak([], now)).toBe(0);
  });

  it('conta dias consecutivos terminando hoje', () => {
    const entries = [
      { mood: 4, date: daysAgo(0, now) },
      { mood: 4, date: daysAgo(1, now) },
      { mood: 4, date: daysAgo(2, now) },
    ];
    expect(journalStreak(entries, now)).toBe(3);
  });

  it('mantém o streak se o último registro foi ontem', () => {
    const entries = [
      { mood: 4, date: daysAgo(1, now) },
      { mood: 4, date: daysAgo(2, now) },
    ];
    expect(journalStreak(entries, now)).toBe(2);
  });

  it('zera se houve um buraco (nem hoje nem ontem)', () => {
    const entries = [
      { mood: 4, date: daysAgo(2, now) },
      { mood: 4, date: daysAgo(3, now) },
    ];
    expect(journalStreak(entries, now)).toBe(0);
  });

  it('não conta o mesmo dia duas vezes', () => {
    const entries = [
      { mood: 4, date: daysAgo(0, now) },
      { mood: 2, date: daysAgo(0, now) },
      { mood: 4, date: daysAgo(1, now) },
    ];
    expect(journalStreak(entries, now)).toBe(2);
  });
});

describe('moodPracticeCorrelation', () => {
  it('retorna null sem amostra mínima em cada grupo', () => {
    const entries = [{ mood: 5, date: new Date('2026-07-10T12:00:00') }];
    expect(moodPracticeCorrelation(entries, new Set(['2026-07-10']))).toBeNull();
  });

  it('compara humor médio dos dias com e sem prática', () => {
    const entries = [
      { mood: 5, date: new Date('2026-07-10T12:00:00') },
      { mood: 4, date: new Date('2026-07-11T12:00:00') },
      { mood: 2, date: new Date('2026-07-12T12:00:00') },
      { mood: 1, date: new Date('2026-07-13T12:00:00') },
    ];
    const practice = new Set([utcDayKey(new Date('2026-07-10T12:00:00')), utcDayKey(new Date('2026-07-11T12:00:00'))]);
    const corr = moodPracticeCorrelation(entries, practice);
    expect(corr.daysWith).toBe(2);
    expect(corr.daysWithout).toBe(2);
    expect(corr.meanWith).toBeCloseTo(4.5, 5);
    expect(corr.meanWithout).toBeCloseTo(1.5, 5);
    expect(corr.diff).toBeCloseTo(3, 5);
  });

  it('aceita array além de Set em practiceDays', () => {
    const entries = [
      { mood: 5, date: new Date('2026-07-10T12:00:00') },
      { mood: 4, date: new Date('2026-07-11T12:00:00') },
      { mood: 2, date: new Date('2026-07-12T12:00:00') },
      { mood: 1, date: new Date('2026-07-13T12:00:00') },
    ];
    const corr = moodPracticeCorrelation(entries, ['2026-07-10', '2026-07-11']);
    expect(corr).not.toBeNull();
    expect(corr.daysWith).toBe(2);
  });
});

describe('day keys', () => {
  it('localDayKey e utcDayKey retornam YYYY-MM-DD', () => {
    expect(localDayKey(new Date('2026-07-13T12:00:00'))).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(utcDayKey(new Date('2026-07-13T12:00:00Z'))).toBe('2026-07-13');
  });
});

describe('getDailyPrompt', () => {
  it('retorna uma pergunta da lista, determinística por dia', () => {
    const p = getDailyPrompt(new Date('2026-07-13T12:00:00'));
    expect(JOURNAL_PROMPTS).toContain(p);
    expect(getDailyPrompt(new Date('2026-07-13T20:00:00'))).toBe(p);
  });

  it('muda entre dias diferentes ao longo do ciclo', () => {
    const prompts = new Set();
    for (let i = 0; i < JOURNAL_PROMPTS.length; i++) {
      prompts.add(getDailyPrompt(new Date(2026, 0, 1 + i, 12)));
    }
    // Ao percorrer um ciclo completo, cobre todas as perguntas.
    expect(prompts.size).toBe(JOURNAL_PROMPTS.length);
  });
});
