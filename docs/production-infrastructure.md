# APEX production infrastructure

## Current target

- Frontend and initial API runtime: Next.js on Vercel.
- Database: standard PostgreSQL through Prisma.
- Initial PostgreSQL provider: Supabase, using `DATABASE_URL`.
- Storage: accessed only through `storageService`.
- Auth: accessed only through `authService`.
- Heavy jobs, workers, external syncs and long-running integrations: reserved for future Render services.

## Portability rules

- Do not import Supabase clients directly from UI, API routes or gestores.
- Do not put critical business logic in Vercel-specific APIs.
- Keep all database access behind repositories.
- Keep all file/object storage access behind `lib/server/services/storageService.ts`.
- Keep all auth/session access behind `lib/server/services/authService.ts`.
- Keep environment reads behind `lib/server/config/env.ts`.
- Every user-owned table must be scoped by `userId`.

## Required deployment variables

See `.env.example` for the full list. At minimum production needs:

- `DATABASE_URL`
- `AUTH_SECRET`
- `NEXT_PUBLIC_APP_URL`
- Provider credentials for enabled auth methods
- Storage variables for the selected storage driver
- `OPENAI_API_KEY` when AI is enabled

## Database workflow

Use standard Prisma commands:

```bash
npm run db:generate
npm run db:migrate
npm run db:deploy
```

Supabase and Render PostgreSQL both work by changing the PostgreSQL connection string, not the application code.
