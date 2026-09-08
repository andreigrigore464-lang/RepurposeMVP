# Repurpose SaaS (MVP)

An AI-powered content repurposing and social distribution platform built with Next.js 15, Gemini AI, Cloudinary, and Templated.io.

## Architecture Overview

Repurpose MVP transforms long-form content (blog posts, articles, RSS feeds) into high-performing social assets (LinkedIn PDF carousels, Instagram slide decks, and social cards).

- **Framework**: Next.js 15 (App Router, React 19, TypeScript)
- **Styling & UI**: TailwindCSS v4, shadcn/ui, Lucide Icons
- **Database & ORM**: PostgreSQL, Prisma ORM
- **AI Engine**: Google Gemini API (Structured JSON prompt chains)
- **Media & Rendering**: Cloudinary (Brand assets & slide images) & Templated.io (Automated slide rendering)
- **Document Generation**: `pdf-lib` (Swipeable LinkedIn PDF carousels)

## Getting Started

### 1. Prerequisites
- Node.js 20+
- PostgreSQL database
- API Keys: Google Gemini, Cloudinary, Templated.io, Unsplash

### 2. Environment Setup
Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

### 3. Install Dependencies & Generate Prisma Client
```bash
npm install
npx prisma generate
```

### 4. Database Migrations
```bash
npx prisma migrate dev --name init
```

### 5. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## SDD Specification Reference
Specifications are located in `D:\Work\AI\Specs\Gemini`:
- `00_OVERVIEW_AND_SYSTEM_ARCHITECTURE.md` - System Architecture & Modular Monolith Topology
- `01_DOMAIN_MODEL_AND_DATA_SCHEMAS.md` - Domain Model & PostgreSQL Schemas
- `02_INTEGRATIONS_AND_OAUTH_ENGINE.md` - Integrations & Connectors
- `03_WORKFLOWS_AND_AUTOMATION_ENGINE.md` - Workflow Engine & Density Guard
- `05_AI_ENHANCEMENT_AND_METADATA_ENGINE.md` - Gemini AI Prompt Chains & Schemas
- `07_FRONTEND_AND_UI_UX_SPEC.md` - UI/UX & Studio Quick-Editor
- `09_TEMPLATED_CLOUDINARY_AND_FORMAT_MATRIX.md` - Templated.io & Cloudinary Pipelines
- `11_TASK_BOARD_AND_GIT_WORKFLOW.md` - Task Board & Execution Plan
