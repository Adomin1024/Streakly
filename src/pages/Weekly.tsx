import WeeklyPanel from '../components/WeeklyPanel'
import { GoalRing, HabitRing, WeekChart } from '../components/Overview'

export default function Weekly() {
  return (
    <>
      <h1 className="mb-6">Week</h1>
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="panel flex flex-col lg:col-span-2"><WeeklyPanel /></section>
        <div className="grid grid-cols-2 grid-rows-[auto_1fr] gap-6">
          <section className="panel col-span-2"><WeekChart /></section>
          <section className="panel"><GoalRing /></section>
          <section className="panel"><HabitRing /></section>
        </div>
      </div>
    </>
  )
}