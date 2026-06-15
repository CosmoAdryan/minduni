/** @type {import('tailwindcss').Config} */
// MindUni — Fase 4 design tokens. "Minimalismo quente": base stone + accent sage.
// Stone e gray são propositalmente redefinidos com os MESMOS valores quentes para
// que qualquer classe `gray-*` herdada do código antigo já apareça aquecida, sem
// precisar reescrever toda classe manualmente.
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: 'media', // follows system preference automatically via NativeWind
  theme: {
    extend: {
      colors: {
        // ── Stone — base neutra quente ──
        stone: {
          50: '#FAFAF8', 100: '#F4F2EE', 200: '#E6E2DB', 300: '#CEC9BF',
          400: '#A29D95', 500: '#756F66', 600: '#5A544C', 700: '#3A3731',
          800: '#282521', 900: '#1C1917',
        },
        // Override gray com os valores quentes do stone — migração instantânea
        gray: {
          50: '#FAFAF8', 100: '#F4F2EE', 200: '#E6E2DB', 300: '#CEC9BF',
          400: '#A29D95', 500: '#756F66', 600: '#5A544C', 700: '#3A3731',
          800: '#282521', 900: '#1C1917',
        },
        // ── Sage — único accent de marca ──
        sage: {
          50: '#EEF5F1', 100: '#D4E9DE', 200: '#A9D3BF',
          400: '#5E9B84', 500: '#3D7A67', 600: '#2D6254', 700: '#1E4D41',
        },
        // Safety net: referências legadas a brand-*/accent-* renderizam sage
        brand: {
          50: '#EEF5F1', 100: '#D4E9DE', 200: '#A9D3BF', 300: '#A9D3BF',
          400: '#5E9B84', 500: '#3D7A67', 600: '#2D6254', 700: '#1E4D41',
        },
        accent: {
          50: '#EEF5F1', 100: '#D4E9DE', 400: '#5E9B84', 500: '#3D7A67', 600: '#2D6254',
        },
        // ── XP — âmbar para celebração ──
        xp: { light: '#FEF8EC', border: '#FCEECE', main: '#D4973E', dark: '#B87A28' },
        // ── Crisis — coral quente, não vermelho ──
        crisis: { light: '#FDF2F2', border: '#F5C6C6', main: '#C04A4A', dark: '#9B2424' },
        // ── Mood scale (Jonauskaite 2020) — nenhum vermelho ──
        mood: { 1: '#3B6FAB', 2: '#6B8FAB', 3: '#888787', 4: '#5E9B84', 5: '#C9963A' },
        // ── Dark mode surfaces ──
        dark: { bg: '#131210', surf: '#1D1B17', border: '#2C2922' },
        // Semantic roles
        success: '#3D7A67',
        warning: '#D4973E',
        danger: '#C04A4A',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui'],
        sage: ['Lora', 'Georgia', 'serif'], // APENAS para mensagens do Sage
      },
      fontSize: {
        // Typographic scale — consistent across all screens
        'xs':   ['11px', { lineHeight: '16px' }],
        'sm':   ['13px', { lineHeight: '20px' }],
        'base': ['15px', { lineHeight: '24px' }],
        'lg':   ['17px', { lineHeight: '26px' }],
        'xl':   ['20px', { lineHeight: '28px' }],
        '2xl':  ['24px', { lineHeight: '32px' }],
        '3xl':  ['30px', { lineHeight: '38px' }],
        '4xl':  ['36px', { lineHeight: '44px' }],
      },
      borderRadius: {
        sm: '6px', md: '12px', lg: '20px', pill: '999px',
      },
    },
  },
  plugins: [],
};
