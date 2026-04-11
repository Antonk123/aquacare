import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0a1628',
          light: '#111d33',
        },
        gold: {
          DEFAULT: '#E8C97A',
          dark: '#d4a855',
        },
        status: {
          ok: '#4ade80',
          warn: '#fbbf24',
          error: '#f87171',
          alert: '#fb923c',
        },
        glass: {
          surface: 'rgba(232,201,122,0.07)',
          border: 'rgba(232,201,122,0.12)',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body: ['"DM Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
