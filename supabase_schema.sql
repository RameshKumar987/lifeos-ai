-- ==============================================================================
-- LIFEOS AI — FULL DATABASE SCHEMA & MIGRATIONS FOR SUPABASE
-- Run this complete script in Supabase SQL Editor (Dashboard -> SQL Editor -> New query -> Run)
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'owner',
    bio TEXT,
    timezone TEXT DEFAULT 'Asia/Kolkata',
    education TEXT,
    graduation_year INT,
    career_target TEXT,
    current_focus TEXT,
    xp_total INT DEFAULT 0,
    level INT DEFAULT 1,
    streak_current INT DEFAULT 0,
    streak_longest INT DEFAULT 0,
    is_owner BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to create profile automatically when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#7c3aed',
    icon TEXT,
    description TEXT,
    order_index INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. GOALS TABLE
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'active', -- active, paused, completed, archived
    priority TEXT DEFAULT 'medium', -- low, medium, high, critical
    target_hours NUMERIC,
    actual_hours NUMERIC DEFAULT 0,
    start_date DATE,
    deadline DATE,
    progress_percent INT DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PROJECTS TABLE
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    problem_statement TEXT,
    goals TEXT,
    tech_stack TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'planning', -- planning, active, on_hold, completed, archived
    github_url TEXT,
    live_url TEXT,
    deadline DATE,
    next_action TEXT,
    architecture_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PROJECT MILESTONES
CREATE TABLE IF NOT EXISTS public.project_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE,
    completed_at TIMESTAMPTZ,
    order_index INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PROJECT LOGS
CREATE TABLE IF NOT EXISTS public.project_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    log_type TEXT DEFAULT 'progress', -- progress, blocker, decision, bug, note
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TASKS TABLE
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'todo', -- todo, in_progress, completed, skipped, archived
    priority TEXT DEFAULT 'medium',
    difficulty TEXT,
    planned_date DATE,
    deadline DATE,
    planned_duration_mins INT,
    actual_duration_mins INT DEFAULT 0,
    completed_at TIMESTAMPTZ,
    notes TEXT,
    reflection TEXT,
    resources JSONB DEFAULT '[]'::jsonb,
    tags TEXT[] DEFAULT '{}',
    is_recurring BOOLEAN DEFAULT false,
    recurrence_rule TEXT,
    parent_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    order_index INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. DAILY ATTENDANCE TABLE
CREATE TABLE IF NOT EXISTS public.daily_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    status TEXT DEFAULT 'not_started', -- not_started, in_progress, completed, interrupted
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    duration_mins INT DEFAULT 0,
    notes TEXT,
    missed_reason TEXT,
    is_rest_day BOOLEAN DEFAULT false,
    sessions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- 9. LEARNING ENTRIES TABLE
CREATE TABLE IF NOT EXISTS public.learning_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    raw_notes TEXT NOT NULL,
    ai_summary TEXT,
    key_concepts TEXT[] DEFAULT '{}',
    key_definitions JSONB DEFAULT '{}'::jsonb,
    examples TEXT[] DEFAULT '{}',
    common_mistakes TEXT[] DEFAULT '{}',
    interview_takeaways TEXT[] DEFAULT '{}',
    follow_up_actions TEXT[] DEFAULT '{}',
    ai_processed BOOLEAN DEFAULT false,
    ai_processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. FLASHCARDS TABLE (SPACED REPETITION)
CREATE TABLE IF NOT EXISTS public.flashcards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    learning_entry_id UUID REFERENCES public.learning_entries(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    tags TEXT[] DEFAULT '{}',
    difficulty TEXT DEFAULT 'intermediate',
    ease_factor NUMERIC DEFAULT 2.5,
    interval_days INT DEFAULT 1,
    review_count INT DEFAULT 0,
    next_review_at TIMESTAMPTZ DEFAULT NOW(),
    last_reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. REVIEW ATTEMPTS TABLE
CREATE TABLE IF NOT EXISTS public.review_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    flashcard_id UUID REFERENCES public.flashcards(id) ON DELETE CASCADE NOT NULL,
    quality TEXT NOT NULL, -- again, hard, good, easy
    time_taken_secs INT,
    response TEXT,
    was_correct BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. GERMAN VOCABULARY TABLE
CREATE TABLE IF NOT EXISTS public.german_vocabulary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    word TEXT NOT NULL,
    article TEXT, -- der, die, das
    translation_en TEXT NOT NULL,
    translation_hi TEXT,
    example_sentence TEXT,
    level TEXT DEFAULT 'A1',
    category TEXT DEFAULT 'General',
    ease_factor NUMERIC DEFAULT 2.5,
    interval_days INT DEFAULT 1,
    next_review_at TIMESTAMPTZ DEFAULT NOW(),
    review_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. ENGLISH SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.english_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    mode TEXT NOT NULL,
    transcript JSONB DEFAULT '[]'::jsonb,
    feedback JSONB,
    duration_secs INT DEFAULT 0,
    words_spoken INT DEFAULT 0,
    grammar_score INT,
    fluency_score INT,
    vocabulary_score INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. REMINDERS TABLE
CREATE TABLE IF NOT EXISTS public.reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    remind_at TIMESTAMPTZ NOT NULL,
    is_recurring BOOLEAN DEFAULT false,
    recurrence_rule TEXT,
    is_active BOOLEAN DEFAULT true,
    last_triggered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. USER XP EVENTS & ACHIEVEMENTS
CREATE TABLE IF NOT EXISTS public.user_xp_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount INT NOT NULL,
    reason TEXT NOT NULL,
    source_type TEXT NOT NULL,
    source_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. SQUAD & COMMUNITIES
CREATE TABLE IF NOT EXISTS public.communities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    avatar_url TEXT,
    invite_code TEXT UNIQUE NOT NULL,
    is_private BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.community_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(community_id, user_id)
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES — ENSURES USER DATA IS STRICTLY PRIVATE
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.german_vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.english_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_xp_events ENABLE ROW LEVEL SECURITY;

-- Generic user isolation policies
CREATE POLICY "Users can manage own profile" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can manage own categories" ON public.categories FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own goals" ON public.goals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own projects" ON public.projects FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own project milestones" ON public.project_milestones FOR ALL USING (
    EXISTS (SELECT 1 FROM public.projects WHERE projects.id = project_milestones.project_id AND projects.user_id = auth.uid())
);
CREATE POLICY "Users can manage own project logs" ON public.project_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own tasks" ON public.tasks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own daily attendance" ON public.daily_attendance FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own learning entries" ON public.learning_entries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own flashcards" ON public.flashcards FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own review attempts" ON public.review_attempts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own german vocab" ON public.german_vocabulary FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own english sessions" ON public.english_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own reminders" ON public.reminders FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own xp events" ON public.user_xp_events FOR ALL USING (auth.uid() = user_id);
