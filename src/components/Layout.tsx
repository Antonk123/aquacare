import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { ThemeToggle } from './ThemeToggle'

function TopBar() {
  return (
    <div className="flex justify-between items-center px-4 pt-3 pb-2 safe-area-pt">
      <div
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cream-light border border-cream-border"
        style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 13, fontWeight: 400, letterSpacing: '-0.01em' }}
      >
        <div
          className="w-5 h-5 rounded-full"
          style={{
            background: 'radial-gradient(ellipse at 30% 20%, var(--color-water) 0%, var(--color-accent) 60%, oklch(0.35 0.06 235) 100%)',
          }}
        />
        <span className="text-charcoal">AquaCare</span>
      </div>
      <ThemeToggle />
    </div>
  )
}

export function Layout() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="min-h-dvh max-w-md mx-auto pb-24 relative">
      <TopBar />
      <Outlet />
      <BottomNav />
    </div>
  )
}
