export function ProgressRing({
  percent,
  size = 96,
  label,
}: {
  percent: number
  size?: number
  label?: string
}) {
  const radius = 15.9155
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percent / 100) * circumference

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle
            cx="18"
            cy="18"
            r={radius}
            fill="none"
            stroke="var(--color-cream-border)"
            strokeWidth="2.5"
          />
          <circle
            cx="18"
            cy="18"
            r={radius}
            fill="none"
            stroke="var(--color-charcoal)"
            strokeWidth="2.5"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-semibold text-charcoal tracking-tight">
            {percent}%
          </span>
        </div>
      </div>
      {label && (
        <p className="text-xs text-charcoal-muted mt-2 text-center">{label}</p>
      )}
    </div>
  )
}
