import { useState, useEffect } from 'react'
import { ArrowLeft, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { GlassCard } from '../components/GlassCard'
import { api } from '../lib/api'

// ─── Constants ────────────────────────────────────────────────────────────────

const ACTION_LABELS: Record<string, string> = {
  water_log_created: 'Loggade vattentest',
  task_checked: 'Checkade av uppgift',
  task_unchecked: 'Ångrade uppgift',
  water_changed: 'Markerade vattenbyte',
}

const DEFAULT_LIMIT = 50

// ─── Types ────────────────────────────────────────────────────────────────────

interface ActivityItem {
  id: string
  user_name: string
  action: string
  target_type: string | null
  details: string | null
  created_at: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getActionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action
}

function getInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase()
}

function formatDateGroup(isoDate: string): string {
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  const d = new Date(isoDate)

  const isToday =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()

  const isYesterday =
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate()

  if (isToday) return 'Idag'
  if (isYesterday) return 'Igår'

  return d.toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })
}

function formatRelativeTime(isoString: string): string {
  const now = Date.now()
  const then = new Date(isoString).getTime()
  const diffMs = now - then
  const diffMin = Math.floor(diffMs / 60_000)
  const diffH = Math.floor(diffMs / 3_600_000)
  const diffD = Math.floor(diffMs / 86_400_000)

  if (diffMin < 1) return 'precis nu'
  if (diffMin < 60) return `${diffMin} min sedan`
  if (diffH < 24) return `${diffH} tim sedan`
  if (diffD === 1) return 'igår'
  return `${diffD} dagar sedan`
}

function groupByDate(items: ActivityItem[]): { dateLabel: string; items: ActivityItem[] }[] {
  const groups: { dateLabel: string; items: ActivityItem[] }[] = []
  const seen: Record<string, number> = {}

  for (const item of items) {
    const dayKey = new Date(item.created_at).toDateString()
    if (seen[dayKey] === undefined) {
      seen[dayKey] = groups.length
      groups.push({ dateLabel: formatDateGroup(item.created_at), items: [] })
    }
    groups[seen[dayKey]].items.push(item)
  }

  return groups
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Avatar({ name }: { name: string }) {
  return (
    <div
      className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center bg-gold/10 border border-gold/20"
      aria-hidden="true"
    >
      <span className="text-gold font-semibold text-[13px] leading-none">{getInitial(name)}</span>
    </div>
  )
}

function ActivityRow({ item }: { item: ActivityItem }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
      <Avatar name={item.user_name} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-200 font-medium leading-snug truncate">
          {item.user_name}
        </p>
        <p className="text-xs text-slate-400 truncate">{getActionLabel(item.action)}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0 text-slate-500">
        <Clock size={11} />
        <span className="text-[11px]">{formatRelativeTime(item.created_at)}</span>
      </div>
    </div>
  )
}

function DateGroupSection({ dateLabel, items }: { dateLabel: string; items: ActivityItem[] }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[1.5px] text-slate-500 mb-2 px-0.5">{dateLabel}</p>
      <GlassCard className="!p-0 overflow-hidden">
        <div className="divide-y-0 px-4">
          {items.map((item) => (
            <ActivityRow key={item.id} item={item} />
          ))}
        </div>
      </GlassCard>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Activity() {
  const navigate = useNavigate()
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [limit, setLimit] = useState(DEFAULT_LIMIT)
  const [mayHaveMore, setMayHaveMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  async function fetchActivities(newLimit: number, isLoadMore = false) {
    if (isLoadMore) setLoadingMore(true)
    else setLoading(true)
    setError(null)
    try {
      const data = await api.getActivity(newLimit)
      setActivities(data)
      setMayHaveMore(data.length === newLimit)
    } catch {
      setError('Kunde inte hämta aktivitetslogg')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    fetchActivities(DEFAULT_LIMIT)
  }, [])

  function handleLoadMore() {
    const newLimit = limit + DEFAULT_LIMIT
    setLimit(newLimit)
    fetchActivities(newLimit, true)
  }

  const groups = groupByDate(activities)

  return (
    <div className="p-5 space-y-4 pb-24 relative">
      {/* Aurora glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[100px] bg-[radial-gradient(ellipse,rgba(232,201,122,0.07)_0%,transparent_70%)] pointer-events-none" />

      {/* Header */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center -ml-2 text-slate-400 hover:text-slate-200 transition-colors"
          aria-label="Tillbaka"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-display text-xl text-gold font-bold tracking-wide">Aktivitetslogg</h1>
      </div>

      {/* Loading state */}
      {loading && (
        <GlassCard>
          <div className="h-24 flex items-center justify-center">
            <span className="text-slate-500 text-sm">Laddar aktiviteter...</span>
          </div>
        </GlassCard>
      )}

      {/* Error state */}
      {!loading && error && (
        <GlassCard>
          <p className="text-sm text-red-400 text-center py-4">{error}</p>
        </GlassCard>
      )}

      {/* Empty state */}
      {!loading && !error && activities.length === 0 && (
        <GlassCard className="text-center py-8">
          <Clock size={28} className="text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400">Ingen aktivitet ännu</p>
          <p className="text-xs text-slate-600 mt-1">Aktiviteter visas här när du loggar vattentest, bockar uppgifter m.m.</p>
        </GlassCard>
      )}

      {/* Grouped activity list */}
      {!loading && !error && groups.map(({ dateLabel, items }) => (
        <DateGroupSection key={dateLabel} dateLabel={dateLabel} items={items} />
      ))}

      {/* Load more */}
      {!loading && mayHaveMore && (
        <button
          onClick={handleLoadMore}
          disabled={loadingMore}
          className="w-full min-h-[48px] flex items-center justify-center gap-2 rounded-xl border border-white/10 text-slate-300 text-sm font-medium bg-white/[0.03] hover:bg-white/[0.06] transition-colors duration-200 disabled:opacity-50"
        >
          {loadingMore ? 'Laddar...' : 'Visa fler aktiviteter'}
        </button>
      )}
    </div>
  )
}
