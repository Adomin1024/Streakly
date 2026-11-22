import { useEffect, useState } from 'react'
import { supabase, dayKey } from '../lib/supabase'
import { useTimer } from '../lib/timer'

type Day = { key: string; label: string; focusMin: number; done: number }

function shift(key: string, n: number) {
  const d = new Date(key + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return dayKey(d)
}

export default function WeeklyPanel() {
  const { version } = useTimer()
  const today = dayKey(new Date())
  const [end, setEnd] = useState(today)
  const [days, setDays] = useState<Day[]>([])
  const [habitCount, setHabitCount] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!end) return
    let stale = false
    ;(async () => {
      const last = new Date(end + 'T00:00:00')
      const from = new Date(last)
      from.setDate(from.getDate() - 6)
      const to = new Date(last)
      to.setDate(to.getDate() + 1)
      const [s, c, h] = await Promise.all([
        supabase.from('sessions').select('duration_sec,created_at').eq('kind', 'focus').gte('created_at', from.toISOString()).lt('created_at', to.toISOString()),
        supabase.from('habit_checks').select('day').gte('day', dayKey(from)).lte('day', end),
        supabase.from('habits').select('id', { count: 'exact', head: true }),
      ])
      if (stale) return
      const err = s.error ?? c.error ?? h.error
      if (err) return setError(err.message)
      setError('')
      setHabitCount(h.count ?? 0)
      setDays(
        Array.from({ length: 7 }, (_, i) => {
          const d = new Date(from)
          d.setDate(from.getDate() + i)
          const key = dayKey(d)
          return {
            key,
            label: d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }),
            focusMin: Math.round((s.data ?? []).filter((r) => dayKey(new Date(r.created_at)) === key).reduce((a, r) => a + r.duration_sec, 0) / 60),
            done: (c.data ?? []).filter((r) => r.day === key).length,
          }
        }),
      )
    })()
    return () => { stale = true }
  }, [version, end])

  const maxMin = Math.max(30, ...days.map((d) => d.focusMin))
  const totalMin = days.reduce((a, d) => a + d.focusMin, 0)
  const next = shift(end, 7)

  return (
    <>
      <h2 className="text-2xl">Last 7 days</h2>
      {error && <p role="alert" className="mt-2 text-bad">{error}</p>}
      <p className="text-muted">{totalMin} minutes focused this week.</p>
      <table className="mt-3 w-full flex-1 text-left">
        <caption className="sr-only">Focus minutes and habits completed per day</caption>
        <thead>
          <tr><th scope="col">Day</th><th scope="col">Focus</th><th scope="col" className="text-right">Habits</th></tr>
        </thead>
        <tbody>
          {days.map((d) => (
            <tr key={d.key}>
              <th scope="row" className="pr-3 font-medium">{d.label}</th>
              <td className="w-1/2">
                <div className="flex items-center gap-2">
                  <div className="bar" style={{ width: `${(d.focusMin / maxMin) * 100}%`, minWidth: d.focusMin ? 4 : 0 }} aria-hidden="true" />
                  <span>{d.focusMin} min</span>
                </div>
              </td>
              <td className="text-right">{d.done}/{habitCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button className="btn btn-sm" onClick={() => setEnd(shift(end, -7))}>Previous week</button>
        <label className="mx-auto flex items-center gap-2 text-muted">
          Pick date
          <input type="date" value={end} max={today} onChange={(e) => e.target.value && setEnd(e.target.value)} />
        </label>
        <button className="btn btn-sm" disabled={end === today} onClick={() => setEnd(today)}>Today</button>
        <button className="btn btn-sm" disabled={end >= today} onClick={() => setEnd(next > today ? today : next)}>Next week</button>
      </div>
    </>
  )
}