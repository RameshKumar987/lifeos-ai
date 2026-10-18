// LifeOS AI — Database Types
// Auto-generated from Supabase schema — do not manually edit types derived from migrations

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'owner' | 'friend' | 'challenge_manager' | 'viewer'
export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'skipped' | 'archived'
export type AttendanceStatus = 'not_started' | 'in_progress' | 'completed' | 'interrupted'
export type GoalStatus = 'active' | 'paused' | 'completed' | 'archived'
export type Priority = 'low' | 'medium' | 'high' | 'critical'
export type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert'
export type ReviewQuality = 'again' | 'hard' | 'good' | 'easy'
export type ChallengeStatus = 'draft' | 'active' | 'completed' | 'cancelled'
export type InvitationStatus = 'pending' | 'accepted' | 'rejected' | 'expired'
export type AIProvider = 'groq' | 'gemini' | 'none'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      goals: {
        Row: Goal
        Insert: Omit<Goal, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Goal, 'id' | 'user_id' | 'created_at'>>
      }
      categories: {
        Row: Category
        Insert: Omit<Category, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Category, 'id' | 'user_id' | 'created_at'>>
      }
      tasks: {
        Row: Task
        Insert: Omit<Task, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Task, 'id' | 'user_id' | 'created_at'>>
      }
      task_sessions: {
        Row: TaskSession
        Insert: Omit<TaskSession, 'id' | 'created_at'>
        Update: Partial<Omit<TaskSession, 'id' | 'created_at'>>
      }
      daily_attendance: {
        Row: DailyAttendance
        Insert: Omit<DailyAttendance, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<DailyAttendance, 'id' | 'user_id' | 'created_at'>>
      }
      learning_entries: {
        Row: LearningEntry
        Insert: Omit<LearningEntry, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<LearningEntry, 'id' | 'user_id' | 'created_at'>>
      }
      flashcards: {
        Row: Flashcard
        Insert: Omit<Flashcard, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Flashcard, 'id' | 'created_at'>>
      }
      review_schedules: {
        Row: ReviewSchedule
        Insert: Omit<ReviewSchedule, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<ReviewSchedule, 'id' | 'created_at'>>
      }
      review_attempts: {
        Row: ReviewAttempt
        Insert: Omit<ReviewAttempt, 'id' | 'created_at'>
        Update: Partial<Omit<ReviewAttempt, 'id' | 'created_at'>>
      }
      projects: {
        Row: Project
        Insert: Omit<Project, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Project, 'id' | 'user_id' | 'created_at'>>
      }
      project_milestones: {
        Row: ProjectMilestone
        Insert: Omit<ProjectMilestone, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<ProjectMilestone, 'id' | 'created_at'>>
      }
      project_logs: {
        Row: ProjectLog
        Insert: Omit<ProjectLog, 'id' | 'created_at'>
        Update: Partial<Omit<ProjectLog, 'id' | 'created_at'>>
      }
      reminders: {
        Row: Reminder
        Insert: Omit<Reminder, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Reminder, 'id' | 'user_id' | 'created_at'>>
      }
      achievements: {
        Row: Achievement
        Insert: Omit<Achievement, 'id' | 'created_at'>
        Update: Partial<Omit<Achievement, 'id' | 'created_at'>>
      }
      user_xp_events: {
        Row: XPEvent
        Insert: Omit<XPEvent, 'id' | 'created_at'>
        Update: never
      }
      focus_sessions: {
        Row: FocusSession
        Insert: Omit<FocusSession, 'id' | 'created_at'>
        Update: Partial<Omit<FocusSession, 'id' | 'created_at'>>
      }
      ai_interactions: {
        Row: AIInteraction
        Insert: Omit<AIInteraction, 'id' | 'created_at'>
        Update: never
      }
      user_preferences: {
        Row: UserPreferences
        Insert: Omit<UserPreferences, 'created_at' | 'updated_at'>
        Update: Partial<Omit<UserPreferences, 'user_id' | 'created_at'>>
      }
      german_vocabulary: {
        Row: GermanVocabulary
        Insert: Omit<GermanVocabulary, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<GermanVocabulary, 'id' | 'created_at'>>
      }
      english_sessions: {
        Row: EnglishSession
        Insert: Omit<EnglishSession, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<EnglishSession, 'id' | 'created_at'>>
      }
      communities: {
        Row: Community
        Insert: Omit<Community, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Community, 'id' | 'created_at'>>
      }
      community_memberships: {
        Row: CommunityMembership
        Insert: Omit<CommunityMembership, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<CommunityMembership, 'id' | 'created_at'>>
      }
      community_invitations: {
        Row: CommunityInvitation
        Insert: Omit<CommunityInvitation, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<CommunityInvitation, 'id' | 'created_at'>>
      }
      shared_challenges: {
        Row: SharedChallenge
        Insert: Omit<SharedChallenge, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<SharedChallenge, 'id' | 'created_at'>>
      }
      challenge_participants: {
        Row: ChallengeParticipant
        Insert: Omit<ChallengeParticipant, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<ChallengeParticipant, 'id' | 'created_at'>>
      }
      challenge_daily_logs: {
        Row: ChallengeDailyLog
        Insert: Omit<ChallengeDailyLog, 'id' | 'created_at'>
        Update: Partial<Omit<ChallengeDailyLog, 'id' | 'created_at'>>
      }
    }
  }
}

