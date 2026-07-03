-- ============================================================================
-- CuentosMagicos AI - Database Schema
-- PostgreSQL 16+ (Supabase compatible)
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           TEXT UNIQUE NOT NULL,
    password_hash   TEXT,  -- NULL if using OAuth/magic link
    name            TEXT,
    avatar_url      TEXT,

    -- Subscription
    subscription_tier       TEXT NOT NULL DEFAULT 'free'
                            CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
    subscription_expires_at TIMESTAMPTZ,
    stripe_customer_id      TEXT,
    stripe_subscription_id  TEXT,

    -- Usage quotas (reset monthly)
    monthly_story_quota     INT NOT NULL DEFAULT 5,
    monthly_story_used      INT NOT NULL DEFAULT 0,
    quota_reset_date        DATE NOT NULL DEFAULT DATE_TRUNC('month', CURRENT_DATE),

    -- Preferences
    default_language        TEXT NOT NULL DEFAULT 'es',
    default_voice           TEXT DEFAULT 'alloy',

    -- Timestamps
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_subscription_tier ON users(subscription_tier);

-- ============================================================================
-- STORIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS stories (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Input parameters
    child_name      TEXT NOT NULL,
    child_age       INT NOT NULL CHECK (child_age BETWEEN 2 AND 12),
    theme           TEXT NOT NULL,
    values          TEXT[] NOT NULL DEFAULT '{}',
    initial_prompt  JSONB NOT NULL,
    target_language TEXT NOT NULL DEFAULT 'es',
    duration_hint   TEXT NOT NULL DEFAULT 'short'
                    CHECK (duration_hint IN ('short', 'medium', 'long')),

    -- Generated content metadata
    title           TEXT NOT NULL DEFAULT '',
    moral_values    TEXT[] NOT NULL DEFAULT '{}',
    canonical_character_description TEXT NOT NULL DEFAULT '',

    -- Image consistency
    image_seed      INT,

    -- Generation status
    status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'processing', 'ready', 'failed', 'cancelled')),
    error_message   TEXT,

    -- Progress tracking
    text_generated  BOOLEAN NOT NULL DEFAULT FALSE,
    images_generated BOOLEAN NOT NULL DEFAULT FALSE,
    audio_generated BOOLEAN NOT NULL DEFAULT FALSE,
    video_generated BOOLEAN NOT NULL DEFAULT FALSE,

    -- Timestamps
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stories_user_id ON stories(user_id);
CREATE INDEX idx_stories_status ON stories(status);
CREATE INDEX idx_stories_created_at ON stories(created_at DESC);

-- ============================================================================
-- CHAPTERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS chapters (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id        UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,

    -- Chapter metadata
    chapter_number  INT NOT NULL,
    chapter_title   TEXT NOT NULL,

    -- Content
    chapter_text    TEXT NOT NULL,

    -- AI prompts (stored for regeneration/debugging)
    image_prompt    TEXT,
    video_prompt    TEXT,
    audio_settings  JSONB,  -- voice, speed, etc.

    -- Generated media URLs
    url_image       TEXT,
    url_audio       TEXT,
    url_video       TEXT,

    -- Generation status per chapter
    image_status    TEXT NOT NULL DEFAULT 'pending'
                    CHECK (image_status IN ('pending', 'processing', 'done', 'failed')),
    audio_status    TEXT NOT NULL DEFAULT 'pending'
                    CHECK (audio_status IN ('pending', 'processing', 'done', 'failed')),
    video_status    TEXT NOT NULL DEFAULT 'pending'
                    CHECK (video_status IN ('pending', 'processing', 'done', 'skipped', 'failed')),

    -- Timestamps
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(story_id, chapter_number)
);

CREATE INDEX idx_chapters_story_id ON chapters(story_id);
CREATE INDEX idx_chapters_story_number ON chapters(story_id, chapter_number);

-- ============================================================================
-- PROMPT CACHE TABLE (Cost optimization)
-- ============================================================================
CREATE TABLE IF NOT EXISTS prompt_cache (
    id              BIGSERIAL PRIMARY KEY,
    prompt_hash     TEXT UNIQUE NOT NULL,  -- SHA-256 of normalized prompt
    provider        TEXT NOT NULL,  -- e.g., 'openai:gpt-4o', 'openai:dall-e-3', 'luma:dream-machine'
    output_type     TEXT NOT NULL CHECK (output_type IN ('text', 'image', 'audio', 'video')),
    payload         JSONB NOT NULL,  -- Full API response
    cache_key       TEXT,  -- Additional key for lookups (e.g., story_id for images)

    -- Cache metadata
    usage_count     INT NOT NULL DEFAULT 1,
    last_used_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Timestamps
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_prompt_cache_hash ON prompt_cache(prompt_hash);
CREATE INDEX idx_prompt_cache_provider_type ON prompt_cache(provider, output_type);

-- ============================================================================
-- GENERATION JOBS TABLE (Async task tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS generation_jobs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id        UUID REFERENCES stories(id) ON DELETE CASCADE,
    chapter_id      UUID REFERENCES chapters(id) ON DELETE CASCADE,

    -- Job metadata
    job_type        TEXT NOT NULL CHECK (job_type IN ('story_text', 'images', 'audio', 'video')),
    provider        TEXT NOT NULL,  -- e.g., 'openai', 'luma'
    status          TEXT NOT NULL DEFAULT 'queued'
                    CHECK (status IN ('queued', 'running', 'done', 'failed', 'cancelled')),
    error_message   TEXT,

    -- External provider references
    external_job_id TEXT,  -- Job ID from Luma/Runway/etc.
    celery_task_id  TEXT,  -- Celery task ID for tracking

    -- Retry logic
    retry_count     INT NOT NULL DEFAULT 0,
    max_retries     INT NOT NULL DEFAULT 3,

    -- Timestamps
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ
);

CREATE INDEX idx_generation_jobs_story_id ON generation_jobs(story_id);
CREATE INDEX idx_generation_jobs_chapter_id ON generation_jobs(chapter_id);
CREATE INDEX idx_generation_jobs_status ON generation_jobs(status);
CREATE INDEX idx_generation_jobs_external_id ON generation_jobs(external_job_id);


-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stories_updated_at
    BEFORE UPDATE ON stories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chapters_updated_at
    BEFORE UPDATE ON chapters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_generation_jobs_updated_at
    BEFORE UPDATE ON generation_jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Monthly quota reset function
CREATE OR REPLACE FUNCTION reset_monthly_quotas()
RETURNS void AS $$
BEGIN
    UPDATE users
    SET monthly_story_used = 0,
        quota_reset_date = DATE_TRUNC('month', CURRENT_DATE)
    WHERE quota_reset_date < DATE_TRUNC('month', CURRENT_DATE);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SEED DATA (for development)
-- ============================================================================

-- Insert a test user (password hash is 'password123' - DO NOT use in production)
-- INSERT INTO users (id, email, password_hash, name, subscription_tier, monthly_story_quota)
-- VALUES (
--     '00000000-0000-0000-0000-000000000001',
--     'test@example.com',
--     '$2b$12$LJ3m4ys3Lk8T0z9qK5FZ.eY7xVqGzH8vF2nJ4kL6mN8oP0qR2sT4u',
--     'Test User',
--     'pro',
--     20
-- );
