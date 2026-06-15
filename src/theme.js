// MindUni — Fase 4 design tokens (JS) para estilos inline (StyleSheet/style props).
// Espelha o tailwind.config.js. Use estas constantes em vez de hex soltos para
// manter o "minimalismo quente" (stone + sage) coerente em todo o app.
import { Platform } from 'react-native';

export const T = {
  // Stone — base neutra quente
  s50: '#FAFAF8', s100: '#F4F2EE', s200: '#E6E2DB', s300: '#CEC9BF',
  s400: '#A29D95', s500: '#756F66', s600: '#5A544C', s700: '#3A3731',
  s800: '#282521', s900: '#1C1917',
  // Sage — accent único
  g50: '#EEF5F1', g100: '#D4E9DE', g200: '#A9D3BF',
  g400: '#5E9B84', g500: '#3D7A67', g600: '#2D6254', g700: '#1E4D41',
  // XP — âmbar
  a50: '#FEF8EC', a100: '#FCEECE', a400: '#D4973E', a500: '#B87A28',
  // Crisis — coral (não vermelho)
  cr: '#C04A4A', crL: '#FDF2F2', crB: '#F5C6C6', crD: '#9B2424',
  // Dark surfaces
  dk: '#131210', dks: '#1D1B17', dkb: '#2C2922',
};

// Escala de humor (Jonauskaite 2020) — índice 0..4 = humor 1..5. Nenhum vermelho.
export const MOOD_COLORS = ['#3B6FAB', '#6B8FAB', '#888787', '#5E9B84', '#C9963A'];
export const MOOD_EMOJIS = ['😢', '😔', '😐', '😊', '😄'];
export const MOOD_LABELS = ['Muito mal', 'Mal', 'Neutro', 'Bem', 'Ótimo'];

// Voz do Sage — serif itálico. Lora carrega via expo-font quando disponível;
// caso contrário cai no fallback serif do sistema (Georgia/Times), preservando o tom.
export const SAGE_FONT = Platform.select({ ios: 'Georgia', default: 'serif' });
