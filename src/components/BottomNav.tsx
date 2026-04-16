import { NavLink } from 'react-router-dom'
import { Home, Droplets, MoreHorizontal } from 'lucide-react'

const tabs = [
  { to: '/', label: 'Hem', Icon: Home },
  { to: '/logg', label: 'Logg', Icon: Droplets },
  { to: '/mer', label: 'Mer', Icon: MoreHorizontal },
] as const

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-cream/95 backdrop-blur-md border-t border-cream-border safe-area-pb z-50">
      <div className="flex justify-around max-w-md mx-auto">
        {tabs.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center min-w-[48px] min-h-[48px] py-2 transition-colors duration-200 active:opacity-80 ${
                isActive ? 'text-charcoal' : 'text-charcoal-muted'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
                <span
                  className={`text-[10px] mt-1 tracking-tight ${
                    isActive ? 'font-semibold' : 'font-normal'
                  }`}
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
