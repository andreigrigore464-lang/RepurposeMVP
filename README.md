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