// ─── Entity Interfaces ─────────────────────────────────────────────────────

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  bio: string | null
  timezone: string
  education: string | null
  graduation_year: number | null
  career_target: string | null
  current_focus: string | null
  xp_total: number
  level: number
  streak_current: number
  streak_longest: number
  is_owner: boolean
  created_at: string
  updated_at: string
}

export interface Goal {
  id: string
  user_id: string
  title: string
  description: string | null
  category_id: string | null
  status: GoalStatus
  priority: Priority
  target_hours: number | null
  actual_hours: number
  start_date: string | null
  deadline: string | null
  progress_percent: number
  tags: string[]
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  user_id: string
  name: string
  color: string
  icon: string | null
  description: string | null
  order_index: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  user_id: string
  title: string
  description: string | null
  category_id: string | null
  goal_id: string | null
  project_id: string | null
  status: TaskStatus
  priority: Priority
  difficulty: Difficulty | null
  planned_date: string | null
  deadline: string | null
  planned_duration_mins: number | null
  actual_duration_mins: number
  completed_at: string | null
  notes: string | null
  reflection: string | null
  resources: Json
  tags: string[]
  is_recurring: boolean
  recurrence_rule: string | null
  parent_task_id: string | null
  order_index: number
  created_at: string
  updated_at: string
}

export interface TaskSession {
  id: string
  task_id: string
  user_id: string
  started_at: string
  ended_at: string | null
  duration_mins: number | null
  notes: string | null
  created_at: string
}

export interface DailyAttendance {
  id: string
  user_id: string
  date: string // YYYY-MM-DD
  status: AttendanceStatus
  started_at: string | null
  ended_at: string | null
  duration_mins: number | null
  notes: string | null
  missed_reason: string | null
  is_rest_day: boolean
  sessions: Json
  created_at: string
  updated_at: string
}

export interface LearningEntry {
  id: string
  user_id: string
  task_id: string | null
  category_id: string | null
  title: string
  raw_notes: string
  ai_summary: string | null
  key_concepts: string[]
  key_definitions: Json
  examples: string[]
  common_mistakes: string[]
  interview_takeaways: string[]
  follow_up_actions: string[]
  ai_processed: boolean
  ai_processed_at: string | null
  created_at: string
  updated_at: string
}

export interface Flashcard {
  id: string
  learning_entry_id: string | null
  user_id: string
  front: string
  back: string
  category_id: string | null
  tags: string[]
  difficulty: Difficulty
  ease_factor: number
  interval_days: number
  review_count: number
  next_review_at: string
  last_reviewed_at: string | null
  created_at: string
  updated_at: string
}

export interface ReviewSchedule {
  id: string
  user_id: string
  flashcard_id: string
  scheduled_date: string
  status: 'pending' | 'completed' | 'skipped'
  review_number: number
  created_at: string
  updated_at: string
}

export interface ReviewAttempt {
  id: string
  user_id: string
  flashcard_id: string
  quality: ReviewQuality
  time_taken_secs: number | null
  response: string | null
  was_correct: boolean | null
  created_at: string
}

