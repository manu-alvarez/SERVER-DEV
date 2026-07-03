# CuentosMagicos AI - Architectural Blueprint

> A modern web platform that generates personalized children's stories using AI in four formats: Text, Images, Audio, and Video.

---

## 1. SYSTEM ARCHITECTURE & TECH STACK

### 1.1 Technology Stack (2025-2026-ready)

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Frontend** | Next.js 15 (App Router) + React 19 + TypeScript | SSR/SSG, SEO, server actions, modern DX |
| **Styling** | Tailwind CSS v4 + shadcn/ui | Utility-first, accessible, dark-mode ready |
| **Backend API (BFF)** | Next.js Route Handlers | Auth, sessions, fast endpoints, no CORS |
| **Backend (AI Orchestrator)** | Python 3.12 + FastAPI | Async-native, type-safe, excellent for ML/AI pipelines |
| **Task Queue** | Celery 5 + Redis | Distributed task processing, retry logic, scheduling |
| **Database** | PostgreSQL 16 (via Supabase) | Relational integrity, JSONB, RLS, realtime subscriptions |
| **File Storage** | Supabase Storage (S3-compatible) | Signed URLs, CDN edge caching, simple API |
| **Auth** | Supabase Auth (JWT) | Email, OAuth, magic links, row-level security |

### 1.2 AI Providers

| Modality | Provider | Model/Endpoint | Cost Tier |
|----------|----------|----------------|-----------|
| **Text/Story** | OpenAI | GPT-4o (`gpt-4o-2024-11-20`) | $2.50/1M input tokens |
| **Images** | OpenAI | DALL-E 3 (`dall-e-3`) | $0.040/image (standard) |
| **Audio/TTS** | OpenAI | `gpt-4o-mini-tts` / `audio/speech` | $0.015/1K chars |
| **Video** | Luma AI | Dream Machine (image-to-video) | ~$0.05-0.10/clip |
| **Moderation** | OpenAI | `omni-moderation-latest` | Free tier available |

### 1.3 End-to-End Data Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js 15)                            │
│  ┌─────────────┐     ┌──────────────┐     ┌─────────────────────────┐   │
│  │  StoryForm  │────>│  BFF Route   │────>│  StoryPlayer (Reader)   │   │
│  │  (Create)   │     │  /api/stories│     │  /stories/[id]          │   │
│  └─────────────┘     └──────┬───────┘     └─────────────────────────┘   │
│                             │                                            │
└─────────────────────────────┼────────────────────────────────────────────┘
                              │ POST /api/stories/generate
                              ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    BACKEND ORCHESTRATOR (FastAPI)                        │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  1. Validate & moderate input                                    │   │
│  │  2. Create story record (status: pending)                        │   │
│  │  3. Enqueue Celery task: generate_story_pipeline(story_id)       │   │
│  │  4. Return story_id immediately (no timeout)                     │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                              │                                           │
│                              ▼                                           │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  CELERY WORKER: generate_story_pipeline                          │   │
│  │                                                                  │   │
│  │  Step 1: GPT-4o → Story structure + chapter text + image prompts │   │
│  │           ↓                                                       │   │
│  │  Step 2: Enqueue subtasks                                        │   │
│  │     ├─ generate_images_for_story(story_id)  → queue: images      │   │
│  │     ├─ generate_audio_for_story(story_id)   → queue: audio       │   │
│  │     └─ generate_video_for_story(story_id)   → queue: video       │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  IMAGE WORKER (per chapter)                                      │   │
│  │  - Build prompt: canonical_description + chapter scene           │   │
│  │  - Call DALL-E 3 with fixed seed for consistency                │   │
│  │  - Upload to Supabase Storage → update chapters.url_image        │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  AUDIO WORKER (per chapter)                                      │   │
│  │  - Call OpenAI TTS (gpt-4o-mini-tts) with child-friendly voice   │   │
│  │  - Upload to Supabase Storage → update chapters.url_audio        │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  VIDEO WORKER (per chapter)                                      │   │
│  │  - Call Luma Dream Machine (image-to-video)                     │   │
│  │  - Poll/webhook for completion                                  │   │
│  │  - Upload to Supabase Storage → update chapters.url_video        │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  Final: story.status = "ready"                                           │
└──────────────────────────────────────────────────────────────────────────┘
                              │
                              │ Polling / Realtime (Supabase)
                              ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  Frontend StoryPlayer detects status change → renders full story         │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 2. AI PIPELINE DETAIL

