// Testa o builder puro de HTML do export do diário. expo-print/expo-sharing
// são mockados porque o serviço os importa no topo (buildJournalHtml não usa).
jest.mock('expo-print', () => ({ printToFileAsync: jest.fn() }));
jest.mock('expo-sharing', () => ({ isAvailableAsync: jest.fn(), shareAsync: jest.fn() }));

import { buildJournalHtml } from '../services/journalExportService';

const NOW = new Date('2026-07-13T12:00:00');

describe('buildJournalHtml', () => {
  it('inclui o nome e a data de exportação', () => {
    const html = buildJournalHtml([], 'Ana', NOW);
    expect(html).toContain('Ana');
    expect(html).toContain('Exportado em');
    expect(html).toContain('Nenhuma entrada registrada');
  });

  it('renderiza entradas com rótulo de humor', () => {
    const entries = [{ mood: 4, text: 'Dia tranquilo', date: '2026-07-12T10:00:00' }];
    const html = buildJournalHtml(entries, 'Ana', NOW);
    expect(html).toContain('Dia tranquilo');
    expect(html).toContain('Bem'); // rótulo do humor 4
  });

  it('escapa HTML do texto do usuário (evita injeção no PDF)', () => {
    const entries = [{ mood: 3, text: '<script>alert(1)</script>', date: '2026-07-12T10:00:00' }];
    const html = buildJournalHtml(entries, '', NOW);
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>alert(1)</script>');
  });

  it('ignora entradas com humor inválido', () => {
    const entries = [
      { mood: 5, text: 'válida', date: '2026-07-12T10:00:00' },
      { mood: null, text: 'inválida', date: '2026-07-11T10:00:00' },
    ];
    const html = buildJournalHtml(entries, '', NOW);
    expect(html).toContain('válida');
    expect(html).not.toContain('inválida');
  });
});
