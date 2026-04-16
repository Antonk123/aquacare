import type { ReactNode } from 'react'

/**
 * Lovable-style surface card: warm cream background, 1px border (#eceae4),
 * 12px radius, no heavy shadow. Keeps the `GlassCard` name for backwards
 * compatibility — the glass treatment is gone but the API is unchanged.
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
      className={`bg-cream border border-cream-border rounded-xl p-4 transition-colors duration-200 ${className}`}
    >
      {children}
    </div>
  )
}
