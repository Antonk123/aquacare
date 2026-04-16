import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ title, message, confirmLabel = 'Ta bort', onConfirm, onCancel }: ConfirmDialogProps) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onCancel])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        role="dialog"
        aria-modal="true"
        className="relative bg-cream-light border border-cream-border rounded-2xl p-5 w-full max-w-[320px] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-xl bg-red-500/15 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={18} className="text-red-400" />
          </div>
          <h3 className="text-[15px] font-bold text-charcoal">{title}</h3>
        </div>
        <p className="text-sm text-charcoal-muted mb-5">{message}</p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 min-h-[44px] bg-charcoal-hover border border-cream-border text-charcoal rounded-xl font-semibold text-sm transition-colors duration-200 active:scale-[0.98]"
          >
            Avbryt
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 min-h-[44px] bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl font-semibold text-sm transition-colors duration-200 active:scale-[0.98]"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
