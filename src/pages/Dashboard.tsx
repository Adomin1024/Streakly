import Overview from '../components/Overview'

export default function Dashboard() {
  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <h1 className="mr-auto">Dashboard</h1>
      </div>
      <Overview />
    </>
  )
}