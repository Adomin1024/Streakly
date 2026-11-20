# Streakly
 
Pomodoro timer + daily habit tracking with streaks, in a pixel-art theme.
Stack: React + TypeScript (Vite), TanStack Router, Tailwind CSS, Supabase (Auth, Postgres, RLS), WCAG 2.1 AA.
 
## Setup
1. `pnpm install`
2. Create a Supabase project, then run `supabase/schema.sql` in the SQL editor.
3. `cp .env.example .env` and fill in the project URL and anon key.
4. `pnpm dev`
## Pages
| Route | Page | Access |
| --- | --- | --- |
| `/` | Landing page | public |
| `/signin`, `/signup` | Email/password and Google auth (password strength meter on sign-up) | public |
| `/dashboard` | Timer, habits, weekly summary and today's log as panels you can reorder, resize and hide | signed in |
| `/timer`, `/habits`, `/weekly` | Each feature on its own page | signed in |
 
## Features
- Configurable Pomodoro timer; completed sessions are logged to Supabase. The countdown keeps running while you move between pages, plays a chime and shows a toast when a session ends.
- Daily habit checklist with streaks
- Weekly summary (focus minutes and habits per day)
- Dashboard layout (order, width, hidden panels) is remembered per user in `localStorage`
- Supabase Auth; every table is protected by Row Level Security (`user_id = auth.uid()`)
## Project layout
- `src/pages` route pages · `src/components` timer, habits, weekly and log panels
- `src/lib/timer.tsx` shared timer state · `src/lib/pixel.tsx` pixel-art sprites · `src/lib/password.ts` sign-up rules
- `src/index.css` theme tokens and the pixel component classes (`.btn`, `.panel`, `.input`, `.px-*`)
## Notes
- Sign-up enforces an 8+ character password with mixed case, number and symbol in the browser. To enforce the same server-side, set the matching password requirements in Supabase under Authentication, Providers, Email.
 