// Tokens de design da Fase 4 — fonte única para estilos inline (StyleSheet).
// Espelha o tailwind.config.js. Use as classes NativeWind (bg-sage-500, etc.)
// sempre que possível; este módulo é para componentes que usam style={{ }}.

export const stone = {
  50: '#FAFAF8', 100: '#F4F2EE', 200: '#E6E2DB', 300: '#CEC9BF',
  400: '#A29D95', 500: '#756F66', 600: '#5A544C', 700: '#3A3731',
  800: '#282521', 900: '#1C1917',
};

export const sage = {
  50: '#EEF5F1', 100: '#D4E9DE', 200: '#A9D3BF',
  400: '#5E9B84', 500: '#3D7A67', 600: '#2D6254', 700: '#1E4D41',
};

export const xp = {
  light: '#FEF8EC', border: '#FCEECE', main: '#D4973E', dark: '#B87A28',
};

export const crisis = {
  light: '#FDF2F2', border: '#F5C6C6', main: '#C04A4A', dark: '#9B2424',
};

// Escala de humor Jonauskaite (2020) — índice 0..4 = humor 1..5.
// Nenhum estado negativo usa vermelho: tristeza é azul profundo, não alarme.
export const MOOD_COLORS = ['#3B6FAB', '#6B8FAB', '#888787', '#5E9B84', '#C9963A'];

export const radius = { sm: 6, md: 12, lg: 20, pill: 999 };

export default { stone, sage, xp, crisis, MOOD_COLORS, radius };
