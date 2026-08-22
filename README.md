# Matchr Frontend

Next.js (App Router) + Tailwind dashboard for the Matchr career copilot.

## Surfaces

| Route | Purpose |
| :--- | :--- |
| `/` | LinkedIn connect + resume upload |
| `/jobs` | Ranked live matches + Fit Scorecard |
| `/growth` | Skill-gap plan (courses, YouTube, certs) |
| `/networking` | Top compatible events |
| `/outreach` | Gmail cold-email compose with AI draft |
| `/dossier` | Tailored resume / cover letter export |

Talks to the Backend at `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`).

## Run

```bash
cp .env.example .env.local
npm install
npm run dev
```

App: http://localhost:3000
