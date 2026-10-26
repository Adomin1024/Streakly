import { useState } from 'react'
import { getTheme, setTheme, type Theme } from '../lib/theme'

export default function ThemeToggle() {
  const [t, setT] = useState<Theme>(getTheme())
  const pick = (v: Theme) => { setTheme(v); setT(v) }
  return (
    <>
      <h2 className="text-xl">Appearance</h2>
      <p className="mt-1 text-muted">Choose how the app looks. This is saved on this device.</p>
      <div className="mt-4 flex gap-2" role="group" aria-label="Theme">
        <button className={`btn ${t === 'dark' ? 'btn-yel' : ''}`} aria-pressed={t === 'dark'} onClick={() => pick('dark')}>Dark</button>
        <button className={`btn ${t === 'light' ? 'btn-yel' : ''}`} aria-pressed={t === 'light'} onClick={() => pick('light')}>Light</button>
      </div>
    </>
  )
}
