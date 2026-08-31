export type FitScorecard = {
  match_percent: number;
  similarity: number;
  semantic_score: number | null;
  ranking_score: number | null;
  matching_skills: string[];
  missing_tech: string[];
  key_angle: string | null;
};

export type Job = {
  id: string;
  title: string;
  company: string;
  location: string | null;
  source: string | null;
  posted_at: string | null;
  salary: string | null;
  apply_url: string | null;
  description: string | null;
  rank: number | null;
  scorecard: FitScorecard | null;
  targeted: boolean;
};

export type Experience = {
  title: string;
  company: string;
  start_date: string | null;
  end_date: string | null;
  location: string | null;
  bullets: string[];
};

export type Candidate = {
  id: string;
  full_name: string | null;
  headline: string | null;
  summary: string | null;
  target_title: string | null;
  location: string | null;
  email: string | null;
  picture_url: string | null;
  websites: string[];
  skills: string[];
  experience: Experience[];
  education: string[];
  certifications: string[];
  volunteering: Experience[];
  projects: string[];
  languages: string[];
  honors: string[];
  grounded: boolean;
  grounding_sources: string[];
  linkedin_connected: boolean;
  linkedin_member_id: string | null;
  linkedin_coverage: "none" | "identity" | "profile";
  gmail_connected: boolean;
};

export type LearningResource = {
  title: string;
  kind: string;
  url: string;
  provider: string | null;
  why: string | null;
};

export type SkillGap = {
  skill: string;
  priority: number;
  demand_count: number;
  demand_note: string | null;
  resources: LearningResource[];
};

export type GrowthPlan = {
  target_title: string | null;
  summary: string | null;
  strengths: string[];
  skill_gaps: SkillGap[];
};

export type NetworkingEvent = {
  id: string;
  name: string;
  organizer: string | null;
  location: string | null;
  format: string;
  starts_at: string | null;
  url: string | null;
  description: string | null;
  attendee_profile: string | null;
  topics: string[];
  why_this_event: string | null;
  match_percent: number | null;
  saved: boolean;
};

export type Application = {
  id: string;
  candidate_id: string;
  job_id: string;
  job_title: string | null;
  company: string | null;
  status: string;
  created_at: string | null;
};

export type TailoredBullet = {
  original: string;
  tailored: string;
  emphasized_skills: string[];
  changed: boolean;
};

export type AtsAnswer = {
  question: string;
  answer: string;
};

export type GroundingCheck = {
  passed: boolean;
  claims_checked: number;
  rejected_claims: string[];
  note: string;
};

export type Dossier = {
  job_id: string;
  job_title: string;
  company: string;
  summary: string;
  tailored_bullets: TailoredBullet[];
  cover_letter: string;
  ats_answers: AtsAnswer[];
  grounding: GroundingCheck;
  generated_at: string;
  generation_source?: string | null;
  retrieved_chunk_ids?: number[];
  cover_letter_id?: number | null;
};

export type OutreachDraft = {
  subject: string;
  body: string;
  recipient_email: string;
  recipient_name: string | null;
  job_id: string | null;
  grounded_facts: string[];
};

export type OutreachThread = {
  id: string;
  recipient_email: string;
  subject: string;
  body: string;
  job_id: string | null;
  job_title: string | null;
  status: string;
  sent_at: string;
};

export type Integration = {
  provider: string;
  label: string;
  direction: string;
  connected: boolean;
  configured: boolean;
  callback_url?: string | null;
  connectable?: boolean;
};

export type ActivityKind =
  | "grounded"
  | "goal"
  | "sync"
  | "targeted"
  | "untargeted"
  | "dossier"
  | "event"
  | "outreach";

export type Tone = "neutral" | "brand" | "positive" | "warning" | "info" | "danger";

export type ActivityEntry = {
  id: string;
  kind: ActivityKind;
  title: string;
  detail: string | null;
  tone: Tone;
  at: string;
};

export type PipelineStage = {
  key: string;
  label: string;
  count: number;
  percent: number;
  tone: Tone;
  hint: string | null;
};

export type MatchPoint = {
  label: string;
  title: string;
  company: string;
  match: number;
  coverage: number;
};

export type ScoreBand = {
  label: string;
  count: number;
  tone: Tone;
};

export type NextAction = {
  label: string;
  description: string;
  href: string;
  cta: string;
};

export type Overview = {
  grounded: boolean;
  grounding_sources: string[];
  target_title: string | null;
  candidate_name: string | null;
  location: string | null;

  skill_count: number;
  jobs_in_corpus: number;
  top_match_percent: number | null;
  average_match_percent: number | null;
  strong_matches: number;
  targeted_count: number;
  target_limit: number;
  dossiers_ready: number;
  events_matched: number;
  events_saved: number;
  outreach_sent: number;
  outreach_goal: number;
  recruiters_emailed: number;
  open_skill_gaps: number;
  profile_completeness: number;
  last_sync: string | null;

  linkedin_connected: boolean;
  gmail_connected: boolean;

  pipeline: PipelineStage[];
  match_curve: MatchPoint[];
  score_bands: ScoreBand[];
  activity: ActivityEntry[];
  next_action: NextAction | null;
};
