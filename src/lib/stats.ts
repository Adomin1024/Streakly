import { useEffect, useState } from 'react'
import { supabase, dayKey, daysAgo } from './supabase'
import { useTimer } from './timer'

export type Stats = { week: { label: string; min: number }[]; heat: { key: string; min: number }[]; habits: number; done: number; streak: number; best: number; total: number }
const EMPTY: Stats = { week: [], heat: [], habits: 0, done: 0, streak: 0, best: 0, total: 0 }

export function useStats() {
  const { version } = useTimer()
  const [s, setS] = useState<Stats>(EMPTY)
  useEffect(() => {
    let stale = false
    ;(async () => {
      const from = daysAgo(83)
      from.setHours(0, 0, 0, 0)
      const [a, b, c] = await Promise.all([
        supabase.from('sessions').select('duration_sec,created_at').eq('kind', 'focus').gte('created_at', from.toISOString()).limit(5000),
        supabase.from('habits').select('id', { count: 'exact', head: true }),
        supabase.from('habit_checks').select('id', { count: 'exact', head: true }).eq('day', dayKey()),
      ])
      if (stale) return
      const by = new Map<string, number>()
      for (const r of a.data ?? []) { const k = dayKey(new Date(r.created_at)); by.set(k, (by.get(k) ?? 0) + r.duration_sec / 60) }
      const heat = Array.from({ length: 84 }, (_, i) => { const k = dayKey(daysAgo(83 - i)); return { key: k, min: Math.round(by.get(k) ?? 0) } })
      const week = heat.slice(-7).map((d) => ({ label: new Date(d.key + 'T12:00').toLocaleDateString([], { weekday: 'short' }), min: d.min }))
      let streak = 0
      for (let i = heat[83].min > 0 ? 83 : 82; i >= 0 && heat[i].min > 0; i--) streak++
      let best = 0, run = 0
      for (const d of heat) { run = d.min > 0 ? run + 1 : 0; best = Math.max(best, run) }
      setS({ week, heat, habits: b.count ?? 0, done: c.count ?? 0, streak, best, total: heat.reduce((x, d) => x + d.min, 0) })
    })()
    return () => { stale = true }
  }, [version])
  return s
}