### 2.1 Text Generation (GPT-4o)

**System Prompt:**
```
You are an expert children's story generator for ages 3-10.
All stories must be 100% safe: no graphic violence, no sexual content, no hate speech.
Always include positive moral lessons (friendship, respect, empathy, resilience).
Respond ONLY with valid JSON, no additional text.
```

**User Input:**
```json
{
  "child_name": "Lucia",
  "child_age": 6,
  "theme": "space adventure with pets",
  "values": ["friendship", "teamwork"],
  "duration": "short",
  "language": "es"
}
```

**Expected Output:**
```json
{
  "story_title": "Lucia and the Stellar Pet Crew",
  "moral_values": ["friendship", "teamwork"],
  "canonical_character_description": "Lucia, 6yo girl, curly brown hair, big brown eyes, blue spacesuit with planet patches; always accompanied by Max (medium brown dog, floppy ears, red bandana). Soft children's illustration style, vivid colors, warm magical atmosphere.",
  "chapters": [
    {
      "chapter_number": 1,
      "chapter_title": "The Backyard Rocket",
      "chapter_text": "...",
      "image_prompt": "Lucia in backyard with Max, looking at a small homemade rocket, orange sunset, soft children's illustration style.",
      "video_prompt": "Lucia in backyard, the homemade rocket slowly igniting as stars begin to appear."
    }
  ]
}
```

### 2.2 Image Generation (DALL-E 3 with Character Consistency)

**Strategy:**
1. Store `canonical_character_description` from text generation step
2. For each chapter, prepend canonical description to the chapter-specific image prompt
3. Use a fixed `seed` per story (stored in `stories.image_seed`) for visual consistency
4. Use DALL-E 3's `style: "natural"` for softer, child-friendly illustrations

**Prompt Construction:**
```
[canonical_character_description].
Illustration for chapter N: [chapter_title].
Scene: [image_prompt].
Style: children's book illustration, consistent character appearance across all chapters, soft watercolor textures, warm lighting.
```

### 2.3 Audio Generation (OpenAI TTS)

**Configuration:**
- Model: `gpt-4o-mini-tts`
- Voice: `alloy` or `echo` (warm, child-friendly)
- Speed: 0.9 (slightly slower for children)
- Format: `mp3`

**Per-chapter:**
```python
response = client.audio.speech.create(
    model="gpt-4o-mini-tts",
    voice="alloy",
    input=chapter_text,
    speed=0.9,
    response_format="mp3",
)
```

### 2.4 Video Generation (Luma Dream Machine)

**Mode: Image-to-Video (recommended for v1)**
- Input: chapter image URL + video_prompt
- Duration: 5-8 seconds
- Aspect ratio: 16:9
- Quality: standard

**API Flow:**
1. `POST https://api.lumalabs.ai/dream-machine/v1/generations` → returns `job_id`
2. Poll `GET /generations/{job_id}` or receive webhook
3. Download video URL when status = `completed`
4. Upload to Supabase Storage

---

## 3. DATABASE SCHEMA

See `database/schema.sql` for the complete SQL schema.

### Core Tables

| Table | Purpose |
|-------|---------|
| `users` | User profiles, subscriptions, usage quotas |
| `stories` | Story metadata, generation status, character descriptions |
| `chapters` | Individual chapter content (text, image, audio, video URLs) |
| `prompt_cache` | Cache of API responses to reduce costs |
| `generation_jobs` | Track async job status per chapter per modality |

---

## 4. SECURITY & MODERATION

