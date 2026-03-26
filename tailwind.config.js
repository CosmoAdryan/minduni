/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: 'media', // follows system preference automatically via NativeWind
  theme: {
    extend: {
      colors: {
        // Primary brand (purple)
        brand: {
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
        },
        // Accent (indigo — usado em breathing/challenges)
        accent: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
        },
        // Neutral grays — semantic naming for dark mode friendliness
        neutral: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
        // Semantic roles
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
      },
      fontSize: {
        // Typographic scale — consistent across all screens
        'xs':   ['11px', { lineHeight: '16px' }],
        'sm':   ['13px', { lineHeight: '20px' }],
        'base': ['15px', { lineHeight: '24px' }],
        'lg':   ['17px', { lineHeight: '26px' }],
        'xl':   ['20px', { lineHeight: '30px' }],
        '2xl':  ['24px', { lineHeight: '32px' }],
        '3xl':  ['30px', { lineHeight: '38px' }],
        '4xl':  ['36px', { lineHeight: '44px' }],
      },
    },
  },
  plugins: [],
};
