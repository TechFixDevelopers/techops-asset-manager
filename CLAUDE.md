# TechOps Asset Manager - Project Rules

## Project Overview
IT Asset Management system for tracking equipment (notebooks, workstations), celulares (phones), insumos (supplies), monitores, and their assignment to colaboradores (employees). Integrates with ServiceNow for incident ticket creation. Runs **entirely on-premises** within the corporate network.

## Tech Stack
- **Frontend**: Next.js 15 (App Router) + React 18 + TypeScript
- **UI**: Tailwind CSS 4 + shadcn/ui
- **Tables**: TanStack Table v8
- **State**: TanStack Query v5
- **Database**: PostgreSQL 15 (on-premises) + Drizzle ORM
- **Auth**: Auth.js v5 (NextAuth) + JWT + bcrypt
- **Authorization**: Application-level permission middleware (SAZ/LAS/ADMIN profiles)
- **Excel**: SheetJS (xlsx) + JSZip
- **Charts**: Recharts
- **Testing**: Vitest + Testing Library + Playwright
- **Deploy**: PM2 + nginx on Linux VM (standalone build)

## Architecture Rules

### File Organization
- Pages go in `src/app/(dashboard)/[module]/page.tsx`
- API routes go in `src/app/api/[module]/route.ts`
- Reusable components go in `src/components/`
- Business logic goes in `src/lib/services/`
- Custom hooks go in `src/lib/hooks/`
- Types go in `src/lib/types/`
- Database schema and connection in `src/lib/db/`
- Auth config and permissions in `src/lib/auth/`
- Security middleware in `src/lib/middleware/`

### Naming Conventions
- Files: kebab-case (`equipo-form.tsx`, `use-equipos.ts`)
- Components: PascalCase (`EquipoForm`, `DataTable`)
- Functions/hooks: camelCase (`useEquipos`, `createMovimiento`)
- Database tables: snake_case (`cortes_stock`, `insumo_stock`)
- Types: PascalCase (`Equipo`, `Colaborador`, `Movimiento`)
- Constants: UPPER_SNAKE_CASE (`ESTADO_ACTIVO`, `TIPO_NOTEBOOK`)

### Code Style
- Always use TypeScript strict mode
- Prefer `interface` over `type` for object shapes
- Use Zod for runtime validation of API inputs
- All API routes must validate input and return typed responses
- Use server components by default, `'use client'` only when needed
- Prefer server-side data fetching with TanStack Query for client cache

### Database
- Always use parameterized queries (Drizzle ORM handles this)
- All tables use UUID primary keys
- Soft deletes via `deleted_at` column (never hard delete inventory)
- Audit trail: every state change creates a `movimientos` record
- Schema defined in `src/lib/db/schema.ts` using Drizzle's TypeScript API
- Types inferred from schema via `InferSelectModel` / `InferInsertModel`
- Use text columns + Zod validation instead of pgEnum (domain values change frequently)

### Authorization
- Three profiles: SAZ (field operator), LAS (read-only), ADMIN (full access)
- Permission matrix defined in `src/lib/auth/permissions.ts`
- API routes protected via `withAuth(action, resource, handler)` guard
- Route-level protection via Next.js middleware (`src/middleware.ts`)
- JWT sessions (8h duration, no database sessions)

### Business Logic
- Asignación: always validate stock availability before assigning
- Devolución: always require estado de devolución
- Movimientos: every assign/return/transfer must log a movimiento
- Stock: insumo quantities must never go negative
- ServiceNow: always attempt to link INC number to movimiento

### Domain Language (Spanish)
The application uses Spanish domain terminology:
- `equipo` = hardware device (notebook, workstation, etc.)
- `celular` = mobile phone/tablet
- `insumo` = supply/consumable
- `colaborador` = employee
- `legajo` = employee ID number
- `sitio` = physical location/site
- `movimiento` = inventory movement (assign, return, etc.)
- `corte de stock` = physical inventory count snapshot
- `asignación` = assignment (checkout)
- `devolución` = return (checkin)

### UI/UX
- Colors: brand-celeste (#54A0D6), brand-orange (#FF6B00)
- Support dark/light mode via Tailwind `dark:` classes
- Status badges must use consistent colors across the app
- Tables must support: search, filter, sort, pagination, export
- Forms must validate on blur and show inline errors
- Loading states on all async operations
- Toast notifications for success/error feedback

### Security
- Never expose DATABASE_URL or AUTH_SECRET to client
- Validate all user input server-side with Zod
- All API routes use `withAuth()` guard for authorization
- Security headers configured in `next.config.ts` (CSP, HSTS, X-Frame-Options)
- Rate limiting on API routes (in-memory, stricter on login)
- CSRF validation on mutating requests
- Passwords hashed with bcrypt (cost factor 12)
- Sanitize data before Excel export
- Application runs on-premises only — no cloud services for data

### Testing
- Unit test all service functions (business logic)
- Integration test all API routes
- E2E test critical flows (login, assign, return, report)
- Test data: use factories/fixtures, never production data

## ServiceNow Integration (Hybrid Mode)
- Base URL: `https://abinbevww.service-now.com`
- API: REST Table API (`/api/now/table/incident`)
- **Mode detection**: automatic based on env vars
  - API mode: when SERVICENOW_INSTANCE_URL, USERNAME, PASSWORD are all set
  - Clipboard/bookmarklet mode (default): generates text + JS bookmarklet for manual entry
- Fields: caller_id, assignment_group, short_description, description, u_symptom, contact_type, impact, urgency, category, u_select_zone, location
- Service: `src/lib/services/servicenow.ts`

## Environment Variables
Required in `.env.local`:
```
DATABASE_URL=postgresql://user:password@localhost:5432/techops_assets
AUTH_SECRET=<generated-hex-string>
AUTH_URL=http://localhost:3000

# Optional (without these, clipboard/bookmarklet mode is used)
SERVICENOW_INSTANCE_URL=https://abinbevww.service-now.com
SERVICENOW_USERNAME=
SERVICENOW_PASSWORD=
```

## Deployment (On-Premises)
- Build: `npm run build` (generates `.next/standalone/`)
- Run: PM2 with `ecosystem.config.js`
- Proxy: nginx reverse proxy to localhost:3000
- DB: PostgreSQL 15 on same VM or internal DB server
