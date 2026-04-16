import { Link } from 'react-router-dom'
import { Droplets, Plus, KeyRound, LogIn } from 'lucide-react'
import { GlassCard } from '../components/GlassCard'

export default function Welcome() {
  return (
    <div className="p-5 flex flex-col items-center justify-center min-h-dvh safe-area-pt">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-charcoal/5 border border-cream-border mb-4">
            <Droplets size={32} className="text-charcoal" />
          </div>
          <h1 className="font-display text-3xl text-charcoal tracking-[3px] font-bold">AquaCare</h1>
          <p className="text-sm text-charcoal-muted mt-2">Professionell vattenkontroll</p>
        </div>
        <div className="space-y-3">
          <Link to="/skapa">
            <GlassCard className="flex items-center gap-3 active:scale-[0.98] transition-transform duration-200">
              <div className="w-10 h-10 rounded-xl bg-charcoal/5 flex items-center justify-center flex-shrink-0">
                <Plus size={20} className="text-charcoal" />
              </div>
              <div>
                <div className="text-sm font-semibold text-charcoal">Skapa anläggning</div>
                <div className="text-xs text-charcoal-muted">Ny anläggning med dig som admin</div>
              </div>
            </GlassCard>
          </Link>
          <Link to="/join">
            <GlassCard className="flex items-center gap-3 active:scale-[0.98] transition-transform duration-200 mt-3">
              <div className="w-10 h-10 rounded-xl bg-charcoal/5 flex items-center justify-center flex-shrink-0">
                <KeyRound size={20} className="text-charcoal" />
              </div>
              <div>
                <div className="text-sm font-semibold text-charcoal">Jag har en kod</div>
                <div className="text-xs text-charcoal-muted">Gå med i en befintlig anläggning</div>
              </div>
            </GlassCard>
          </Link>
          <Link to="/login">
            <GlassCard className="flex items-center gap-3 active:scale-[0.98] transition-transform duration-200 mt-3">
              <div className="w-10 h-10 rounded-xl bg-cream-light flex items-center justify-center flex-shrink-0">
                <LogIn size={20} className="text-charcoal-muted" />
              </div>
              <div>
                <div className="text-sm font-semibold text-charcoal">Logga in</div>
                <div className="text-xs text-charcoal-muted">Jag har redan ett konto</div>
              </div>
            </GlassCard>
          </Link>
        </div>
      </div>
    </div>
  )
}
