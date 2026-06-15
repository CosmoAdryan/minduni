// Badges — `variant` substitui as classes dinâmicas antigas (color/textColor).
// O bug do NativeWind (className dinâmico não compila) é resolvido com um mapa
// estático de variantes em BadgeCard. Variantes: 'sage' | 'amber'.
export const BADGES = [
  {
    id: 'first_chat',
    name: 'Primeira Conversa',
    description: 'Complete sua primeira sessão com o Sage',
    icon: '💬',
    variant: 'sage',
  },
  {
    id: 'streak_3',
    name: 'Constância',
    description: '3 dias consecutivos de acesso',
    icon: '🔥',
    variant: 'amber',
  },
  {
    id: 'streak_7',
    name: 'Semana Perfeita',
    description: '7 dias consecutivos de acesso',
    icon: '⭐',
    variant: 'amber',
  },
  {
    id: 'streak_30',
    name: 'Mês de Ouro',
    description: '30 dias consecutivos de acesso',
    icon: '🏆',
    variant: 'amber',
  },
  {
    id: 'all_challenges',
    name: 'Dia Completo',
    description: 'Complete todas as práticas do dia',
    icon: '✅',
    variant: 'sage',
  },
  {
    id: 'mood_7',
    name: 'Observador',
    description: 'Registre seu humor por 7 dias',
    icon: '📊',
    variant: 'sage',
  },
  {
    id: 'level_5',
    name: 'Meio Caminho',
    description: 'Alcance o nível 5',
    icon: '🌟',
    variant: 'amber',
  },
  {
    id: 'level_10',
    name: 'Mestre MindUni',
    description: 'Alcance o nível máximo',
    icon: '👑',
    variant: 'amber',
  },
  {
    id: 'journal_5',
    name: 'Escritor',
    description: '5 entradas no diário',
    icon: '📖',
    variant: 'sage',
  },
  {
    id: 'xp_1000',
    name: 'Mil Pontos',
    description: 'Acumule 1000 XP',
    icon: '💎',
    variant: 'sage',
  },
];
