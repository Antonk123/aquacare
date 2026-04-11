import type { ReactNode } from 'react'

export function GlassCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`bg-glass-surface backdrop-blur-[12px] border border-glass-border rounded-2xl p-4 transition-colors duration-200 ${className}`}
    >
      {children}
    </div>
  )
}