### 4.1 Input Moderation
- OpenAI Moderation API (`omni-moderation-latest`) on all user input
- Custom blocklist for child-safety (regex + keyword matching)
- Reject before any AI generation if flagged

### 4.2 Output Moderation
- Moderate generated story text before saving
- Re-generate with stricter safety prompt if flagged (max 3 retries)
- Mark story as `failed` if moderation consistently fails

### 4.3 Image/Video Safety
- DALL-E 3 has built-in content filtering
- Luma Dream Machine has safety filters
- Optional: run generated media through vision moderation model

### 4.4 Access Control
- Supabase RLS policies on all tables
- JWT authentication via Supabase Auth
- Signed URLs for private media (time-limited access)

---

## 5. COST OPTIMIZATION

### 5.1 Prompt Caching
- Hash normalized prompts → check `prompt_cache` before API calls
- Reuse identical story structures, images, audio

### 5.2 Tier-based Generation
| Tier | Chapters | Image Size | Video Length |
|------|----------|------------|--------------|
| Free | 3 | 768x768 | None |
| Pro | 5 | 1024x1024 | 5s per chapter |
| Enterprise | 8 | 1024x1792 | 10s per chapter |

### 5.3 CDN & Edge Caching
- Supabase Storage serves via CDN
- Aggressive cache headers for media files
- API responses cached briefly (10-30s)

---

## 6. DEPLOYMENT

### Docker Compose Services
- `postgres` - PostgreSQL 16
- `redis` - Redis 7 for Celery broker/backend
- `fastapi` - AI orchestrator service
- `celery-worker` - Task processing
- `celery-beat` - Scheduled tasks (cleanup, retries)
- `nginx` - Reverse proxy (optional for production)

### Production
- Frontend: Vercel / Cloudflare Pages
- Backend: Railway / Render / AWS ECS
- Database: Supabase (managed PostgreSQL)
- Storage: Supabase Storage / AWS S3
- Queue: Upstash Redis / AWS ElastiCache

---

## 7. PROJECT STRUCTURE

```
CuentosMagicos_AI/
├── docs/
│   └── ARCHITECTURE.md          # This file
├── database/
│   └── schema.sql               # Complete PostgreSQL schema
├── backend/
│   ├── requirements.txt         # Python dependencies
│   ├── Dockerfile
│   └── app/
│       ├── main.py              # FastAPI application entry
│       ├── api/
│       │   ├── __init__.py
│       │   └── stories.py       # Story endpoints
│       ├── core/
│       │   ├── __init__.py
│       │   ├── config.py        # Settings (env vars)
│       │   ├── db.py            # Database connection
│       │   ├── celery_app.py    # Celery configuration
│       │   └── security.py      # Auth & moderation
│       ├── models/
│       │   ├── __init__.py
│       │   ├── schemas.py       # Pydantic schemas
│       │   └── orm.py           # SQLAlchemy models
│       ├── services/
│       │   ├── __init__.py
│       │   ├── story_planner.py # Text generation pipeline
│       │   ├── image_generation.py
│       │   ├── audio_generation.py
│       │   ├── video_generation.py
│       │   ├── moderation.py
│       │   └── storage.py       # Supabase/S3 upload
│       └── workers/
│           ├── __init__.py
│           └── webhooks.py      # Webhook handlers
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── postcss.config.mjs
│   ├── Dockerfile
│   └── app/
│       ├── layout.tsx
│       ├── page.tsx             # Landing page
│       ├── globals.css
│       ├── create/
│       │   └── page.tsx         # Story creation form
│       ├── stories/[id]/
│       │   └── page.tsx         # Story reader/player
│       └── api/stories/
│           ├── generate/
│           │   └── route.ts     # BFF: POST /api/stories/generate
│           └── [id]/
│               └── route.ts     # BFF: GET /api/stories/[id]
│   └── components/
│       ├── StoryForm.tsx
│       ├── StoryPlayer.tsx
│       ├── ChapterCarousel.tsx
│       ├── AudioControls.tsx
│       └── MediaToggle.tsx
├── docker-compose.yml
├── .env.example
└── README.md
```
