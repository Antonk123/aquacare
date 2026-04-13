import { NavLink } from 'react-router-dom'
import { Home, Calendar, Droplets, BarChart3, Settings } from 'lucide-react'

const tabs = [
  { to: '/', label: 'Hem', Icon: Home },
  { to: '/schema', label: 'Schema', Icon: Calendar },
  { to: '/logg', label: 'Logg', Icon: Droplets },
  { to: '/rapporter', label: 'Rapport', Icon: BarChart3 },
  { to: '/installningar', label: 'Mer', Icon: Settings },
] as const

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-navy/95 backdrop-blur-md border-t border-glass-border safe-area-pb z-50">
      <div className="flex justify-around max-w-md mx-auto">
        {tabs.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center min-w-[48px] min-h-[48px] py-2 transition-colors duration-200 active:scale-95 ${
                isActive ? 'text-gold' : 'text-slate-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span className={`text-[10px] mt-1 ${isActive ? 'font-semibold' : ''}`}>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