export interface Project {
  id: string
  user_id: string
  name: string
  description: string | null
  problem_statement: string | null
  goals: string | null
  tech_stack: string[]
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'archived'
  github_url: string | null
  live_url: string | null
  deadline: string | null
  next_action: string | null
  architecture_notes: string | null
  created_at: string
  updated_at: string
}

export interface ProjectMilestone {
  id: string
  project_id: string
  title: string
  description: string | null
  due_date: string | null
  completed_at: string | null
  order_index: number
  created_at: string
  updated_at: string
}

export interface ProjectLog {
  id: string
  project_id: string
  user_id: string
  content: string
  log_type: 'progress' | 'blocker' | 'decision' | 'bug' | 'note'
  created_at: string
}

export interface Reminder {
  id: string
  user_id: string
  title: string
  description: string | null
  remind_at: string
  is_recurring: boolean
  recurrence_rule: string | null
  is_active: boolean
  last_triggered_at: string | null
  task_id: string | null
  goal_id: string | null
  created_at: string
  updated_at: string
}

export interface Achievement {
  id: string
  user_id: string
  key: string
  title: string
  description: string
  icon: string
  xp_awarded: number
  unlocked_at: string
  created_at: string
}

export interface XPEvent {
  id: string
  user_id: string
  amount: number
  reason: string
  source_type: string
  source_id: string | null
  created_at: string
}

export interface FocusSession {
  id: string
  user_id: string
  task_id: string | null
  started_at: string
  ended_at: string | null
  planned_duration_mins: number
  actual_duration_mins: number | null
  was_completed: boolean
  notes: string | null
  created_at: string
}

export interface AIInteraction {
  id: string
  user_id: string
  provider: AIProvider
  model: string
  feature: string
  prompt_tokens: number | null
  completion_tokens: number | null
  success: boolean
  error_message: string | null
  created_at: string
}

export interface UserPreferences {
  user_id: string
  theme: 'dark' | 'light' | 'system'
  timezone: string
  daily_goal_hours: number
  work_start_hour: number
  work_end_hour: number
  quiet_hours_start: number | null
  quiet_hours_end: number | null
  ai_provider: AIProvider
  ai_model: string | null
  enable_gamification: boolean
  enable_browser_notifications: boolean
  enable_sounds: boolean
  dashboard_widget_order: string[]
  hidden_widgets: string[]
  language_display: 'en' | 'hi'
  spaced_repetition_intervals: number[]
  created_at: string
  updated_at: string
}

export interface GermanVocabulary {
  id: string
  user_id: string
  word: string
  article: 'der' | 'die' | 'das' | null
  translation_en: string
  translation_hi: string | null
  example_sentence: string | null
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1'
  category: string | null
  ease_factor: number
  interval_days: number
  next_review_at: string
  review_count: number
  created_at: string
  updated_at: string
}

export interface EnglishSession {
  id: string
  user_id: string
  mode: string
  transcript: Json
  feedback: Json | null
  duration_secs: number
  words_spoken: number | null
  grammar_score: number | null
  fluency_score: number | null
  vocabulary_score: number | null
  created_at: string
  updated_at: string
}

export interface Community {
  id: string
  owner_id: string
  name: string
  description: string | null
  avatar_url: string | null
  invite_code: string
  is_private: boolean
  created_at: string
  updated_at: string
}

export interface CommunityMembership {
  id: string
  community_id: string
  user_id: string
  role: UserRole
  joined_at: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CommunityInvitation {
  id: string
  community_id: string
  invited_by: string
  email: string | null
  invite_token: string
  status: InvitationStatus
  expires_at: string
  accepted_at: string | null
  created_at: string
  updated_at: string
}

export interface SharedChallenge {
  id: string
  community_id: string
  created_by: string
  title: string
  description: string | null
  challenge_type: string
  goal_type: string
  target_value: number
  start_date: string
  end_date: string
  timezone: string
  status: ChallengeStatus
  rules: Json
  created_at: string
  updated_at: string
}

export interface ChallengeParticipant {
  id: string
  challenge_id: string
  user_id: string
  joined_at: string
  status: 'active' | 'paused' | 'completed' | 'dropped'
  current_streak: number
  total_score: number
  rank: number | null
  created_at: string
  updated_at: string
}

export interface ChallengeDailyLog {
  id: string
  challenge_id: string
  participant_id: string
  user_id: string
  log_date: string
  value: number
  notes: string | null
  verified: boolean
  created_at: string
}
