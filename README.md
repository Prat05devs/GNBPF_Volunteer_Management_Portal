# GNBPF Volunteer Management Portal

Production-ready portal for managing volunteers, attendance, tasks, and submissions for GNBPF. Built with Next.js 14, TypeScript, Prisma, Tailwind, and a PostgreSQL backend.

## Tech Stack

- **Frontend**: Next.js (App Router), React 18, Tailwind CSS, shadcn/ui components
- **State & Forms**: React Query, React Hook Form, Zod validation
- **Backend**: Next.js API routes, Prisma ORM, PostgreSQL
- **Auth**: JWT with httpOnly cookies, bcrypt password hashing
- **File uploads**: UploadThing (UTApi)
- **Tooling**: ESLint, Prettier, Vitest, pnpm

## Getting Started

```bash
pnpm install
pnpm prisma generate
pnpm prisma migrate dev
pnpm dev
```

Environment variables to configure (`.env.local`):

```ini
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
JWT_SECRET=replace-with-strong-secret
UPLOADTHING_APP_ID=your-uploadthing-app-id
UPLOADTHING_SECRET=your-uploadthing-secret
```

## Available Scripts

- `pnpm dev` – Start Next.js in development mode
- `pnpm build` / `pnpm start` – Production build and server
- `pnpm lint` – Run ESLint with Next.js configuration
- `pnpm test` – Run Vitest unit tests (`test:coverage` for coverage)

## Prisma

Schema lives in `prisma/schema.prisma`. Regenerate the client with `pnpm prisma generate`. Create migrations via `pnpm prisma migrate dev`.

## Project Structure

- `src/app` – Routes (auth, dashboard, API endpoints)
- `src/components` – UI primitives and feature-level components
- `src/lib` – Utilities (auth, db client, validations, uploads)
- `prisma` – Prisma schema
- `public` – Static assets

## Deployment

Designed for Vercel + managed PostgreSQL (Supabase/Railway). Ensure required environment variables are configured in your hosting platform. UploadThing credentials must be available on both server and client.

