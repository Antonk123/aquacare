import type { ReactNode } from 'react'

/**
 * Spa-style surface card: mood-aware background, thin border, 20px radius.
 */
export function GlassCard({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`spa-card p-4 transition-colors duration-300 ${className}`}
    >
      {children}
    </div>
  )
}
