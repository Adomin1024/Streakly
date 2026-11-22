import HabitsPanel from '../components/HabitsPanel'
import { HabitRing, WeekChart } from '../components/Overview'

export default function Habits() {
  return (
    <>
      <h1 className="mb-6">Habits</h1>
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="panel flex flex-col lg:col-span-2"><HabitsPanel /></section>
        <div className="grid content-start gap-6">
          <section className="panel"><HabitRing /></section>
          <section className="panel"><WeekChart /></section>
        </div>
      </div>
    </>
  )
}
