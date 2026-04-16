import { Link } from 'react-router-dom'
import { Calendar, Calculator, FileText, BarChart3, Clock, Settings } from 'lucide-react'

const links = [
  { to: '/schema', label: 'Schema', description: 'Underhållsuppgifter', Icon: Calendar },
  { to: '/kalkyl', label: 'Kalkylator', description: 'Kemikaliedosering', Icon: Calculator },
  { to: '/noteringar', label: 'Noteringar', description: 'Påminnelser', Icon: FileText },
  { to: '/rapporter', label: 'Rapporter', description: 'Trender & export', Icon: BarChart3 },
  { to: '/aktivitet', label: 'Aktivitet', description: 'Händelselogg', Icon: Clock },
  { to: '/installningar', label: 'Inställningar', description: 'Konto & admin', Icon: Settings },
]

export default function More() {
  return (
    <div className="p-5 space-y-4">
      <h1 className="font-display text-[28px] leading-none font-semibold text-charcoal tracking-[-0.035em]">
        Mer
      </h1>

      <div className="grid grid-cols-2 gap-2">
        {links.map(({ to, label, description, Icon }) => (
          <Link
            key={to}
            to={to}
            className="bg-cream border border-cream-border rounded-xl p-4 flex flex-col gap-2 transition-colors duration-150 active:opacity-80 hover:bg-charcoal-hover"
          >
            <div className="w-10 h-10 rounded-lg bg-charcoal/5 flex items-center justify-center">
              <Icon size={20} className="text-charcoal" strokeWidth={1.75} />
            </div>
            <div>
              <div className="text-[14px] text-charcoal font-medium tracking-tight">{label}</div>
              <div className="text-[11px] text-charcoal-muted mt-0.5">{description}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
