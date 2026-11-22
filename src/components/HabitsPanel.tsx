import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { supabase, dayKey, daysAgo } from '../lib/supabase'
import { useTimer } from '../lib/timer'

type Habit = { id: string; name: string }
type Check = { habit_id: string; day: string }

const PAGE_SIZE = 6 // habits per page: change this number to show more or fewer

function streak(days: Set<string>) {
  let n = 0
  let i = days.has(dayKey()) ? 0 : 1 // an unchecked today doesn't break the streak yet
  while (days.has(dayKey(daysAgo(i)))) { n++; i++ }
  return n
}

export default function HabitsPanel() {
  const { bump } = useTimer()
  const [habits, setHabits] = useState<Habit[]>([])
  const [checks, setChecks] = useState<Check[]>([])
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirming, setConfirming] = useState(false)
  const today = dayKey()

  const load = useCallback(async () => {
    const [h, c] = await Promise.all([
      supabase.from('habits').select('id,name').order('created_at'),
      supabase.from('habit_checks').select('habit_id,day').gte('day', dayKey(daysAgo(400))),
    ])
    const err = h.error ?? c.error
    if (err) setError(err.message)
    else { setHabits(h.data as Habit[]); setChecks(c.data as Check[]) }
    bump()
  }, [bump])
  useEffect(() => { load() }, [load])

  const pages = Math.max(1, Math.ceil(habits.length / PAGE_SIZE))
  const cur = Math.min(page, pages) // keeps the page valid after deleting
  const visible = habits.slice((cur - 1) * PAGE_SIZE, cur * PAGE_SIZE)

  async function add(e: FormEvent) {
    e.preventDefault()
    const v = name.trim()
    if (!v) return setError('Type a habit name first.')
    if (habits.some((h) => h.name.toLowerCase() === v.toLowerCase())) return setError('You already track that habit.')
    setError('')
    const { error } = await supabase.from('habits').insert({ name: v })
    if (error) return setError(error.message)
    setName('')
    setPage(Number.MAX_SAFE_INTEGER) // jump to the last page so the new habit is visible
    load()
  }

  async function toggle(h: Habit, done: boolean) {
    const { error } = done
      ? await supabase.from('habit_checks').delete().eq('habit_id', h.id).eq('day', today)
      : await supabase.from('habit_checks').insert({ habit_id: h.id, day: today })
    setError(error ? error.message : '')
    load()
  }

  function pick(id: string) {
    setSelected((prev) => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  function leaveSelect() {
    setSelectMode(false)
    setSelected(new Set())
    setConfirming(false)
  }

  async function removeSelected() {
    const ids = Array.from(selected)
    if (ids.length === 0) return
    const { error } = await supabase.from('habits').delete().in('id', ids)
    setError(error ? error.message : '')
    if (!error) leaveSelect()
    else setConfirming(false)
    load()
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="mr-auto text-2xl">Today’s habits</h2>
        {habits.length > 0 && (
          selectMode
            ? <button className="btn btn-sm" onClick={leaveSelect}>Cancel</button>
            : <button className="btn btn-sm" onClick={() => setSelectMode(true)}>Select</button>
        )}
      </div>

      {selectMode && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-muted">{selected.size} selected</span>
          {confirming ? (
            <>
              <button onClick={removeSelected} className="btn btn-sm btn-danger">Yes, delete {selected.size}</button>
              <button onClick={() => setConfirming(false)} className="btn btn-sm">Keep</button>
            </>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              disabled={selected.size === 0}
              className="btn btn-sm btn-danger"
            >
              Delete selected ({selected.size})
            </button>
          )}
        </div>
      )}
      
      {habits.length === 0 && <p className="mt-2 text-muted">No habits yet. Add one below.</p>}
      <ul style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {visible.map((h) => {
          const days = new Set(checks.filter((c) => c.habit_id === h.id).map((c) => c.day))
          const done = days.has(today)
          const s = streak(days)
          return (
            <li key={h.id} className="habit" style={{ flex: 1, maxHeight: 96 }}>
              <label className="flex flex-1 items-center gap-3">
                {selectMode ? (
                  <input type="checkbox" checked={selected.has(h.id)} onChange={() => pick(h.id)} aria-label={`Select ${h.name}`} />
                ) : (
                  <input type="checkbox" checked={done} onChange={() => toggle(h, done)} />
                )}
                <span className={done ? 'text-muted line-through' : ''}>{h.name}</span>
              </label>
              <span className={`font-bold ${s >= 7 ? 'text-orange-400' : s >= 3 ? 'text-gold' : ''}`}>{s} day{s === 1 ? '' : 's'}</span>
            </li>
          )
        })}
      </ul>

      {pages > 1 && (
        <div className="mt-3 flex items-center justify-center gap-3">
          <button className="btn btn-sm" disabled={cur === 1} onClick={() => setPage(cur - 1)}>Previous</button>
          <span className="text-muted">Page {cur} of {pages}</span>
          <button className="btn btn-sm" disabled={cur === pages} onClick={() => setPage(cur + 1)}>Next</button>
        </div>
      )}

      <form onSubmit={add} className="mt-4 flex items-center gap-2">
        <label className="flex-1">
          <span className="sr-only">New habit</span>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="New habit, e.g. Drink water" className="input" />
        </label>
        <button className="btn btn-yel">Add</button>
      </form>
      <p role="alert" className="mt-2 min-h-0 text-bad">{error}</p>
    </>
  )
}