import TimerPanel from '../components/TimerPanel'
import LogPanel from '../components/LogPanel'
import { GoalRing, WeekChart } from '../components/Overview'

export default function Timer() {
  return (
    <>
      <h1 className="mb-6">Timer</h1>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <section className="panel"><TimerPanel /></section>
        <section className="panel"><LogPanel /></section>
        <section className="panel md:col-span-2 xl:col-span-1"><GoalRing /><div className="mt-6"><WeekChart /></div></section>
      </div>
    </>
  )
}
