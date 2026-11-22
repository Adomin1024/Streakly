import { useEffect } from 'react'
const K = 'focuslog.theme'
export type Theme = 'dark' | 'light'
export const getTheme = (): Theme => { try { return localStorage.getItem(K) === 'light' ? 'light' : 'dark' } catch { return 'dark' } }
export function setTheme(t: Theme) {
  try { localStorage.setItem(K, t) } catch { /* ignore */ }
  if (t === 'light') document.documentElement.dataset.theme = 'light'
  else delete document.documentElement.dataset.theme
}
/** Applies the saved theme inside the app only, so the landing page always stays dark. */
export function useAppTheme() {
  useEffect(() => { setTheme(getTheme()); return () => { delete document.documentElement.dataset.theme } }, [])
}
