import { NavLink } from 'react-router-dom'

// Inline SVG icons matching the spa design
const icons = {
  home: (active: boolean) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
      <path d="M3 12l9-8 9 8v9a1 1 0 01-1 1h-5v-7h-6v7H4a1 1 0 01-1-1v-9z" strokeLinejoin="round"/>
    </svg>
  ),
  book: (active: boolean) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
      <path d="M5 4h12a2 2 0 012 2v14H7a2 2 0 01-2-2V4z" strokeLinejoin="round"/>
      <path d="M5 4v14a2 2 0 012-2h12"/>
    </svg>
  ),
  leaf: (active: boolean) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
      <path d="M20 4c-8 0-14 4-14 11 0 3 2 5 5 5 7 0 11-5 11-14l-2-2z" strokeLinejoin="round"/>
      <path d="M6 20c2-4 5-7 10-9"/>
    </svg>
  ),
  beaker: (active: boolean) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
      <path d="M9 3h6m-5 0v6L5 19a2 2 0 002 2h10a2 2 0 002-2l-5-10V3" strokeLinejoin="round"/>
      <path d="M7 14h10"/>
    </svg>
  ),
  wave: (active: boolean) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
      <path d="M3 9c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 15c2-2 4-2 6 0s4 2 6 0 4-2 6 0" strokeLinecap="round"/>
    </svg>
  ),
}

const tabs = [
  { to: '/', label: 'Idag', icon: icons.home },
  { to: '/logg', label: 'Vattenlogg', icon: icons.book },
  { to: '/schema', label: 'Underhåll', icon: icons.leaf },
  { to: '/kalkyl', label: 'Kalkylator', icon: icons.beaker },
  { to: '/rapporter', label: 'Trender', icon: icons.wave },
] as const

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 pb-[env(safe-area-inset-bottom,0px)]"
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)',
        paddingLeft: 8,
        paddingRight: 8,
        paddingTop: 8,
        background: 'linear-gradient(to top, var(--color-cream) 70%, transparent)',
      }}
    >
      <div
        className="flex justify-around max-w-md mx-auto p-1.5 rounded-full border border-cream-border backdrop-blur-xl"
        style={{
          background: 'var(--color-cream-light)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        }}
      >
        {tabs.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-0.5 py-2 px-1 rounded-full transition-all duration-200 ${
                isActive
                  ? 'bg-charcoal text-cream'
                  : 'text-charcoal-muted'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {icon(isActive)}
                <span
                  className="text-[9px] uppercase tracking-[0.05em]"
                  style={{ fontWeight: isActive ? 500 : 400 }}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
