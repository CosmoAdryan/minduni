import { detectCrisis } from '../data/chatResponses';

// A detecção de crise é a barreira de segurança mais importante do app:
// quando dispara, a resposta com o CVV (188) é fixa e nunca passa pelo modelo.

describe('detectCrisis', () => {
  it.each([
    'quero morrer',
    'penso em suicídio',
    'penso em suicidio',
    'vou me matar',
    'não quero mais viver',
    'nao quero mais viver',
    'quero me machucar',
    'quero acabar com tudo',
    'estou sem saída',
    'quero tirar minha vida',
    'penso em me cortar',
  ])('detecta "%s"', (msg) => {
    expect(detectCrisis(msg)).toBe(true);
  });

  it('detecta independente de maiúsculas/minúsculas', () => {
    expect(detectCrisis('QUERO MORRER')).toBe(true);
    expect(detectCrisis('Não Aguento Mais')).toBe(true);
  });

  it('detecta a frase dentro de uma mensagem maior', () => {
    expect(detectCrisis('ultimamente eu tenho pensado que quero morrer, sabe')).toBe(true);
  });

  it.each([
    'hoje foi um dia bom',
    'estou ansioso com a prova de amanhã',
    'me sinto triste e cansado',
    'quero melhorar minha rotina de sono',
  ])('não dispara para "%s"', (msg) => {
    expect(detectCrisis(msg)).toBe(false);
  });

  // Comportamento atual CONHECIDO: "não aguento mais" dispara mesmo em
  // contextos cotidianos ("não aguento mais essa matéria"). É um falso
  // positivo aceito por prudência (melhor acolher demais do que de menos).
  // Se a heurística mudar, este teste deve ser revisto conscientemente.
  it('dispara para "não aguento mais" mesmo em contexto cotidiano (falso positivo aceito)', () => {
    expect(detectCrisis('não aguento mais essa matéria de cálculo')).toBe(true);
  });
});
