# Swipe

A real-time multiplayer voting app — create a room, add ideas, swipe to vote, get a winner.

## Features

- **Room-based sessions** — create or join a room with a 6-character code
- **Two idea modes** — everyone submits ideas, or the host provides a predefined list
- **Swipe voting** — like or pass on each suggestion
- **Wheel of Fortune** — randomly pick a winner instead of voting
- **Tiebreaker** — automatic tiebreaker round when scores are tied
- **Anonymous voting** — optionally hide who suggested what
- **Saved ideas** — logged-in users can save ideas to a personal library with categories
- **Room history** — review past sessions and save winners to your idea library
- **Feedback system** — in-app bug reports and feature requests
- **Bilingual** — English and Polish

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Auth | Clerk |
| Database & Realtime | Supabase (PostgreSQL + Realtime) |
| State / Data Fetching | TanStack React Query 5 |
| Styling | Tailwind CSS 4 |
| UI Components | shadcn/ui (Radix UI) |
| Animation | Framer Motion |
| Email | Resend |

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd swipe
npm install
```

### 2. Environment variables

Create a `.env.local` file in the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# Resend (for in-app feedback emails)
RESEND_API_KEY=re_...
```

**Where to get these:**
- **Supabase** — [supabase.com](https://supabase.com) → Project Settings → API
- **Clerk** — [clerk.com](https://clerk.com) → API Keys
- **Resend** — [resend.com](https://resend.com) → API Keys (free tier: 100 emails/day)

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/
│   ├── api/                  # Route handlers
│   │   ├── rooms/            # Room creation, joining, phases, voting
│   │   ├── user/             # Profile, saved ideas, categories, history
│   │   └── feedback/         # Feedback email handler
│   ├── room/[code]/
│   │   └── phases/           # Lobby → Submitting → Voting/Wheel → Results
│   ├── profile/              # User profile and saved ideas management
│   ├── history/              # Past room sessions
│   └── page.tsx              # Home (create / join)
├── components/
│   ├── ui/                   # shadcn base components
│   ├── Providers.tsx         # App-wide providers
│   ├── SavedIdeasPicker.tsx  # Reusable saved-ideas selector
│   ├── SettingsButton.tsx    # Language settings modal
│   └── FeedbackButton.tsx    # Feedback modal
├── lib/
│   ├── api.ts                # Typed API client
│   ├── supabase.ts           # Browser Supabase client
│   ├── supabaseAdmin.ts      # Server-only admin client
│   ├── queryKeys.ts          # React Query key factory
│   ├── session.ts            # Room session token management
│   └── feedback.ts           # Shared feedback type constants
└── i18n/
    ├── translations.ts       # EN / PL strings
    └── LanguageContext.tsx   # Language provider and hook
```

## Production Deployments

After pushing a new build to production, run the following SQL in Supabase to notify PWA clients of the update. Users will automatically reload the app the next time they focus it.

```sql
update app_version set released_at = now() where id = 1;
```

> The `app_version` table holds a single row. The app polls this value on window focus and force-reloads if it has changed since the session started.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
