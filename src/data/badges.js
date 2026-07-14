// variant: 'sage' (constância/reflexão) | 'amber' (XP/níveis/celebração).
// Substitui os antigos campos color/textColor (classes dinâmicas que quebravam
// no build do NativeWind). BadgeCard mapeia variant → estilo estático.
//
// Ordem = ordem de exibição no perfil. Agrupado por tema e, dentro de cada
// grupo, em progressão crescente (ex.: nível 3 → 5 → máximo).
export const BADGES = [
  // ── Conversa com o Sage ─────────────────────────────────────────────────────
  {
    id: 'first_chat',
    name: 'Primeira Conversa',
    description: 'Envie sua primeira mensagem ao Sage',
    icon: '💬',
    variant: 'sage',
  },
  {
    id: 'chat_streak_7',
    name: 'Diálogo Constante',
    description: 'Converse com o Sage por 7 dias seguidos',
    icon: '🗣️',
    variant: 'sage',
  },

  // ── Streak de acesso ────────────────────────────────────────────────────────
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
    id: 'active_30',
    name: 'Veterano',
    description: 'Use o app por 30 dias',
    icon: '🎖️',
    variant: 'amber',
  },

  // ── Humor ───────────────────────────────────────────────────────────────────
  {
    id: 'mood_7',
    name: 'Observador',
    description: 'Registre seu humor por 7 dias',
    icon: '📊',
    variant: 'sage',
  },
  {
    id: 'mood_30',
    name: 'Autoconhecimento',
    description: 'Registre seu humor por 30 dias',
    icon: '📈',
    variant: 'sage',
  },

  // ── Diário ──────────────────────────────────────────────────────────────────
  {
    id: 'journal_5',
    name: 'Escritor',
    description: '5 entradas no diário',
    icon: '📖',
    variant: 'sage',
  },
  {
    id: 'journal_15',
    name: 'Cronista',
    description: 'Escreva 15 entradas no diário',
    icon: '✍️',
    variant: 'sage',
  },

  // ── Desafios ────────────────────────────────────────────────────────────────
  {
    id: 'all_challenges',
    name: 'Dia Completo',
    description: 'Complete todos os desafios do dia',
    icon: '✅',
    variant: 'sage',
  },

  // ── Práticas por categoria (10 de cada) ─────────────────────────────────────
  // Desbloqueadas no servidor (gam_complete_challenge) ao acumular 10 práticas
  // concluídas de uma mesma categoria. Os ids seguem o padrão '<categoria>_10'.
  {
    id: 'mindfulness_10',
    name: 'Mente Serena',
    description: 'Complete 10 práticas de atenção plena',
    icon: '🧘',
    variant: 'sage',
  },
  {
    id: 'breathing_10',
    name: 'Fôlego',
    description: 'Complete 10 exercícios de respiração',
    icon: '🌬️',
    variant: 'sage',
  },
  {
    id: 'gratitude_10',
    name: 'Coração Grato',
    description: 'Complete 10 práticas de gratidão',
    icon: '🙏',
    variant: 'sage',
  },
  {
    id: 'thought_record_10',
    name: 'Detetive dos Pensamentos',
    description: 'Complete 10 registros de pensamento',
    icon: '🧠',
    variant: 'sage',
  },
  {
    id: 'grounding_10',
    name: 'Ancorado',
    description: 'Complete 10 práticas de grounding 5-4-3-2-1',
    icon: '🌍',
    variant: 'sage',
  },
  {
    id: 'relaxation_10',
    name: 'Corpo Leve',
    description: 'Complete 10 relaxamentos musculares',
    icon: '💆',
    variant: 'sage',
  },

  // ── Níveis (progressão) ─────────────────────────────────────────────────────
  {
    id: 'level_3',
    name: 'Primeiros Passos',
    description: 'Alcance o nível 3',
    icon: '🚀',
    variant: 'amber',
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

  // ── XP ──────────────────────────────────────────────────────────────────────
  {
    id: 'xp_1000',
    name: 'Mil Pontos',
    description: 'Acumule 1000 XP',
    icon: '💎',
    variant: 'amber',
  },
];
