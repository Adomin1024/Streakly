import { useAuth } from '../lib/auth'

export const COLORS = ['#ffb347,#ff6fb1', '#3de8d0,#7c5cff', '#a78bfa,#f472b6', '#facc15,#fb923c', '#34d399,#22d3ee', '#f87171,#fb7185']

export function useProfile() {
  const { session } = useAuth()
  const m = (session?.user.user_metadata ?? {}) as Record<string, string | number | undefined>
  const email = session?.user.email ?? ''
  return {
    email,
    name: (m.username as string) || email.split('@')[0],
    username: (m.username as string) ?? '',
    bio: (m.bio as string) ?? '',
    goal: Number(m.goal) || 100,
    photo: m.avatar_url as string | undefined,
    color: (m.avatar_color as string) || COLORS[0],
  }
}

export default function Avatar({ size = 30, className = '' }: { size?: number; className?: string }) {
  const p = useProfile()
  const style = { width: size, height: size, fontSize: size * 0.42, background: `linear-gradient(135deg, ${p.color})` }
  return (
    <span className={`avatar ${className}`} style={style}>
      {p.photo ? <img src={p.photo} alt="" /> : p.name.charAt(0).toUpperCase()}
    </span>
  )
}
