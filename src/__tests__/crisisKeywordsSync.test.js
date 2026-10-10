import fs from 'fs';
import path from 'path';
import { CRISIS_KEYWORDS } from '../data/chatResponses';

// Contrato cliente↔servidor: a detecção de crise roda nos dois lados. Se as
// listas divergirem, um termo pode abrir o alerta no aparelho mas seguir para
// o modelo no servidor (ou o contrário). Este teste lê a Edge Function como
// texto, já que ela roda em Deno e não pode ser importada pelo Jest.

function serverKeywords() {
  const file = path.join(__dirname, '../../supabase/functions/sage-chat/index.ts');
  const src = fs.readFileSync(file, 'utf8');
  const match = src.match(/const CRISIS_KEYWORDS = \[([\s\S]*?)\];/);
  if (!match) throw new Error('CRISIS_KEYWORDS não encontrada na Edge Function');
  return [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

describe('CRISIS_KEYWORDS cliente × servidor', () => {
  it('as duas listas têm exatamente os mesmos termos', () => {
    expect([...serverKeywords()].sort()).toEqual([...CRISIS_KEYWORDS].sort());
  });
});
