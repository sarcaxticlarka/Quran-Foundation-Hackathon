# NOOR Backend — The Spiritual Operating System API

> Backend infrastructure powering Noor — a Quran-centered spiritual companion platform built for the Quran Foundation Hackathon 2026.

---

## 🔗 Quick Links

---


# Overview

**Noor Backend** powers the complete server-side ecosystem for Noor — handling authentication, Quran data orchestration, user persistence, spiritual progress tracking, halaqa collaboration, AI reflection systems, and notification scheduling.

The backend is designed around three principles:

- **Spiritual Continuity** → help Muslims stay connected after Ramadan
- **Scalability** → modular APIs + Prisma-backed Neon Postgres persistence
- **Personalization** → adaptive recommendations and AI reflection

The system combines:

- Noor email identities and Quran.Foundation identities from the mobile app
- Prisma + Neon Postgres
- Quran APIs
- AI reflection generation
- Notification orchestration
- Progress analytics
- Community synchronization

---

# Core Responsibilities

| System | Responsibility |
|---|---|
| Authentication | Noor email user IDs + Quran.Foundation OAuth identities from the mobile app |
| Database | User data persistence through Prisma/Neon |
| Quran Services | Verse, tafsir, translations, search |
| Review Engine | SM-2 spaced repetition scheduling |
| Community Engine | Halaqa create/join/leave/detail routes |
| AI Reflection | Journal-based reflection generation |
| Notification Service | Prayer reminders + review nudges |
| Analytics | Streaks, goals, engagement tracking |

---

# Quran.Foundation OAuth + Quran.com Proxy

The mobile app does not call Quran.com directly. Quran content, tafsir, search, and recitation metadata go through protected backend routes under `/api/quran/*`.

Required backend environment variables:

```env
QURAN_API_BASE_URL=https://api.quran.com/api/v4
QURAN_OAUTH_ENDPOINT=https://oauth2.quran.foundation
QURAN_OAUTH_CLIENT_ID=your_client_id
QURAN_OAUTH_CLIENT_SECRET=your_client_secret
DATABASE_URL=postgresql://...
INTERNAL_API_KEY=shared_backend_key
```

The backend exchanges `client_credentials` with Quran.Foundation, caches the short-lived bearer token, and attaches it to upstream Quran.com requests.

---

# Backend Architecture

```text
┌────────────────────────────────────────────┐
│                Client Apps                 │
│      React Native · Expo · Web Clients     │
└────────────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────┐
│                API Layer                   │
│  Auth · Quran · Review · Journal · Halaqa │
└────────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
┌────────────┐ ┌────────────┐ ┌────────────┐
│ Prisma     │ │ Quran APIs │ │ Groq AI    │
│ Neon       │ │ quran.com  │ │ Reflection │
│ Postgres   │ │ Aladhan    │ │ Generation │
└────────────┘ └────────────┘ └────────────┘
```

---

# Prisma / Neon

The database schema lives in `prisma/schema.prisma`. Apply it with:

```bash
npx prisma generate
npx prisma db push
```

The mobile app uses protected routes under `/api/db/*`; it never connects directly to Neon.

Email/password auth is handled by `/api/auth/signup` and `/api/auth/login`. The backend stores salted password hashes in `email_accounts`; email users use stable IDs in the form `email:<address>`.
