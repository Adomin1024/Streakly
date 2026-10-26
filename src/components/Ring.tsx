import { useEffect, useState } from 'react'

export default function Ring({ value, max, label, sub, size = 150, color = '#3de8d0' }: { value: number; max: number; label: string; sub: string; size?: number; color?: string }) {
  const r = size / 2 - 11
  const c = 2 * Math.PI * r
  const target = max ? Math.min(1, value / max) : 0
  const [p, setP] = useState(0)
  useEffect(() => { const id = setTimeout(() => setP(target), 120); return () => clearTimeout(id) }, [target])
  return (
    <div className="donut" style={{ width: size, height: size }} role="img" aria-label={`${label}, ${sub}`}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeOpacity=".12" strokeWidth="11" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="11" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - p)} style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(.22,1,.36,1)', filter: `drop-shadow(0 0 6px ${color}88)` }} />
      </svg>
      <div className="donut-t"><b>{label}</b><span>{sub}</span></div>
    </div>
  )
}
