// O cálculo autoritativo de XP/streak/badges vive no Postgres (funções gam_*,
// migration server_side_gamification). Aqui testamos o contrato do cliente:
// níveis exibidos na UI, mapeamento banco → app e os wrappers de RPC
// (nomes, parâmetros e tratamento de erro).

jest.mock('../lib/supabase', () => ({
  supabase: { rpc: jest.fn(), auth: { getUser: jest.fn() }, from: jest.fn() },
}));

import { supabase } from '../lib/supabase';
import {
  LEVELS,
  INITIAL_PROGRESS,
  calculateLevel,
  dbToProgress,
  applyLogin,
  applyChatStreak,
  completeChallenge,
  addMoodEntry,
  resetProgress,
} from '../services/progressService';

describe('calculateLevel', () => {
  it.each([
    [0, 1],
    [99, 1],
    [100, 2],
    [249, 2],
    [250, 3],
    [449, 3],
    [450, 4],
    [700, 5],
    [1000, 6],
    [1350, 7],
    [1750, 8],
    [2200, 9],
    [2699, 9],
    [2700, 10],
    [99999, 10],
  ])('%i XP → nível %i', (xp, expected) => {
    expect(calculateLevel(xp).level).toBe(expected);
  });

  it('os níveis são contíguos (maxXP de um = minXP do próximo)', () => {
    for (let i = 0; i < LEVELS.length - 1; i++) {
      expect(LEVELS[i].maxXP).toBe(LEVELS[i + 1].minXP);
    }
  });
});

describe('dbToProgress', () => {
  it('mapeia a linha do banco para o formato da UI', () => {
    const row = {
      total_xp: 330,
      level: 3,
      streak: 4,
      last_login: '2026-07-03',
      unlocked_badges: ['first_chat', 'streak_3'],
      moods: [{ mood: 4, phase: 'daily', date: '2026-07-03T12:00:00Z' }],
      chat_sessions: 1,
      journal_entries_count: 8,
      days_active: 5,
      chat_streak: 2,
      chat_streak_date: '2026-07-03',
    };
    expect(dbToProgress(row)).toEqual({
      totalXP: 330,
      level: 3,
      streak: 4,
      lastLogin: '2026-07-03',
      unlockedBadges: ['first_chat', 'streak_3'],
      moods: [{ mood: 4, phase: 'daily', date: '2026-07-03T12:00:00Z' }],
      chatSessions: 1,
      journalEntries: 8,
      daysActive: 5,
      chatStreak: 2,
      chatStreakDate: '2026-07-03',
    });
  });

  it('aplica os padrões do estado inicial para linha vazia', () => {
    expect(dbToProgress({})).toEqual(INITIAL_PROGRESS);
  });
});

describe('wrappers de RPC (gamificação server-side)', () => {
  const progressRow = { total_xp: 45, level: 1, unlocked_badges: [] };

  beforeEach(() => {
    supabase.rpc.mockReset();
  });

  it('applyLogin chama gam_apply_login e devolve loginXP', async () => {
    supabase.rpc.mockResolvedValue({ data: { progress: progressRow, awarded_xp: 10 }, error: null });
    const { progress, loginXP } = await applyLogin();
    expect(supabase.rpc).toHaveBeenCalledWith('gam_apply_login', undefined);
    expect(loginXP).toBe(10);
    expect(progress.totalXP).toBe(45);
  });

  it('applyChatStreak devolve chatXP zerado quando o dia já foi premiado', async () => {
    supabase.rpc.mockResolvedValue({ data: { progress: progressRow, awarded_xp: 0 }, error: null });
    const { chatXP } = await applyChatStreak();
    expect(supabase.rpc).toHaveBeenCalledWith('gam_apply_chat_streak', undefined);
    expect(chatXP).toBe(0);
  });

  it('completeChallenge envia o ID (sem valor de XP — o servidor decide)', async () => {
    supabase.rpc.mockResolvedValue({ data: { progress: progressRow, awarded_xp: 25 }, error: null });
    const { challengeXP } = await completeChallenge('gratitude_1');
    expect(supabase.rpc).toHaveBeenCalledWith('gam_complete_challenge', {
      p_challenge_id: 'gratitude_1',
    });
    expect(challengeXP).toBe(25);
  });

  it('addMoodEntry envia humor e fase', async () => {
    supabase.rpc.mockResolvedValue({ data: { progress: progressRow }, error: null });
    await addMoodEntry(4, 'daily');
    expect(supabase.rpc).toHaveBeenCalledWith('gam_add_mood', { p_mood: 4, p_phase: 'daily' });
  });

  it('resetProgress devolve o progresso zerado', async () => {
    supabase.rpc.mockResolvedValue({
      data: { progress: { total_xp: 0, level: 1 } },
      error: null,
    });
    const progress = await resetProgress();
    expect(supabase.rpc).toHaveBeenCalledWith('gam_reset_progress', undefined);
    expect(progress.totalXP).toBe(0);
  });

  it('propaga erro da RPC como exceção', async () => {
    supabase.rpc.mockResolvedValue({ data: null, error: { message: 'invalid challenge id' } });
    await expect(completeChallenge('desafio_forjado')).rejects.toThrow('invalid challenge id');
  });
});
