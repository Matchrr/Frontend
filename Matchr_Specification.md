# Matchr — Agentic Career Copilot & Precision-Matching Engine

---

## 1. Executive Summary & Core Value Proposition

**Matchr** is an agentic career copilot and precision-matching engine designed to replace blind mass-applying with data-driven, high-relevance job targeting. Rather than acting as an automated "spam cannon" that blasts ATS systems with generic resumes, Matchr operates as an intelligent candidate advocate: it grounds the user's career profile, matches them against real-time live job postings using semantic vector similarity and LLM reranking, and produces hallucination-free, tailored application dossiers. Instead of nitpicking grammar, it recommends concrete upskilling resources aimed at the user's target role, and a **Networking** tab surfaces the most compatible events for their profile and goals. Native platform integrations (starting with **LinkedIn** and **Gmail**) remove profile busywork and let candidates run high-intent outreach from their own professional identity.

> ### 🎯 Core Philosophy: Quality Over Quantity
> 1. **High-precision vector matching** (Top 5–10 tailored fits instead of 500 spam apps)
> 2. **Hallucination-free resume tailoring** (Strict grounding in verified career history)
> 3. **Zero-CAPTCHA, unblockable candidate command center** (No brittle headless scrapers)
> 4. **Native professional integrations** (LinkedIn for instant profile grounding; Gmail for AI-assisted, user-approved cold outreach)
> 5. **Goal-directed growth, not generic critique** (Courses, certifications, and videos mapped to the user's target skills — not grammar nits)
> 6. **Precision networking** (Top compatible events for the user's profile and career goals, not an unfiltered meetup dump)

---

## 2. Sponsor Integration Matrix & Category Targets

| Sponsor | Specific Tool / API | Architecture Role | Target Category Prize |
| :--- | :--- | :--- | :--- |
| **SerpApi** | Google Jobs Engine API (+ event search) | Live, multi-platform job aggregation (LinkedIn, Indeed, Glassdoor) and live networking-event discovery via structured JSON without IP blocks. | Best AI App using SerpApi ($3,000) |
| **Nutrient / Foxit** | PDF SDK / Document API | Ingesting candidate PDFs and compiling tailored resumes/cover letters with high-fidelity formatting. | Best Document/eSign Agent ($1,000–$1,500) |
| **Kong** | Kong AI Gateway | Rate-limiting, prompt caching, and model fallback across OpenAI/Anthropic micro-agents. | API / Cloud Infrastructure Track |
| **Xano / Supabase** | Backend + pgvector | Storing structured job listings, candidate embeddings, match states, and application logs. | Best Backend / Data Track |
| **Name.com** | Domain Search & Provisioning API | Provisioning a live, personalized portfolio URL (e.g., `candidate.dev`) with the candidate's assets. | Best use of Name.com API ($2,000) |

---

## 3. End-to-End User Flow

1. **Connect, Upload & Audit:**
   - The candidate connects **LinkedIn** (OAuth) and/or uploads their existing resume PDF.
   - LinkedIn is the fast path: Matchr pulls headline, experience, skills, education, and summary so the user never has to fill out a profile from scratch.

2. **Analysis & Goal-Directed Growth Plan:**
   - **Agent 1** merges LinkedIn data and/or the uploaded document into structured career facts (skills, metrics, work history) plus stated or inferred career goals.
   - **Agent 2 (Career Growth Advisor)** does **not** dump generic resume nits (vague bullets, grammar, ATS boilerplate). It compares the grounded profile against the user's target role and returns a **skill-gap growth plan**: ranked target skills plus concrete resources that close each gap — courses, YouTube walkthroughs, certifications, docs, and other high-signal materials.
   - The dashboard presents this as an actionable learning path the user can follow while they apply, not a red-pen markup of their existing resume.

3. **Live Semantic Matching:**
   - **SerpApi** fetches live job postings matching the candidate's target title and location preferences.
   - **Supabase / pgvector** performs cosine similarity vector search against the resume embedding.
   - An **LLM Judge** reranks the top results and generates a *Fit Scorecard* for each job (Match %, Matching Skills, Missing Tech, Key Angle).

4. **Target Selection:**
   - The user selects 3–5 high-fit jobs from the dashboard.

5. **Dossier Generation:**
   - **Resume Tailor Agent:** Reorganizes bullet points and emphasizes matching keywords strictly without hallucinating unverified experience.
   - **Cover Letter Agent:** Uses RAG over candidate projects to draft a tailored narrative.
   - **ATS Q&A Assistant:** Pre-generates high-scoring answers to common screening questions (e.g., salary expectations, behavioral prompts).
   - **Nutrient / Foxit API:** Compiles and exports the tailored assets as clean PDFs.

6. **One-Click Application Dispatch:**
   - The candidate opens the direct application portal with their customized dossier ready to upload, or deploys a live personal portfolio via **Name.com**.

7. **Integrated Outreach (Gmail):**
   - After targeting a role, the candidate can draft and send a cold email from the platform via their connected **Gmail** account.
   - An outreach agent proposes a grounded draft (profile + job Fit Scorecard); the user edits and approves before anything is sent.

8. **Networking Tab:**
   - A dedicated **Networking** section matches the user to the **top most compatible live events** (meetups, conferences, workshops, office hours, industry mixers) using the same profile + career-goal embedding used for jobs.
   - Results are ranked by relevance to target role, skills being built, industry, and location/format — a short list of high-fit events, not an unfiltered calendar.

---

## 4. Platform Integrations

Matchr is designed as a connected candidate command center, not a closed dossier factory. Users authenticate once against the professional tools they already use; Matchr then grounds their profile and runs outreach **from their own identity**, with the user remaining in the approval loop.

The first two integrations are **LinkedIn** (inbound profile intelligence) and **Gmail** (outbound high-intent outreach). The architecture is extensible so later connectors (calendar, other mail providers, portfolio hosts) can plug into the same OAuth + agent pattern.

| Integration | Direction | What the user gets | Guardrail |
| :--- | :--- | :--- | :--- |
| **LinkedIn** | Inbound | Instant Ground Truth Profile — no manual profile form | User reviews/edits extracted facts before they become immutable grounding |
| **Gmail** | Outbound | In-app cold email compose + AI drafts, sent as the user | Nothing sends without explicit user approval; quality over volume |

### LinkedIn — Zero-Friction Profile Grounding

Connecting LinkedIn is the fastest way to become usable on Matchr. After OAuth consent, the platform extracts the most relevant professional signal and maps it into the same structured career facts used by matching and tailoring:

- Headline, about/summary, location, and target-role cues
- Experience (titles, companies, date ranges, descriptions)
- Skills, education, certifications, and featured/project links when available

This means a candidate does **not** need to fill out a Matchr profile. The extracted payload seeds the Ground Truth Profile; resume PDF upload remains an optional enrichment or override path. Downstream agents (match, tailor, cover letter, outreach) only cite facts the user has accepted.

### Gmail — In-Platform Cold Outreach with AI Drafting

Once a high-fit job is selected, the candidate can reach a hiring manager, recruiter, or other contact without leaving Matchr. Gmail OAuth lets the platform compose and send from the **user's own inbox**.

- The user picks a recipient (pasted address or contact captured from the job/company context).
- An **Outreach Draft Agent** writes a short, specific cold email grounded in the verified profile and that job's Fit Scorecard (matched skills, key angle, why this role).
- The user edits tone, asks, and facts in a native compose view, then sends.
- Threads and send status stay visible on the dashboard so follow-ups remain intentional — not a blast campaign.

This is the same quality-over-quantity rule as applications: a handful of personalized emails, never automated mass spam.

---

## 5. Career Growth Plan & Networking Tab

Matchr is a copilot for the *next* role, not only the next application. After the profile is grounded, two surfaces keep the user moving toward their stated career goals: a skill-gap **growth plan** on the audit dashboard, and a **Networking** tab of high-fit events.

### Career Growth Advisor (replaces generic resume critique)

Traditional resume tools flag vague bullets and grammatical errors. That feedback is cheap and rarely changes a career trajectory. Agent 2 instead treats the grounded profile and the user's target role as a gap-analysis problem:

- Identify the **target skills** that would most increase Fit Score for the user's goal title (and for the live jobs already surfacing).
- For each skill, recommend a short, ranked resource pack: a course or specialization, a respected certification path, high-signal YouTube videos or talks, and any other practical material (official docs, open projects, reading).
- Explain *why* the resource matters for that goal (e.g. "this cert is repeatedly listed on the senior data roles you match") rather than scoring the existing resume for polish.

The resume tailor still handles presentation later. Growth advice is reserved for capability the user does not yet have — and it never invents experience the user has not earned.

### Networking Tab — Compatible Events, Not a Dump

The **Networking** tab is a first-class dashboard section. It uses the same professional profile and career-goal embedding as job matching to retrieve and rerank live events:

- Meetups, conferences, workshops, office hours, and industry mixers aligned to target role, skills in the growth plan, industry, and location or virtual format.
- An LLM reranker returns only the **top most compatible** events, each with a short "why this event" note (speakers, topics, or attendee profile that maps to the user's goals).
- Event discovery can reuse **SerpApi** (or equivalent structured event search) the same way jobs are harvested — live listings, then vector match + judge, not a scraped firehose.

Users can save events and, where useful, draft Gmail outreach to organizers or speakers using the same approval-gated compose flow.

---

## 6. Multi-Agent System Architecture

```text
                   +----------------------------------------------------+
                   |                 Next.js Dashboard                  |
                   +-------------------------+--------------------------+
                                             |
                   +-------------------------v--------------------------+
                   |          Kong AI Gateway / FastAPI Backend         |
                   +-------------------------+--------------------------+
                                             |
         +-----------------------------------+-----------------------------------+
         |                                   |                                   |
+--------v---------+                +--------v---------+                +--------v---------+
| [Agent: Ingest]  |                | [Agent: Match]   |                | [Agent: Dossier] |
| - SerpApi Jobs   |                | - pgvector query |                | - Tailor Resume  |
| - Nutrient PDF   |                | - LLM Fit Judge  |                | - Cover Letter   |
| - Embedding Gen  |                | - Gap Analysis   |                | - Nutrient Build |
+--------+---------+                +--------+---------+                +--------+---------+
         |                                   |                                   |
         +----------------------------------->                                   |
                                             |                                   |
                            +----------------v------------------+                |
                            |   Supabase (PostgreSQL + Vector)  | <--------------+
                            +-----------------------------------+
```

### Specialized Agents

- **Agent A: Parsing & Grounding Auditor:** Extracts skills, tools, and quantified metrics from LinkedIn (primary) and/or raw PDFs (via Nutrient) and establishes the *"Ground Truth Profile"* to prevent downstream hallucinations.
- **Agent B: Real-Time Job Harvester:** Periodically queries the SerpApi Google Jobs engine to fetch structured job metadata, deduplicates entries, and embeds descriptions into pgvector.
- **Agent C: Semantic Match & Gap Analyzer:** Computes cosine similarity ($1 - \text{cosine distance}$) between the candidate embedding and active job listings, reranking the top 10 with actionable gap analysis.
- **Agent D: Integrity-Checked Tailoring Agent:** Rewrites bullet points to emphasize relevant experience matching the target job description while enforcing strict consistency with the ground-truth profile.
- **Agent E: Outreach Draft Agent:** Drafts Gmail-ready cold emails from the grounded profile + Fit Scorecard; the user must approve send. Nothing is mailed autonomously.
- **Agent F: Career Growth Advisor:** Maps profile → target-role skill gaps and returns concrete resources (courses, YouTube, certifications, docs) — not generic grammar or "make this bullet less vague" feedback.
- **Agent G: Event Match Agent:** Harvests live networking events and reranks the top compatible ones against the user's profile, goals, and growth-plan skills.

---

## 7. Step-by-Step Implementation Gameplan

```text
Phase 1: Foundation (Hours 0-8)   ──> Phase 2: Ingestion & Matching (Hours 8-18)
                                                      │
Phase 4: Polish & Pitch (Hours 28-36) <── Phase 3: Agents & UI (Hours 18-28)
```

### Phase 1: Environment, Database & Sponsor Setup (Hours 0–8)
- [ ] Provision a Supabase instance and enable the `pgvector` extension.
- [ ] Run database migrations to create `jobs`, `candidates`, `applications`, `learning_resources`, and `events` tables.
- [ ] Set up API keys: OpenAI, SerpApi, Nutrient/Foxit, and Kong Gateway.
- [ ] Initialize the project repository with FastAPI backend and Next.js / Tailwind frontend.

### Phase 2: Ingestion & Vector Matching Engine (Hours 8–18)
- [ ] **Job Pipeline:** Build `sync_jobs.py` to query SerpApi (Google Jobs), batch embed listings via `text-embedding-3-small`, and bulk upsert to Supabase.
- [ ] **Resume Parsing:** Implement Nutrient/Foxit SDK to extract raw text and layout structure from uploaded candidate PDFs.
- [ ] **Semantic Retrieval:** Create the Supabase RPC function (`match_jobs`) to execute cosine similarity searches between candidate embeddings and job vectors.
- [ ] **LLM Match Judge:** Write the reranking prompt that outputs structured JSON containing Fit %, Matched Skills, and Skill Gaps.
- [ ] **Growth Plan:** From those skill gaps, retrieve and rank courses, YouTube videos, and certifications for the user's target role.
- [ ] **Event Pipeline:** Harvest live networking events (SerpApi or equivalent), embed them, and expose `match_events` the same way as `match_jobs`.

### Phase 3: Multi-Agent Dossier Generation & UI (Hours 18–28)
- [ ] **Tailoring Agent:** Build the LangGraph / LangChain chain that aligns resume bullet points with job keywords while validating against the candidate's base profile.
- [ ] **Document Export:** Use Nutrient / Foxit API to dynamically render the tailored resume and cover letter into styled PDF files.
- [ ] **Frontend Dashboard:**
  - Build the resume upload zone and the Career Growth Plan (target skills + courses / YouTube / certifications), not a generic critique view.
  - Build the job recommendation feed showing live postings with match badges.
  - Build the **Networking** tab: top compatible events with "why this event" notes.
  - Add the one-click dossier generator with side-by-side comparison.

### Phase 4: Integrations, Polish & Judge Pitch Preparation (Hours 28–36)
- [ ] Route LLM calls through Kong AI Gateway to demonstrate API security, rate limiting, and observability.
- [ ] **LinkedIn OAuth:** Connect, extract profile fields, and hydrate the Ground Truth Profile without a manual form.
- [ ] **Gmail OAuth:** In-app compose + Outreach Draft Agent, send-from-user, and explicit approval before send.
- [ ] Add a demo toggle for Name.com API integration to spin up a custom candidate portfolio page.
- [ ] Rehearse the 3-minute pitch emphasizing the anti-spam philosophy, sponsor integrations, and live vector architecture.

---

## 8. Judge Defense & FAQ Cheat-Sheet

### **Q1: "Isn't this just contributing to the problem of candidates spamming ATS platforms?"**
> **Answer:** "No. Mass-apply bots flood ATS systems with unvetted noise. Matchr is designed for precision matching: we use semantic search and LLM evaluation to help candidates find the 5 roles where they genuinely excel, generate truthful tailored materials, and apply with high intentionality."

### **Q2: "How do you ensure the tailoring agent doesn't invent fake experience or hallucinate skills?"**
> **Answer:** "We implement a strict Grounding Guardrail. The candidate's original resume is parsed into an immutable ground-truth profile. The tailoring agent is constrained to only rephrase, re-order, and emphasize existing facts; any generated technical claim not present in the base profile is rejected by our verification check."

### **Q3: "Why not build a fully automated headless bot that submits the application across any site?"**
> **Answer:** "Headless browser submissions across diverse ATS platforms (Workday, Greenhouse, Taleo) break constantly due to custom schemas, SSO logins, and CAPTCHAs. We chose a reliable architecture: a candidate command center that handles 95% of the heavy lifting (matching, keyword alignment, dossier creation, ATS Q&A prep) while leaving the final 1-click submission cleanly in the user's control."

### **Q4: "Does Gmail outreach just turn Matchr into a cold-email spam tool?"**
> **Answer:** "No. Outreach is opt-in, sent from the candidate's own Gmail, and drafted against a specific high-fit role. The AI never sends on its own — the user reviews every draft. LinkedIn is inbound only: we extract profile facts so the user skips form-filling, then they confirm what becomes ground truth."

### **Q5: "Isn't the audit just another generic resume-review chatbot?"**
> **Answer:** "We deliberately skip grammar and 'make this bullet less vague' comments. After grounding the profile, we compute the skill gaps to the user's target role and return a growth plan: courses, certifications, YouTube, and other resources that actually move Fit Score. The Networking tab uses the same profile and goals to surface only the most compatible events — same precision rule as jobs."
