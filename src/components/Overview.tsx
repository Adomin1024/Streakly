import { useStats } from '../lib/stats'
import { useTimer } from '../lib/timer'
import { useProfile } from './Avatar'
import Ring from './Ring'

export function GoalRing() {
  const { rows } = useTimer()
  const { goal } = useProfile()
  const min = Math.round(rows.filter((r) => r.kind === 'focus').reduce((a, r) => a + r.duration_sec, 0) / 60)
  return (
    <>
      <h2 className="text-xl">Daily goal</h2>
      <div className="mt-4 flex justify-center"><Ring value={min} max={goal} label={`${Math.min(100, Math.round((min / goal) * 100))}%`} sub={`${min} / ${goal} min`} /></div>
      <p className="mt-3 text-center text-muted">{min >= goal ? 'Goal reached for today.' : `${goal - min} min left to hit your goal.`}</p>
    </>
  )
}

export function HabitRing() {
  const s = useStats()
  return (
    <>
      <h2 className="text-xl">Habits today</h2>
      <div className="mt-4 flex justify-center"><Ring value={s.done} max={s.habits} color="#ffc233" label={`${s.done}/${s.habits}`} sub="done" /></div>
      <p className="mt-3 text-center text-muted">{s.habits === 0 ? 'Add a habit to start tracking.' : s.done === s.habits ? 'Every habit checked off.' : `${s.habits - s.done} still to go.`}</p>
    </>
  )
}

export function WeekChart() {
  const s = useStats()
  const max = Math.max(30, ...s.week.map((d) => d.min))
  const total = s.week.reduce((a, d) => a + d.min, 0)
  const best = s.week.reduce((a, d) => (d.min > a.min ? d : a), { label: '-', min: 0 })
  return (
    <>
      <h2 className="text-xl">This week</h2>
      <p className="text-muted">{total} min total{best.min ? `, best day ${best.label} (${best.min} min)` : ''}</p>
      <div className="chart">
        {s.week.map((d, i) => (
          <div className="col" key={i}><i style={{ height: `${(d.min / max) * 100}%`, animationDelay: `${i * 60}ms` }} title={`${d.min} min`} /><span>{d.label}</span></div>
        ))}
      </div>
    </>
  )
}

const RANKS = ['Newcomer', 'Apprentice', 'Steady', 'Focused', 'Deep worker', 'Master']
export function LevelCard() {
  const { total, streak, best } = useStats()
  const lv = Math.floor(Math.sqrt(total / 20)) + 1
  const lo = (lv - 1) ** 2 * 20, hi = lv ** 2 * 20
  return (
    <>
      <h2 className="text-xl">Level {lv}</h2>
      <p className="text-muted">{RANKS[Math.min(lv - 1, RANKS.length - 1)]}</p>
      <div className="xp" aria-hidden="true"><i style={{ width: `${((total - lo) / (hi - lo)) * 100}%` }} /></div>
      <p className="mt-2 text-sm text-muted">{hi - total} min to level {lv + 1}</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="mini"><b>{streak}</b>day streak</div>
        <div className="mini"><b>{best}</b>best streak</div>
      </div>
    </>
  )
}

export function Heatmap() {
  const { heat, total } = useStats()
  if (!heat.length) return null
  const pad = new Date(heat[0].key + 'T12:00').getDay()
  const lvl = (m: number) => (m === 0 ? 0 : m < 25 ? 1 : m < 50 ? 2 : m < 100 ? 3 : 4)
  return (
    <>
      <h2 className="text-xl">Last 12 weeks</h2>
      <p className="text-muted">{total} min focused. Darker means a longer day.</p>
      <div className="heat">
        {Array.from({ length: pad }, (_, i) => <b key={`p${i}`} />)}
        {heat.map((d) => <i key={d.key} data-l={lvl(d.min)} title={`${d.key}: ${d.min} min`} />)}
      </div>
    </>
  )
}

export default function Overview() {
  return (
    <div className="mb-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <section className="panel"><GoalRing /></section>
      <section className="panel"><HabitRing /></section>
      <section className="panel sm:col-span-2"><LevelCard /></section>
      <section className="panel sm:col-span-2"><WeekChart /></section>
      <section className="panel sm:col-span-2"><Heatmap /></section>
    </div>
  )
}
