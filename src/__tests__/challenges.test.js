// Contrato entre os desafios do cliente e o servidor: o XP é definido no
// Postgres por ID (gam_complete_challenge, migration add_cbt_challenges).
// SERVER_XP espelha o CASE da função — se um desafio novo entrar no app sem
// entrar na migration (ou com XP diferente), estes testes quebram.

import {
  MINDFULNESS_CHALLENGES,
  GRATITUDE_CHALLENGES,
  BREATHING_CHALLENGES,
  THOUGHT_RECORD_CHALLENGES,
  GROUNDING_CHALLENGES,
  RELAXATION_CHALLENGES,
  getDailyChallenges,
} from '../data/challenges';

const SERVER_XP = {
  mindfulness_1: 30,
  mindfulness_2: 30,
  gratitude_1: 25,
  gratitude_2: 25,
  breathing_1: 20,
  breathing_2: 20,
  thought_record_1: 30,
  grounding_1: 20,
  relaxation_1: 25,
};

const ALL = [
  ...MINDFULNESS_CHALLENGES,
  ...GRATITUDE_CHALLENGES,
  ...BREATHING_CHALLENGES,
  ...THOUGHT_RECORD_CHALLENGES,
  ...GROUNDING_CHALLENGES,
  ...RELAXATION_CHALLENGES,
];

describe('contrato cliente ↔ servidor dos desafios', () => {
  it('todo desafio do app existe na tabela de XP do servidor, com o mesmo valor', () => {
    for (const ch of ALL) {
      expect(SERVER_XP[ch.id]).toBe(ch.xp);
    }
  });

  it('todo ID da tabela do servidor existe no app (nada órfão)', () => {
    const ids = ALL.map((ch) => ch.id);
    expect(ids.sort()).toEqual(Object.keys(SERVER_XP).sort());
  });

  it('IDs são únicos', () => {
    const ids = ALL.map((ch) => ch.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('getDailyChallenges (rotação 3 de 6)', () => {
  const dayN = (n) => new Date(2026, 0, 1 + n); // n dias após 01/01/2026

  it('retorna 3 desafios de categorias distintas e conhecidas', () => {
    const daily = getDailyChallenges();
    expect(daily).toHaveLength(3);
    const types = daily.map((ch) => ch.type);
    expect(new Set(types).size).toBe(3);
    for (const ch of daily) {
      expect(SERVER_XP[ch.id]).toBe(ch.xp);
      expect(typeof ch.type).toBe('string');
    }
  });

  it('a combinação de categorias muda de um dia para o outro', () => {
    for (let n = 0; n < 6; n++) {
      const today = getDailyChallenges(dayN(n)).map((ch) => ch.type).sort();
      const tomorrow = getDailyChallenges(dayN(n + 1)).map((ch) => ch.type).sort();
      expect(today).not.toEqual(tomorrow);
    }
  });

  it('toda categoria aparece ao menos uma vez em qualquer janela de 6 dias', () => {
    const seen = new Set();
    for (let n = 0; n < 6; n++) {
      getDailyChallenges(dayN(n)).forEach((ch) => seen.add(ch.type));
    }
    expect(seen.size).toBe(6);
  });
});

describe('estrutura das mecânicas', () => {
  it('desafios de escrita têm prompts não vazios', () => {
    for (const ch of [...GRATITUDE_CHALLENGES, ...THOUGHT_RECORD_CHALLENGES]) {
      expect(ch.prompts.length).toBeGreaterThan(0);
      ch.prompts.forEach((p) => expect(p.trim().length).toBeGreaterThan(0));
    }
  });

  it('grounding segue a contagem regressiva 5-4-3-2-1 dos sentidos', () => {
    for (const ch of GROUNDING_CHALLENGES) {
      expect(ch.senses.map((s) => s.count)).toEqual([5, 4, 3, 2, 1]);
    }
  });

  it('relaxamento muscular tem grupos e durações de fase válidas', () => {
    for (const ch of RELAXATION_CHALLENGES) {
      expect(ch.groups.length).toBeGreaterThan(0);
      expect(ch.tenseSeconds).toBeGreaterThan(0);
      expect(ch.releaseSeconds).toBeGreaterThan(0);
      ch.groups.forEach((g) => {
        expect(g.name.trim().length).toBeGreaterThan(0);
        expect(g.instruction.trim().length).toBeGreaterThan(0);
      });
    }
  });
});
