// Contrato das badges por categoria: a migration
// 20260713120000_category_practice_badges concede '<categoria>_10' no servidor.
// Estes testes garantem que o cliente (CATEGORY_META, BADGES) fica alinhado com
// esse padrão e que categoryOf extrai a categoria como o regexp do Postgres.

import { CATEGORIES, CATEGORY_META, categoryOf } from '../data/challenges';
import { BADGES } from '../data/badges';

const badgeIds = new Set(BADGES.map((b) => b.id));

describe('categoryOf', () => {
  it('remove o sufixo _<n> do id do desafio', () => {
    expect(categoryOf('breathing_1')).toBe('breathing');
    expect(categoryOf('mindfulness_2')).toBe('mindfulness');
    expect(categoryOf('thought_record_1')).toBe('thought_record');
  });
});

describe('CATEGORY_META', () => {
  it('cobre todas as categorias de desafio', () => {
    for (const { type } of CATEGORIES) {
      expect(CATEGORY_META[type]).toBeDefined();
      expect(CATEGORY_META[type].label).toBeTruthy();
      expect(CATEGORY_META[type].emoji).toBeTruthy();
    }
  });

  it('categoryOf de cada id de desafio bate com uma chave de CATEGORY_META', () => {
    for (const { pool } of CATEGORIES) {
      for (const ch of pool) {
        expect(CATEGORY_META[categoryOf(ch.id)]).toBeDefined();
      }
    }
  });
});

describe('badges por categoria', () => {
  it('toda categoria tem uma badge <categoria>_10 no cliente', () => {
    for (const type of Object.keys(CATEGORY_META)) {
      expect(badgeIds.has(`${type}_10`)).toBe(true);
    }
  });
});
