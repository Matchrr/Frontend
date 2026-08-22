# Matchr Frontend

Next.js 16 (App Router) + Tailwind 4 dashboard for the Matchr career copilot.

## Run

```bash
npm run dev
```

App: http://localhost:3000. Requires the Backend running on port 4000 — set
`NEXT_PUBLIC_API_URL` in `.env.local` to point elsewhere.

## Surfaces

| Route | Purpose |
| :--- | :--- |
| `/` | Dashboard: pipeline funnel, fit curve, activity feed, and the next action |
| `/profile` | Ground Truth Profile: LinkedIn connect, resume upload, career goal |
| `/jobs` | Ranked live matches with Fit Scorecards and target selection |
| `/growth` | Skill-gap plan with ranked course / cert / video / docs packs |
| `/networking` | Compatible events with a "why this event" note |
| `/dossier` | Per-role tailored bullets, cover letter, and ATS answers |
| `/outreach` | Grounded cold-email draft, edit, and approval-gated send |

Every surface is gated on a grounded profile and shows an empty state that routes back to
onboarding, because nothing downstream is meaningful without verified facts.

## Structure

- `lib/api.ts` — typed client for the whole backend surface. Throws `ApiError` with the
  server's `detail` message so pages can render real errors rather than "something went wrong".
- `lib/useAsync.ts` — small fetch hook. Takes a string `key` instead of a dependency array so
  the dependency list stays a literal, which the React Compiler lint rules require.
- `lib/nav.ts` — the navigation graph, declared once and consumed by the sidebar, the topbar
  breadcrumb, and the ⌘K command palette.
- `components/ProfileProvider.tsx` — shares the candidate and the dashboard aggregate across
  pages, so the shell and every surface read one `/api/overview` response.
- `components/AppShell.tsx` — sidebar, topbar, mobile drawer, and the command palette host.

## Design system

Everything imports from `@/components/ui`.

| Module | Contents |
| :--- | :--- |
| `primitives.tsx` | `Card`, `Button`, `Badge`, `IconTile`, `SegmentedTabs`, `fieldClass` |
| `motion.tsx` | `Reveal`, `Stagger`, `CountUp` — CSS entrance animations, no runtime library |
| `charts.tsx` | `AreaChart`, `TickMeter`, `ProgressRow`, `ScoreRing`, `BarGroup` — hand-rolled SVG |
| `feedback.tsx` | `EmptyState`, `ErrorNote`, `Callout`, `Skeleton` |
| `patterns.tsx` | `PageHeader`, `SectionHeader`, `StatCard`, `Stat`, `Timeline` |

Tokens — the brand scale, surface colors, shadows, and keyframes — live in `app/globals.css`
under `@theme` (Tailwind 4 is configured in CSS, there is no `tailwind.config`). A single
`prefers-reduced-motion` block disables every entrance animation, so components never need to
check it themselves.

Charts are hand-rolled rather than pulled from a charting library: each one is a handful of
shapes, and drawing them directly is what keeps the left-to-right wipe, the axis styling, and
the crosshair consistent across surfaces.

## Checks

```bash
npx tsc --noEmit   # types
npx eslint .       # lint
npx next build     # production build
```
