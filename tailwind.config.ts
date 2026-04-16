import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // All values reference CSS variables defined in src/index.css
        // so every utility class (bg-cream, text-charcoal, etc.) automatically
        // swaps when [data-theme="dark"] is set on <html>.
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
        },
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
        display: ['"Instrument Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['"Instrument Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        pill: '9999px',
      },
      boxShadow: {
        inset:
          'rgba(255,255,255,0.2) 0px 0.5px 0px 0px inset, rgba(0,0,0,0.2) 0px 0px 0px 0.5px inset, rgba(0,0,0,0.05) 0px 1px 2px 0px',
        focus: 'rgba(0,0,0,0.1) 0px 4px 12px',
      },
    },
  },
  plugins: [],
} satisfies Config
