export type FitScorecard = {
  match_percent: number;
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
  apply_url: string | null;
  scorecard: FitScorecard | null;
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
  resources: LearningResource[];
};

export type GrowthPlan = {
  target_title: string | null;
  skill_gaps: SkillGap[];
};

export type NetworkingEvent = {
  id: string;
  name: string;
  location: string | null;
  format: string;
  starts_at: string | null;
  url: string | null;
  why_this_event: string | null;
  match_percent: number | null;
};

export type Candidate = {
  id: string;
  headline: string | null;
  target_title: string | null;
  location: string | null;
  skills: string[];
  linkedin_connected: boolean;
  gmail_connected: boolean;
};
