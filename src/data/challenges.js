export const MINDFULNESS_CHALLENGES = [
  {
    id: 'mindfulness_1',
    title: 'Respiração Consciente',
    description: 'Foque sua atenção na respiração por 5 minutos',
    icon: '🧘',
    color: 'bg-blue-500',
    xp: 30,
    duration: 300,
    steps: [
      'Encontre uma posição confortável',
      'Feche os olhos suavemente',
      'Respire naturalmente',
      'Observe cada respiração',
      'Se distrair, volte gentilmente',
    ],
  },
  {
    id: 'mindfulness_2',
    title: 'Escaneamento Corporal',
    description: 'Conecte-se com seu corpo por 5 minutos',
    icon: '🌿',
    color: 'bg-teal-500',
    xp: 30,
    duration: 300,
    steps: [
      'Deite-se confortavelmente',
      'Comece pelos pés',
      'Suba lentamente pelo corpo',
      'Note sensações sem julgamento',
      'Termine na cabeça',
    ],
  },
];

export const GRATITUDE_CHALLENGES = [
  {
    id: 'gratitude_1',
    title: 'Três Gratidões',
    description: 'Reflita sobre 3 coisas boas do seu dia',
    icon: '🙏',
    color: 'bg-yellow-500',
    xp: 25,
    prompts: [
      'Algo que aconteceu hoje que te deixou feliz...',
      'Uma pessoa pela qual você é grato...',
      'Uma habilidade sua que você valoriza...',
    ],
  },
  {
    id: 'gratitude_2',
    title: 'Carta de Gratidão',
    description: 'Escreva sobre momentos positivos',
    icon: '💌',
    color: 'bg-pink-500',
    xp: 25,
    prompts: [
      'Um desafio superado recentemente...',
      'Algo simples que trouxe alegria...',
      'Uma conquista pessoal desta semana...',
    ],
  },
];

export const BREATHING_CHALLENGES = [
  {
    id: 'breathing_1',
    title: 'Respiração 4-7-8',
    description: 'Técnica calmante para reduzir ansiedade',
    icon: '💨',
    color: 'bg-indigo-500',
    xp: 20,
    cycles: 4,
    phases: [
      { name: 'Inspire', duration: 4, instruction: 'Inspire pelo nariz' },
      { name: 'Segure', duration: 7, instruction: 'Segure o ar' },
      { name: 'Expire', duration: 8, instruction: 'Expire pela boca' },
    ],
  },
  {
    id: 'breathing_2',
    title: 'Respiração Quadrada',
    description: 'Box breathing para clareza mental',
    icon: '🔲',
    color: 'bg-sage-500',
    xp: 20,
    cycles: 4,
    phases: [
      { name: 'Inspire', duration: 4, instruction: 'Inspire devagar' },
      { name: 'Segure', duration: 4, instruction: 'Segure completamente' },
      { name: 'Expire', duration: 4, instruction: 'Expire completamente' },
      { name: 'Espere', duration: 4, instruction: 'Espere antes de inspirar' },
    ],
  },
];

// ── Desafios baseados em TCC (terapia cognitivo-comportamental) ──────────────

// Registro de pensamentos (RPD): situação → pensamento automático → emoção →
// evidências → reestruturação. Mesma mecânica de prompts da gratidão.
export const THOUGHT_RECORD_CHALLENGES = [
  {
    id: 'thought_record_1',
    title: 'Registro de Pensamentos',
    description: 'Examine um pensamento difícil e encontre um olhar mais equilibrado',
    icon: '🧠',
    color: 'bg-violet-500',
    xp: 30,
    prompts: [
      'Descreva brevemente uma situação recente que te incomodou...',
      'Qual pensamento passou pela sua cabeça naquele momento?',
      'Que emoção você sentiu? Dê uma nota de 0 a 10 para a intensidade...',
      'Quais fatos apoiam esse pensamento? E quais o contradizem?',
      'Reescreva o pensamento de um jeito mais equilibrado e realista...',
    ],
  },
];

// Grounding 5-4-3-2-1: ancoragem sensorial no presente, no ritmo do usuário.
export const GROUNDING_CHALLENGES = [
  {
    id: 'grounding_1',
    title: 'Grounding 5-4-3-2-1',
    description: 'Ancore-se no presente usando os cinco sentidos',
    icon: '🌳',
    color: 'bg-emerald-500',
    xp: 20,
    senses: [
      { count: 5, icon: '👀', label: 'coisas que você pode ver', instruction: 'Olhe ao redor com calma e nomeie 5 coisas que você consegue ver agora.' },
      { count: 4, icon: '✋', label: 'coisas que você pode tocar', instruction: 'Note 4 texturas ao seu alcance: a roupa, a cadeira, o ar na pele...' },
      { count: 3, icon: '👂', label: 'sons que você pode ouvir', instruction: 'Feche os olhos e identifique 3 sons ao seu redor, perto ou longe.' },
      { count: 2, icon: '👃', label: 'cheiros que você pode sentir', instruction: 'Respire fundo e perceba 2 cheiros presentes no ambiente.' },
      { count: 1, icon: '👅', label: 'sabor que você pode sentir', instruction: 'Note 1 sabor na sua boca agora — ou apenas a sensação dela.' },
    ],
  },
];

// Relaxamento muscular progressivo: tensiona (5s) e solta (10s) cada grupo.
export const RELAXATION_CHALLENGES = [
  {
    id: 'relaxation_1',
    title: 'Relaxamento Muscular',
    description: 'Tensione e solte cada grupo muscular para liberar a tensão',
    icon: '💆',
    color: 'bg-cyan-500',
    xp: 25,
    tenseSeconds: 5,
    releaseSeconds: 10,
    groups: [
      { name: 'Mãos e antebraços', instruction: 'Feche os punhos com força' },
      { name: 'Braços', instruction: 'Dobre os braços e contraia os bíceps' },
      { name: 'Ombros e pescoço', instruction: 'Levante os ombros em direção às orelhas' },
      { name: 'Rosto', instruction: 'Franza a testa e feche os olhos com força' },
      { name: 'Abdômen', instruction: 'Contraia a barriga como se fosse receber um empurrão' },
      { name: 'Pernas e pés', instruction: 'Estique as pernas e aponte os pés para frente' },
    ],
  },
];

export const CATEGORIES = [
  { type: 'mindfulness', pool: MINDFULNESS_CHALLENGES },
  { type: 'gratitude', pool: GRATITUDE_CHALLENGES },
  { type: 'breathing', pool: BREATHING_CHALLENGES },
  { type: 'thought_record', pool: THOUGHT_RECORD_CHALLENGES },
  { type: 'grounding', pool: GROUNDING_CHALLENGES },
  { type: 'relaxation', pool: RELAXATION_CHALLENGES },
];

// 3 desafios por dia, rotacionando entre as 6 categorias: o dia d mostra as
// categorias d, d+1 e d+2 (mod 6). A combinação muda todo dia e cada categoria
// aparece 3 dias seguidos e descansa 3 — variedade sem sumir por muito tempo.
// A variante dentro da categoria também roda pelo dia do ano.
// `date` é parametrizável para os testes; em produção usa o dia atual.
export function getDailyChallenges(date = new Date()) {
  const dayOfYear = Math.floor(
    (date - new Date(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24)
  );
  return [0, 1, 2].map((offset) => {
    const cat = CATEGORIES[(dayOfYear + offset) % CATEGORIES.length];
    return { ...cat.pool[dayOfYear % cat.pool.length], type: cat.type };
  });
}
