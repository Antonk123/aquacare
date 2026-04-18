import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['selector', '[data-mood="onsen"]'],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: 'var(--color-cream)',
          light: 'var(--color-cream-light)',
          border: 'var(--color-cream-border)',
        },
        charcoal: {
          DEFAULT: 'var(--color-charcoal)',
          muted: 'var(--color-charcoal-muted)',
          strong: 'var(--color-charcoal-strong)',
          body: 'var(--color-charcoal-body)',
          line: 'var(--color-charcoal-line)',
          hover: 'var(--color-charcoal-hover)',
          whisper: 'var(--color-charcoal-whisper)',
        },
        status: {
          ok: 'var(--color-status-ok)',
          warn: 'var(--color-status-warn)',
          error: 'var(--color-status-error)',
          alert: 'var(--color-status-alert)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          soft: 'var(--color-accent-soft)',
        },
        water: 'var(--color-water)',
        warm: 'var(--color-warm)',
        // Legacy aliases
        navy: {
          DEFAULT: 'var(--color-navy)',
          light: 'var(--color-navy-light)',
        },
        gold: {
          DEFAULT: 'var(--color-gold)',
          dark: 'var(--color-gold-dark)',
        },
        glass: {
          surface: 'var(--color-glass-surface)',
          border: 'var(--color-glass-border)',
        },
      },
      fontFamily: {
        display: ['"Newsreader"', 'Georgia', 'serif'],
        body: ['"Geist"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        pill: '9999px',
        spa: '20px',
      },
      boxShadow: {
        inset:
          'rgba(255,255,255,0.15) 0px 0.5px 0px 0px inset, rgba(0,0,0,0.08) 0px 1px 3px 0px',
        focus: 'rgba(0,0,0,0.08) 0px 4px 12px',
      },
    },
  },
  plugins: [],
} satisfies Config
