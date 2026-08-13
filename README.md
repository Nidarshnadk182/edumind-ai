# EduMind AI

A generative AI learning companion that identifies each student's learning gaps and creates personalised educational content — explanations, notes, quizzes, and flashcards — to close them.

Built as an academic full-stack demonstration project by **Ankith S**, **Hiteishi A**, and **Nidarshna DK**.

---

## Product overview

EduMind AI captures a student's learning and performance data, understands their doubts using natural-language processing, generates personalised study material, recommends what to learn next, and measures results to refine future recommendations — a closed loop across four stakeholder groups: **students, teachers, parents, and institutions**.

## Problem statement

Traditional learning-management systems classify students into tracks and route them to fixed content — the same video, the same quiz, regardless of what a student already understands. Personalisation stops at the recommendation; the content itself never adapts. EduMind AI generates the explanation, notes, and practice material fresh for each identified gap.

## Main features

- **AI tutor** — conversational doubt-solving with adjustable depth, language, and follow-ups
- **Notes generator** — from pasted text, a topic, or an uploaded file (mock extraction in this version)
- **Quiz generator** — MCQ, true/false, short-answer, and numerical questions with full explanations
- **Flashcard generator** — spaced-repetition flashcards with flip animation and difficulty tagging
- **Personalised learning path** — a transparent, rule-based sequence built from real gaps
- **Weak-topic detection** — strong / moderate / weak breakdown with one-tap next actions
- **AI study planner** — day-by-day plan around an exam date and available hours
- **Gamification** — XP, streaks, badges, and a self-comparison leaderboard (no unhealthy public ranking)
- **Teacher tools** — class management, content approval, and performance analytics
- **Parent dashboard** — progress visibility without access to private AI-tutor conversations
- **Institution dashboard** — aggregated, privacy-respecting analytics

## Technology stack

**Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, Lucide icons, Recharts, Framer Motion
**Backend:** Next.js API routes, Supabase (Auth, Postgres, Storage), Zod validation, an AI-provider abstraction (Anthropic Claude)
**Deployment:** GitHub, Vercel, Supabase

## Screenshots

_Add screenshots here after your first local run:_

| Landing page | Student dashboard | AI tutor |
|---|---|---|
| `docs/screenshots/landing.png` | `docs/screenshots/dashboard.png` | `docs/screenshots/ai-tutor.png` |

## Architecture overview

```
Browser (Next.js client components)
        │
        ▼
Next.js App Router — Server Components + API routes
        │
   ┌────┴─────┐
   ▼          ▼
Supabase    lib/ai/provider.ts
(Postgres,     │
 Auth, RLS)    ├── AnthropicProvider (server-only, real Claude API)
               └── DemoProvider (automatic fallback, no key needed)
```

- **`lib/ai/`** — provider abstraction; swap Anthropic for another vendor by editing one function
- **`lib/recommendations/`** — pure, transparent rule-based scoring engine (no route-handler coupling)
- **`lib/database/`** — Supabase clients (browser/server/service-role) + demo-mode mock data + quiz scoring
- **`lib/validations/`** — every Zod schema used across API routes, in one place
- **`lib/auth/`** — session + role-based access control helpers

## Database overview

See `supabase/migrations/` for the full schema (25 tables: profiles, student/teacher profiles, classes, subjects/topics, AI conversations, notes, quizzes, flashcards, learning progress, recommendations, study plans, achievements, and more) and `supabase/migrations/0004_row_level_security.sql` for row-level security policies. `supabase/seed.sql` contains realistic sample data for an MBA Finance student.

## Local installation

```bash
git clone <repository-url>
cd edumind-ai
npm install
cp .env.example .env.local
npm run dev
```

The app opens at `http://localhost:3000` and runs immediately in **demo mode** — no Supabase or Anthropic credentials required.

## Environment variable setup

Copy `.env.example` to `.env.local` and fill in real values when you're ready to connect live services:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-sonnet-4-6
DEMO_MODE=true
```

> ⚠️ **Security warning:** `SUPABASE_SERVICE_ROLE_KEY` and `ANTHROPIC_API_KEY` must never be prefixed with `NEXT_PUBLIC_`, committed to source control, or referenced from client components. Both are read only inside server-only files (see the `import 'server-only'` guards in `lib/database/supabase-server.ts` and `lib/ai/anthropic-provider.ts`).

## Supabase setup instructions

1. Create a project at [supabase.com](https://supabase.com).
2. Copy your Project URL and anon/public key into `.env.local`.
3. Copy your service role key into `SUPABASE_SERVICE_ROLE_KEY` (server-only).
4. Install the [Supabase CLI](https://supabase.com/docs/guides/cli) and link your project:
   ```bash
   supabase link --project-ref <your-project-ref>
   ```
5. Run migrations:
   ```bash
   supabase db push
   ```
6. Seed sample data (optional, for local development):
   ```bash
   supabase db reset
   ```

## AI API setup instructions

1. Get an API key from [console.anthropic.com](https://console.anthropic.com).
2. Set `ANTHROPIC_API_KEY` in `.env.local`.
3. Set `DEMO_MODE=false`.
4. Restart the dev server. The AI tutor, notes generator, quiz generator, and flashcard generator will now call the real Claude API via `lib/ai/anthropic-provider.ts`.

If no key is set (or `DEMO_MODE=true`), every AI feature automatically falls back to `lib/ai/demo-provider.ts`, which returns clearly-labelled mock responses — the whole app stays testable with zero paid services.

## How to run demo mode

Demo mode is the default. Just run `npm run dev` with an untouched `.env.local` (or none at all) and visit `/demo` for a guided tour of all four role dashboards without signing up.

## How to run tests

```bash
npm run test        # run once
npm run test:watch  # watch mode
```

Tests cover recommendation-score calculation, quiz scoring, role-based route configuration, form validation schemas, and AI fallback behaviour (see `tests/`).

## How to build for production

```bash
npm run build
npm run start
```

## How to deploy to Vercel

1. Push this repository to GitHub (see below).
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. In **Project Settings → Environment Variables**, add the same variables from `.env.example` with real values.
4. Deploy. Vercel builds and hosts the Next.js frontend and API routes.
5. Run your Supabase migrations against the production project (see above) before going live.
6. Visit the deployed URL and confirm `/demo` and `/login` both work.

## How to contribute

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Team

- Ankith S
- Hiteishi A
- Nidarshna DK

## License

[MIT](./LICENSE)

## Backend foundation added

See [BACKEND_SETUP.md](BACKEND_SETUP.md) for the GitHub, Vercel, Supabase, AI-provider, RAG, prediction, adaptive-test and messaging setup.
