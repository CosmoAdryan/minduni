import { isStreakAtRisk, todayKeySaoPaulo } from '../lib/streak';

describe('todayKeySaoPaulo', () => {
  it('retorna YYYY-MM-DD', () => {
    expect(todayKeySaoPaulo(new Date('2026-07-13T15:00:00Z'))).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('usa o fuso de São Paulo (UTC-3)', () => {
    // 02:00Z = 23:00 do dia anterior em São Paulo → vira 2026-07-12.
    expect(todayKeySaoPaulo(new Date('2026-07-13T02:00:00Z'))).toBe('2026-07-12');
  });
});

describe('isStreakAtRisk', () => {
  const now = new Date('2026-07-13T15:00:00Z'); // São Paulo: 2026-07-13 12:00

  it('é false quando não há sequência', () => {
    expect(isStreakAtRisk({ streak: 0, lastLogin: '2026-07-10' }, now)).toBe(false);
  });

  it('é false quando a sequência já foi garantida hoje', () => {
    expect(isStreakAtRisk({ streak: 5, lastLogin: '2026-07-13' }, now)).toBe(false);
  });

  it('é true quando last_login é anterior a hoje', () => {
    expect(isStreakAtRisk({ streak: 5, lastLogin: '2026-07-12' }, now)).toBe(true);
  });

  it('é true quando não há last_login', () => {
    expect(isStreakAtRisk({ streak: 3, lastLogin: null }, now)).toBe(true);
  });

  it('trata formato legado (toDateString) como não garantido', () => {
    expect(isStreakAtRisk({ streak: 3, lastLogin: 'Mon Jul 13 2026' }, now)).toBe(true);
  });
});
