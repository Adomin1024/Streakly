import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import Avatar, { COLORS, useProfile } from '../components/Avatar'
import ConfirmDialog from '../components/ConfirmDialog'
import { RULES, STRENGTH, level } from '../lib/password'

function shrink(file: File): Promise<string> {
  return new Promise((ok, no) => {
    const img = new Image()
    img.onload = () => {
      const s = Math.min(img.width, img.height), n = 72
      const c = document.createElement('canvas')
      c.width = c.height = n
      c.getContext('2d')!.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, n, n)
      ok(c.toDataURL('image/jpeg', 0.7))
    }
    img.onerror = () => no(new Error('Could not read that image.'))
    img.src = URL.createObjectURL(file)
  })
}

export default function Profile() {
  const { session } = useAuth()
  const p = useProfile()
  const navigate = useNavigate()
  const file = useRef<HTMLInputElement>(null)
  const [f, setF] = useState({ username: p.username, bio: p.bio, goal: String(p.goal), color: p.color, photo: p.photo ?? '' })
  const [pw, setPw] = useState('')
  const [curPw, setCurPw] = useState('')
  const [confirming, setConfirming] = useState<'pw' | 'out' | null>(null)
  const [busy, setBusy] = useState(false)
  const [show, setShow] = useState(false)
  const met = RULES.map((r) => r.test(pw, p.email))
  const lv = level(met.filter(Boolean).length)
  const [msg, setMsg] = useState({ text: '', ok: false, where: '' })
  const say = (where: string, text: string, ok = false) => setMsg({ text, ok, where })
  useEffect(() => { setF({ username: p.username, bio: p.bio, goal: String(p.goal), color: p.color, photo: p.photo ?? '' }) }, [session?.user.updated_at]) // eslint-disable-line

  async function save(e: FormEvent) {
    e.preventDefault()
    const name = f.username.trim()
    const goal = Math.round(Number(f.goal))
    if (name && (name.length < 2 || name.length > 24)) return say('p', 'Username needs 2 to 24 characters.')
    if (!(goal >= 10 && goal <= 600)) return say('p', 'Daily goal must be between 10 and 600 minutes.')
    const { error } = await supabase.auth.updateUser({ data: { username: name, bio: f.bio.trim(), goal, avatar_color: f.color, avatar_url: f.photo } })
    say('p', error ? error.message : 'Profile saved.', !error)
  }
  async function pick(files: FileList | null) {
    if (!files?.[0]) return
    try { setF({ ...f, photo: await shrink(files[0]) }) } catch (e) { say('p', (e as Error).message) }
  }
  // Step 1: validate, then ask for confirmation.
  function askChangePw(e: FormEvent) {
    e.preventDefault()
    if (!curPw) return say('w', 'Enter your current password.')
    const bad = RULES.find((r) => !r.test(pw, p.email))
    if (bad) return say('w', `Password needs: ${bad.label.toLowerCase()}.`)
    if (pw === curPw) return say('w', 'New password must be different from your current one.')
    say('w', '')
    setConfirming('pw')
  }
  // Step 2: runs only after the user confirms.
  async function changePw() {
    setBusy(true)
    const { error: authErr } = await supabase.auth.signInWithPassword({ email: p.email, password: curPw })
    if (authErr) {
      setBusy(false)
      setConfirming(null)
      return say('w', 'Current password is incorrect.')
    }
    const { error } = await supabase.auth.updateUser({ password: pw })
    setBusy(false)
    setConfirming(null)
    say('w', error ? error.message : 'Password updated.', !error)
    if (!error) { setPw(''); setCurPw('') }
  }
  async function signOut() {
    setBusy(true)
    const { error } = await supabase.auth.signOut()
    setBusy(false)
    setConfirming(null)
    if (error) return say('s', error.message)
    navigate({ to: '/' })
  }

  const joined = session?.user.created_at ? new Date(session.user.created_at).toLocaleDateString([], { dateStyle: 'long' }) : ''
  const preview = { ...p, photo: f.photo || undefined }
  return (
    <>
      <h1 className="mb-6">Profile</h1>
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="panel flex flex-col items-center text-center">
          <span className="avatar xl" style={{ background: `linear-gradient(135deg, ${f.color})` }}>
            {f.photo ? <img src={f.photo} alt="Your profile" /> : (f.username || preview.name).charAt(0).toUpperCase()}
          </span>
          <h2 className="mt-5 break-all text-lg">{f.username.trim() || preview.name}</h2>
          <p className="break-all text-sm text-muted">{p.email}</p>
          {joined && <p className="mt-1 text-sm text-muted">Joined {joined}</p>}
          {f.bio && <p className="mt-3 text-sm">{f.bio}</p>}
          <div className="mt-5 flex flex-wrap justify-center gap-1">
            <button type="button" className="btn btn-sm" onClick={() => file.current?.click()}>Upload photo</button>
            {f.photo && <button type="button" className="btn btn-sm" onClick={() => setF({ ...f, photo: '' })}>Remove</button>}
            <input ref={file} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files)} />
          </div>
          <div className="mt-3 flex flex-wrap justify-center gap-2" role="group" aria-label="Avatar color">
            {COLORS.map((c) => <button key={c} type="button" aria-label={`Color ${c}`} aria-pressed={f.color === c} className="swatch" style={{ background: `linear-gradient(135deg, ${c})` }} onClick={() => setF({ ...f, color: c })} />)}
          </div>
        </section>

        <section className="panel lg:col-span-2">
          <h2 className="text-xl">Edit profile</h2>
          <form onSubmit={save} className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block font-semibold">Username
              <input className="input" maxLength={24} placeholder={p.email.split('@')[0]} value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} />
            </label>
            <label className="block font-semibold">Daily focus goal (min)
              <input className="input" type="number" min={10} max={600} value={f.goal} onChange={(e) => setF({ ...f, goal: e.target.value })} />
            </label>
            <label className="block font-semibold sm:col-span-2">Bio
              <textarea className="input" rows={3} maxLength={140} placeholder="What are you working on?" value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} />
            </label>
            <div className="flex items-center gap-3 sm:col-span-2">
              <button className="btn btn-yel">Save profile</button>
              <p role="alert" className={msg.where === 'p' && msg.ok ? 'text-good' : 'text-bad'}>{msg.where === 'p' ? msg.text : ''}</p>
            </div>
          </form>
        </section>

        <section className="panel lg:col-span-2">
          <h2 className="text-xl">Change password</h2>
          <form onSubmit={askChangePw} className="mt-3">
            {/* Lets password managers attach the new password to the right account */}
            <input type="email" autoComplete="username" value={p.email} readOnly tabIndex={-1} aria-hidden="true" className="sr-only" />
            <label className="mb-2 block">
              <span className="sr-only">Current password</span>
              <input type={show ? 'text' : 'password'} autoComplete="current-password" placeholder="Current password" value={curPw} onChange={(e) => { setCurPw(e.target.value); if (msg.where === 'w') say('w', '') }} className="input" />
            </label>
            <div className="flex flex-wrap items-center gap-1">
              <label className="min-w-56 flex-1"><span className="sr-only">New password</span>
                <input type={show ? 'text' : 'password'} autoComplete="new-password" placeholder="New password" value={pw} onChange={(e) => { setPw(e.target.value); if (msg.where === 'w') say('w', '') }} className="input" />
              </label>
              <button type="button" className="btn btn-sm" aria-pressed={show} aria-label={show ? 'Hide password' : 'Show password'} title={show ? 'Hide password' : 'Show password'} onClick={() => setShow(!show)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                  <circle cx="12" cy="12" r="3" />
                  {!show && <path d="M3 3l18 18" />}
                </svg>
              </button>
              <button className="btn" disabled={!curPw || !met.every(Boolean)}>Update password</button>
            </div>
            <div className="meter" data-l={lv} aria-hidden="true"><i /><i /><i /><i /></div>
            <p className="my-1 text-muted">Strength: {STRENGTH[lv]}</p>
            <ul className="rules">
              {RULES.map((r, i) => (
                <li key={r.label} className={met[i] ? 'ok' : ''}>{r.label}<span className="sr-only">{met[i] ? ' (met)' : ' (not met)'}</span></li>
              ))}
            </ul>
          </form>
          <p role="alert" className={`mt-2 min-h-6 ${msg.where === 'w' && msg.ok ? 'text-good' : 'text-bad'}`}>{msg.where === 'w' ? msg.text : ''}</p>
        </section>

        <section className="panel flex flex-col items-start justify-between gap-3">
          <div><h2 className="text-xl">Session</h2><p className="mt-1 text-muted">Signed in as {p.email}</p></div>
          <button type="button" className="btn btn-danger" onClick={() => setConfirming('out')}>Sign out</button>
          <p role="alert" className="text-bad">{msg.where === 's' ? msg.text : ''}</p>
        </section>
      </div>

      <ConfirmDialog
        open={confirming === 'pw'}
        title="Update your password?"
        confirmLabel="Yes, update"
        busy={busy}
        onConfirm={changePw}
        onCancel={() => setConfirming(null)}
      >
        Your password will be changed right away. Use the new one the next time you sign in.
      </ConfirmDialog>
      <ConfirmDialog
        open={confirming === 'out'}
        title="Sign out?"
        confirmLabel="Sign out"
        danger
        busy={busy}
        onConfirm={signOut}
        onCancel={() => setConfirming(null)}
      >
        You will need to sign in again to see your timer, habits and weekly stats.
      </ConfirmDialog>
    </>
  )
}
