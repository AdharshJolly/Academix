# CampusFlow — Autonomous Academic Copilot

> Architecture Version: v1.2 (Frozen) | Last Updated: 2026-06-25

CampusFlow helps university students manage academic responsibilities through
AI-powered analysis and workflow automation.

---

## System Summary

| Layer              | Technology           | Platform  |
|--------------------|----------------------|-----------|
| Frontend           | Next.js 15 / TS      | Vercel    |
| Backend            | FastAPI / Python     | Render    |
| Database           | Supabase (PostgreSQL)| Supabase  |
| AI Engine          | Groq (Kimi K2)       | Render    |
| Automation         | n8n                  | Self-host |

---

## Architecture

```
Browser (Next.js)
      │
      ▼  HTTPS REST
FastAPI Backend (Render)
      │
      ├─▶ Supabase PostgreSQL
      ├─▶ Groq API  (Kimi K2 / Llama fallback)
      ├─▶ n8n Webhooks
      │       ├─▶ Google Calendar
      │       └─▶ WhatsApp (Twilio)
```

---

## Repository Structure

```
CampusFlow/
├── frontend/          Next.js 15 application (Vercel)
├── backend/           FastAPI application (Render)
├── docs/              All architecture and product documentation
├── prompts/           AI prompt templates
├── n8n/               Automation workflow specifications
├── scripts/           Utility scripts
├── assets/            Static assets and diagrams
└── .github/           CI/CD workflows
```

---

## Quick Start

See [docs/TDS.md](docs/TDS.md) for full developer setup instructions.

## Documentation Index

| Document                          | Purpose                          |
|-----------------------------------|----------------------------------|
| [PRD.md](docs/PRD.md)             | Product Requirements             |
| [TDS.md](docs/TDS.md)             | Technical Design Specification   |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System Architecture        |
| [API_SPEC.md](docs/API_SPEC.md)   | API Contract Reference           |
| [DATABASE.md](docs/DATABASE.md)   | Database Schema Reference        |
| [SCREEN_SPEC.md](docs/SCREEN_SPEC.md) | Frontend Screen Specifications |
| [DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md) | Hackathon Demo Script        |
| [PITCH.md](docs/PITCH.md)         | Pitch Deck Outline               |

