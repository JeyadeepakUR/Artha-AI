# Artha AI - Personal Finance Copilot

Artha AI is a Next.js 16 App Router MVP for practical personal-finance planning.
It combines:

- Secure Supabase auth (email/password + Google OAuth)
- Profile-driven finance calculations (health score + FIRE plan)
- Scenario simulation with save/apply behavior
- AI mentor chat via OpenRouter (with deterministic fallback)
- SQLite persistence via Prisma 7

## What This Project Does

The app is designed for real user profiles (not only mock/demo data):

- Onboarding captures core financial inputs.
- Dashboard surfaces health score, risk signals, and AI forecast summary.
- Plan shows retirement projection + SIP guidance + allocation.
- Simulate runs what-if changes and can either:
	- Save scenario history only, or
	- Apply changes to the live profile (except temporary shocks).
- Chat gives finance mentoring using recent context and budget constraints.
- Profile is an editable money hub with local snapshot/history views.

## Tech Stack

- Framework: Next.js 16, React 19, TypeScript
- Styling: Tailwind CSS 4
- State: Zustand (persisted store)
- Auth: Supabase (`@supabase/ssr`, `@supabase/supabase-js`)
- Database: Prisma 7 + SQLite (`@prisma/adapter-better-sqlite3`)
- AI: OpenRouter-compatible chat completions
- Markdown rendering: `react-markdown`, `remark-gfm`, `rehype-sanitize`
- Icons: Lucide React

## App Flow

1. `/` checks server session and redirects:
	 - Authenticated -> `/dashboard`
	 - Unauthenticated -> `/splash`
2. `/splash` routes to signup/login (or optional demo mode).
3. Middleware protects product routes:
	 - `/dashboard`, `/plan`, `/simulate`, `/chat`, `/profile`, `/insights`, `/onboarding`
4. `AuthHydrator` syncs Supabase session to local Zustand state and fetches profile.
5. APIs always resolve user identity from Supabase session (email in JWT/session), not from client-passed email.

## Project Structure

```
app/
	auth/
		login/page.tsx
		signup/page.tsx
		callback/route.ts
	dashboard/page.tsx
	plan/page.tsx
	simulate/page.tsx
	chat/page.tsx
	profile/page.tsx
	onboarding/page.tsx
	splash/page.tsx
	api/
		profile/route.ts
		chat/route.ts
		insights/summary/route.ts
		calculate/
			health-score/route.ts
			fire-plan/route.ts
			scenario/route.ts
components/
	Layout.tsx
	AuthHydrator.tsx
lib/
	finance/
	store.ts
	db.ts
	supabase/
prisma/
	schema.prisma
	migrations/
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill values.

### Required

- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`)

### Optional but recommended

- `OPENROUTER_API_KEY`
- `OPENROUTER_BASE_URL` (default: `https://openrouter.ai/api/v1`)
- `OPENROUTER_MODELS` (comma-separated model chain)
- `APP_BASE_URL` (default local fallback: `http://localhost:3000`)

### Optional for local recording mode (Ollama)

- `OLLAMA_ENABLED` (`true` or `false`)
- `OLLAMA_PREFERRED` (`true` => Ollama first, `false` => hosted LLM first)
- `OLLAMA_BASE_URL` (default: `http://127.0.0.1:11434`)
- `OLLAMA_MODEL` (must exist locally, for example `codestral:latest`)

## Database Setup (Prisma + SQLite)

This project is configured for SQLite (see Prisma schema + migration lock).

1. Set `DATABASE_URL` in `.env.local`.
2. Generate Prisma client:

```bash
npx prisma generate
```

3. Apply migrations:

```bash
npx prisma migrate deploy
```

For local development from scratch, `npx prisma migrate dev` is also fine.

## Supabase Setup

1. Create a Supabase project.
2. Add URL + anon key to `.env.local`.
3. In Authentication providers, enable:
	 - Email/Password
	 - Google (if you want OAuth login)
4. Ensure redirect URL includes:
	 - `http://localhost:3000/auth/callback`

### Note on signup verification flow

Signup UI attempts to reduce friction:

- If signup returns a session, user goes directly to onboarding.
- If no session is returned, app attempts immediate password sign-in.
- If still no session, user is redirected to login with a notice.

Actual verification policy still depends on Supabase project auth settings.

## Install and Run

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Recording vs Deploy AI Mode

### Video recording mode (local Ollama first)

Set:

```bash
OLLAMA_ENABLED=true
OLLAMA_PREFERRED=true
```

### Deployment mode (hosted LLM first, no Ollama dependency)

Set:

```bash
OLLAMA_ENABLED=false
OLLAMA_PREFERRED=false
```

This allows recording continuity on local hardware while keeping cloud deployment reviewer-friendly.

## Scripts

- `npm run dev` - Start dev server
- `npm run build` - Production build
- `npm run start` - Run production server
- `npm run lint` - ESLint

## API Endpoints

### Profile

- `GET /api/profile`
	- Fetch authenticated user profile
- `POST /api/profile`
	- Upsert profile
	- Recalculate and persist health score + FIRE plan

### Chat

- `GET /api/chat`
	- Fetch chat history for authenticated user
- `POST /api/chat`
	- Save user message
	- Try OpenRouter model chain
	- If unavailable/invalid, fallback to deterministic mentor logic
	- Enforces hard budget constraint handling in fallback path

### AI Dashboard Summary

- `GET /api/insights/summary`
	- Generates AI summary/opportunities/risks + projections
	- Falls back to deterministic summary if AI is unavailable

### Pure Calculation APIs

- `POST /api/calculate/health-score`
- `POST /api/calculate/fire-plan`
- `POST /api/calculate/scenario`
- `GET /api/calculate/scenario?scenarios=true`

## Persistence Model

### Server-side persisted

- User profile (`UserProfile`)
- Financial plan (`FinancialPlan`)
- Chat history (`ChatMessage`)

### Client-side persisted (Zustand local storage)

- Session-linked UI state
- Scenario history table
- Profile snapshots table

Important: scenario history/snapshots currently live in client persistence, not dedicated DB tables.

## Security + Identity Notes

- Route guards are enforced in middleware using Supabase user session.
- API user identity is derived server-side from session (`supabase.auth.getUser()`).
- Client does not choose target user by arbitrary email for protected APIs.
- Chat markdown is sanitized on render.

## Product Behavior Notes

- Temporary shock scenarios (with `durationMonths`) cannot be applied to live profile; save-only mode is enforced.
- Top bar is simplified to a single logout action.
- Demo mode exists for quick evaluation but real auth/profile flow is primary.

## Troubleshooting

### `Missing environment variable` errors

- Check `.env.local` values and restart dev server.

### Prisma runtime/database issues

- Ensure `DATABASE_URL` is present.
- Run:

```bash
npx prisma generate
npx prisma migrate deploy
```

### Auth redirects looping

- Verify Supabase URL/keys and callback URL configuration.
- Confirm middleware is active and session cookies are set.

### AI responses missing/failing

- Set `OPENROUTER_API_KEY`.
- Verify model IDs in `OPENROUTER_MODELS`.
- Without valid AI config, deterministic fallback responses are used.

## Current Limitations

- Scenario history and snapshots are not yet persisted to server DB.
- No dedicated automated test suite is currently configured.
- Insights and mentor quality depend on profile completeness and AI model availability.

## Suggested Next Upgrades

1. Persist scenario history/snapshots in Prisma models.
2. Add unit tests for finance engines + API route tests.
3. Add end-to-end tests for auth and onboarding flows.
4. Add explicit rate-limit and retry UX for AI endpoints.
5. Add richer audit trail/versioning for profile changes.
