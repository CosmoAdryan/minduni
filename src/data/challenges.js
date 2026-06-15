export const MINDFULNESS_CHALLENGES = [
  {
    id: 'mindfulness_1',
    title: 'Respiração Consciente',
    description: 'Foque sua atenção na respiração por 5 minutos',
    icon: '🧘',
    color: 'bg-sage-500',
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
    color: 'bg-sage-400',
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
    color: 'bg-xp-main',
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
    color: 'bg-xp-main',
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
    color: 'bg-sage-600',
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

export function getDailyChallenges() {
  const dayOfYear = Math.floor(
    (new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24)
  );
  return {
    mindfulness: MINDFULNESS_CHALLENGES[dayOfYear % MINDFULNESS_CHALLENGES.length],
    gratitude: GRATITUDE_CHALLENGES[dayOfYear % GRATITUDE_CHALLENGES.length],
    breathing: BREATHING_CHALLENGES[dayOfYear % BREATHING_CHALLENGES.length],
  };
}
