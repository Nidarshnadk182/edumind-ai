import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f2fa',
          100: '#dde1f2',
          200: '#b8c0e3',
          300: '#8d99cf',
          400: '#5f6fb5',
          500: '#3f4d99',
          600: '#2d3a7d',
          700: '#232d63',
          800: '#1a2149',
          900: '#0f1430',
          950: '#080a1c',
        },
        purple: {
          50: '#f5f1fc',
          100: '#e9def8',
          200: '#d1bcf1',
          300: '#b494e6',
          400: '#9769d8',
          500: '#7d4bc4',
          600: '#653aa3',
          700: '#502e81',
          800: '#3c2360',
          900: '#281840',
        },
        lavender: {
          50: '#f8f6fe',
          100: '#f0ecfd',
          200: '#e2d9fa',
          300: '#cdbdf5',
          400: '#b298ee',
          500: '#9773e3',
        },
        canvas: {
          light: '#fbfaff',
          dark: '#0b0e1f',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-lexend)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        soft: '0 2px 8px 0 rgb(15 20 48 / 0.06), 0 1px 2px 0 rgb(15 20 48 / 0.04)',
        card: '0 4px 20px -2px rgb(15 20 48 / 0.08)',
        lift: '0 12px 32px -8px rgb(80 46 129 / 0.18)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.4s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
