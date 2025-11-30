# VoiceFlow - AI Voice to Calendar Assistant

VoiceFlow is a full-stack productivity tool that converts voice notes into structured Google Calendar events instantly. It leverages React, Supabase, and Google Gemini 2.5 Flash to provide a seamless, latency-optimized experience.

## 🚀 Key Features

- **Voice-First Interface:** Record audio directly in the browser with visual feedback.

- **AI Intelligence:** Uses Gemini 2.5 Flash (Multimodal) to transcribe audio and extract date/time intent in a single pass.

- **Smart Date Handling:** Understands relative dates (e.g., "Lunch tomorrow at 2 PM") by injecting the user's local timezone context.

- **Secure Architecture:**

  - **Supabase Storage:** Private buckets with Row Level Security (RLS).

  - **Signed URLs:** Temporary access tokens for AI processing (no public files).

  - **Edge Functions:** Server-side AI processing to hide API keys.

- **Google Calendar Sync:** Direct integration with the user's primary calendar.

- **Optimistic UI:** Immediate interface feedback while background processes run.

## 🛠️ Tech Stack

**Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4.

**Backend:** Supabase (PostgreSQL, Auth, Storage, Edge Functions).

**AI Model:** Google Gemini 2.5 Flash (via Google AI Studio).

**Deployment:** Vercel (Frontend), Supabase (Backend).

## ⚙️ Prerequisites

- Node.js (v20+)

- Supabase Account

- Google Cloud Platform Project (for OAuth & Calendar API)

- Google AI Studio Key (for Gemini)

## 📦 Setup Guide

### 1. Clone & Install

```bash
git clone https://github.com/gabrielmarcano/voice-flow.git
cd voice-flow
npm install
```

### 2. Environment Variables

Create a .env.local file in the root:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-anon-key
```

### 3. Google Cloud Setup

1. Create a project in Google Cloud Console.

2. **Enable APIs:** Enable "Google Calendar API".

3. **OAuth Consent Screen:** Add https://your-project.supabase.co to Authorized Domains.

4. **Credentials:** Create OAuth 2.0 Client ID.

    - **Authorized Origins:** http://localhost:5173 (and your production URL).

    - **Redirect URIs:** https://your-project.supabase.co/auth/v1/callback.

### 4. Supabase Setup

### Auth

- Go to **Authentication** -> **Providers** -> **Google**.

- Paste your Client ID and Secret from Google Cloud.

- Scopes: Add https://www.googleapis.com/auth/calendar.

### Database Schema

Run this in the Supabase SQL Editor:

```sql
-- Create Tasks Table
create table tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  audio_url text,
  transcription text,
  title text,
  event_date timestamp with time zone,
  is_synced boolean default false
);

-- Enable RLS
alter table tasks enable row level security;

-- Policies
create policy "Users can see own tasks" on tasks
  for select using (auth.uid() = user_id);

create policy "Users can insert own tasks" on tasks
  for insert with check (auth.uid() = user_id);
```

### Storage

1. Create a Private bucket named `voice-notes`.

2. Add RLS Policy to allow authenticated uploads (SQL):

```sql
create policy "Allow Authenticated Uploads"
on storage.objects for insert to authenticated
with check ( bucket_id = 'voice-notes' );
```

### Edge Function

1. Go to your **Supabase Dashboard** and navigate to Edge Functions.

2. Click **Deploy a new Function** and name it `process-audio`.

3. Add a new secret and name it `GEMINI_API_KEY`.


## 🏃‍♂️ Running Locally

```bash
npm run dev
```

Open http://localhost:5173.

## 🔒 Security Note

This app uses **Signed URLs** for AI processing. The `voice-notes` bucket is private. When a user records audio:

1. File is uploaded to a private bucket.

2. Client requests a temporary (60s) signed URL.

3. Edge Function uses this temporary URL to process audio.

4. URL expires immediately after, keeping user data safe.