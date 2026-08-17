import {
  occursOn,
  expandOccurrences,
  occurrencesForDay,
  occurrenceDatesInRange,
  weekdayOf,
} from '../lib/recurrence';

// 2026-08-03 é uma segunda-feira (weekday 1).
const mkTask = (over = {}) => ({
  id: 't1',
  title: 'Respiração 4-4-4',
  scheduled_date: '2026-08-03',
  scheduled_time: null,
  recurrence: 'none',
  recurrence_until: null,
  source: 'user',
  archived_at: null,
  ...over,
});

describe('occursOn', () => {
  it('avulsa (none): só no dia agendado', () => {
    const t = mkTask();
    expect(occursOn(t, '2026-08-03')).toBe(true);
    expect(occursOn(t, '2026-08-04')).toBe(false);
    expect(occursOn(t, '2026-08-02')).toBe(false);
  });

  it('diária: todo dia a partir do início', () => {
    const t = mkTask({ recurrence: 'daily' });
    expect(occursOn(t, '2026-08-03')).toBe(true);
    expect(occursOn(t, '2026-08-10')).toBe(true);
    expect(occursOn(t, '2026-08-02')).toBe(false); // antes do início
  });

  it('diária respeita recurrence_until', () => {
    const t = mkTask({ recurrence: 'daily', recurrence_until: '2026-08-05' });
    expect(occursOn(t, '2026-08-05')).toBe(true);
    expect(occursOn(t, '2026-08-06')).toBe(false);
  });

  it('semanal: mesmo dia da semana do início', () => {
    const t = mkTask({ recurrence: 'weekly' }); // segunda
    expect(weekdayOf('2026-08-03')).toBe(1);
    expect(occursOn(t, '2026-08-10')).toBe(true); // segunda seguinte
    expect(occursOn(t, '2026-08-17')).toBe(true); // outra segunda
    expect(occursOn(t, '2026-08-04')).toBe(false); // terça
  });

  it('tarefa arquivada nunca ocorre', () => {
    const t = mkTask({ recurrence: 'daily', archived_at: '2026-08-04T10:00:00Z' });
    expect(occursOn(t, '2026-08-03')).toBe(false);
  });
});

describe('expandOccurrences', () => {
  it('marca done a partir das conclusões (por ocorrência)', () => {
    const t = mkTask({ recurrence: 'daily' });
    const completions = [
      { id: 'c1', task_id: 't1', occurrence_date: '2026-08-04', done: true },
      { id: 'c2', task_id: 't1', occurrence_date: '2026-08-05', done: false },
    ];
    const occ = expandOccurrences([t], completions, '2026-08-03', '2026-08-05');
    expect(occ).toHaveLength(3);
    expect(occ.find((o) => o.date === '2026-08-03').done).toBe(false); // sem conclusão
    expect(occ.find((o) => o.date === '2026-08-04').done).toBe(true);
    expect(occ.find((o) => o.date === '2026-08-05').done).toBe(false); // desmarcada
    expect(occ.find((o) => o.date === '2026-08-04').completionId).toBe('c1');
  });

  it('ordena por data e depois por hora (sem hora vai por último no dia)', () => {
    const manha = mkTask({ id: 'a', title: 'Manhã', scheduled_time: '08:00' });
    const tarde = mkTask({ id: 'b', title: 'Tarde', scheduled_time: '15:00' });
    const semHora = mkTask({ id: 'c', title: 'Qualquer hora', scheduled_time: null });
    const occ = expandOccurrences([tarde, semHora, manha], [], '2026-08-03', '2026-08-03');
    expect(occ.map((o) => o.task.id)).toEqual(['a', 'b', 'c']);
  });
});

describe('occurrencesForDay', () => {
  it('devolve só as ocorrências do dia pedido', () => {
    const diaria = mkTask({ id: 'd', recurrence: 'daily' });
    const avulsa = mkTask({ id: 'u', scheduled_date: '2026-08-10' });
    const occ = occurrencesForDay([diaria, avulsa], [], '2026-08-03');
    expect(occ.map((o) => o.task.id)).toEqual(['d']);
  });
});

describe('occurrenceDatesInRange', () => {
  it('reúne as datas com ocorrência (para pintar o calendário)', () => {
    const semanal = mkTask({ recurrence: 'weekly' }); // segundas
    const dates = occurrenceDatesInRange([semanal], '2026-08-03', '2026-08-17');
    expect([...dates].sort()).toEqual(['2026-08-03', '2026-08-10', '2026-08-17']);
  });
});
