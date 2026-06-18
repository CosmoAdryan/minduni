/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── Stone — base neutra quente (substitui os grays genéricos) ──
        stone: {
          50: '#FAFAF8',  // bg de todas as telas
          100: '#F4F2EE', // surface alternativo, input bg
          200: '#E6E2DB', // borders padrão
          300: '#CEC9BF', // dividers, borders desabilitados
          400: '#A29D95', // placeholder, text-tertiary
          500: '#756F66', // text-secondary, labels
          600: '#5A544C', // text-medium
          700: '#3A3731', // text-strong
          800: '#282521', // text-dark
          900: '#1C1917', // text-primary, headings
        },

        // ── Sage — único accent de marca (substitui o roxo) ──
        sage: {
          50: '#EEF5F1',  // bg ativos, XPBar track
          100: '#D4E9DE', // hover, avatar bg do Sage
          200: '#A9D3BF', // borders ativos
          400: '#5E9B84', // dark mode accent, humor nível 4
          500: '#3D7A67', // PRIMARY — CTAs, tab ativo, ícones
          600: '#2D6254', // pressed state
          700: '#1E4D41', // text em bg sage
        },

        // ── XP — âmbar para celebração ──
        xp: {
          light: '#FEF8EC',
          border: '#FCEECE',
          main: '#D4973E',  // XP toast, badges desbloqueados
          dark: '#B87A28',
        },

        // ── Crisis — coral quente, nunca vermelho ──
        crisis: {
          light: '#FDF2F2',
          border: '#F5C6C6',
          main: '#C04A4A',  // CVV button, CrisisModal CTA apenas
          dark: '#9B2424',
        },

        // ── Mood scale (Jonauskaite 2020) — nenhum estado usa vermelho ──
        mood: {
          1: '#3B6FAB', // muito mal — azul profundo
          2: '#6B8FAB', // mal — azul-acinzentado
          3: '#888787', // neutro — cinza sem conotação
          4: '#5E9B84', // bem — sage (identidade)
          5: '#C9963A', // ótimo — dourado, flourishing
        },

        // ── Dark mode surfaces (reservado — tema escuro futuro) ──
        dark: {
          bg: '#131210',
          surf: '#1D1B17',
          border: '#2C2922',
        },
      },
      fontFamily: {
        sans: ['Inter_400Regular', 'system-ui', 'sans-serif'],
        sage: ['Lora_400Regular_Italic', 'Georgia', 'serif'], // APENAS para mensagens do Sage
      },
      fontSize: {
        // Escala t-shirt mantida (telas existentes dependem dela)
        'xs':   ['11px', { lineHeight: '16px' }],
        'sm':   ['13px', { lineHeight: '20px' }],
        'base': ['15px', { lineHeight: '24px' }],
        'lg':   ['17px', { lineHeight: '26px' }],
        'xl':   ['20px', { lineHeight: '30px' }],
        '2xl':  ['24px', { lineHeight: '32px' }],
        '3xl':  ['30px', { lineHeight: '38px' }],
        '4xl':  ['36px', { lineHeight: '44px' }],
        // Escala semântica nova (Fase 4)
        caption:    ['11px', { lineHeight: '16px', fontWeight: '500' }],
        small:      ['13px', { lineHeight: '20px' }],
        body:       ['15px', { lineHeight: '24px' }],
        'title-sm': ['17px', { lineHeight: '26px', fontWeight: '700' }],
        title:      ['20px', { lineHeight: '28px', fontWeight: '800' }],
        display:    ['24px', { lineHeight: '32px', fontWeight: '800', letterSpacing: '-0.01em' }],
      },
      borderRadius: {
        pill: '999px', // avatars, XPBar, botão enviar
      },
    },
  },
  plugins: [],
};
