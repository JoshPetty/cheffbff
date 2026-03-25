# /auth — Authentication

Email/password auth via Supabase. Three routes:

- `/auth/login` — sign in, redirects to `?redirectTo` param after success
- `/auth/signup` — create account, sends confirmation email
- `/auth/callback` — handles email confirmation link redirect from Supabase

## Shared styles
`styles.ts` — shared style object used by both login and signup pages.

## Flow
1. User signs up → Supabase sends confirmation email
2. User clicks link → hits `/auth/callback` → session created → redirected to `/`
3. Session cookie refreshed on every request via `proxy.ts` (project root)
4. Protected routes (`/recipes/new`, `/profile`) redirect to `/auth/login` if no session

## Env vars needed
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=