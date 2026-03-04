# TechOps Asset Manager - Plan de Implementación

## Visión General

Sistema de gestión de activos IT diseñado para reemplazar la herramienta HTML monolítica actual ("Gestión de Activos IT 3.0") con una aplicación web moderna, colaborativa y con persistencia real en base de datos.

**Origen**: Inspirado en Snipe-IT 8.4.0 (open source, Laravel/PHP) pero adaptado al flujo operativo real de la organización: asignación/devolución de equipos, celulares, insumos, integración con ServiceNow, y reconciliación de stock por sitio.

---

## Stack Tecnológico

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| **Frontend** | Next.js 15 (App Router) + React 19 + TypeScript | SSR/SSG, API routes integradas, App Router |
| **UI** | Tailwind CSS 4 + shadcn/ui | Componentes accesibles, dark mode nativo |
| **Tablas** | TanStack Table v8 | Paginación server-side, sort, filtros |
| **State** | TanStack Query v5 | Cache, sync, optimistic updates |
| **Forms** | react-hook-form + @hookform/resolvers + Zod | Validación declarativa, performance |
| **Charts** | Recharts | Dashboard y reportes visuales |
| **Excel** | SheetJS (xlsx) + JSZip | Import/export preservando formatos |
| **Database** | PostgreSQL 15 (on-premises) | Datos sensibles, sin cloud |
| **ORM** | Drizzle ORM 0.45 | Type-safe queries, migrations |
| **Auth** | Auth.js v5 (NextAuth beta) + JWT + bcrypt | Sessions 8h, Credentials provider |
| **Authorization** | Application-level middleware | Perfiles SAZ/LAS/ADMIN, permission matrix |
| **Deploy** | PM2 + nginx on Linux VM | Standalone build, on-premises |
| **Testing** | Vitest + Testing Library + Playwright | Unit, integration, E2E |

---

## Modelo de Datos

### Diagrama de Entidades

```
                    ┌─────────────┐
                    │   empresas  │
                    └──────┬──────┘
                           │
    ┌──────────┐    ┌──────┴──────┐    ┌──────────┐
    │  sitios  │◄───│colaboradores│    │  lineas  │
    └────┬─────┘    └──┬───┬───┬──┘    └────┬─────┘
         │             │   │   │            │
    ┌────┴─────┐  ┌────┘   │   └────┐      │
    │insumo_   │  │        │        │      │
    │stock     │  ▼        ▼        ▼      ▼
    └──────────┘┌──────┐┌───────┐┌───────┐┌───────┐
                │equipos││celul. ││monit. ││insumos│
                └──┬───┘└──┬────┘└───────┘└──┬────┘
                   │       │                 │
                   ▼       ▼                 ▼
              ┌──────────────────────────────────┐
              │         movimientos              │
              │    (audit trail central)         │
              └────────────┬─────────────────────┘
                           │
                    ┌──────┴──────┐
                    │tickets_snow │
                    └─────────────┘
```

### Tablas (14 en total)

Definidas en `src/lib/db/schema.ts` usando Drizzle TypeScript API:

| Tabla | Descripción |
|-------|------------|
| `empresas` | CMQ, FNC, PAMPA, NESTLE, CYMPAY |
| `sitios` | Ubicaciones físicas, jerárquicas (parent_id) |
| `colaboradores` | Empleados con datos Workday (global_id, legajo) |
| `equipos` | Notebooks, workstations, thin clients, macbooks |
| `celulares` | Celulares, tablets, modems |
| `lineas` | Líneas telefónicas (vinculadas a celulares) |
| `monitores` | Monitores (LED, Touch) |
| `insumos` | Insumos consumibles (cargadores, cables, etc.) |
| `insumo_stock` | Stock por sitio (cantidad por insumo+sitio) |
| `movimientos` | Audit trail centralizado (asignación, devolución, etc.) |
| `cortes_stock` | Snapshots periódicos de inventario por sitio |
| `tickets_snow` | Caché de tickets ServiceNow |
| `app_users` | Usuarios de la aplicación (no Workday) |

Todas usan UUID como primary key. Soft deletes via `deleted_at` (excepto insumos).

---

## Seguridad

| Mecanismo | Implementación |
|-----------|---------------|
| **Autenticación** | Auth.js v5, JWT sessions (8h), Credentials provider |
| **Contraseñas** | bcrypt (cost 12), política: min 8 chars + 1 mayúscula + 1 número |
| **Account lockout** | 5 intentos fallidos → bloqueo 15 min (in-memory) |
| **Autorización** | Permission matrix SAZ/LAS/ADMIN en `permissions.ts` |
| **API Guard** | `withAuth()` HOF: rate limit → CSRF → auth → Zod → handler |
| **Rate limiting** | In-memory con cleanup automático (100 reads/15min, 30 writes/15min, 10 login/15min) |
| **CSRF** | Origin validation para métodos mutantes (POST/PATCH/DELETE) |
| **Input validation** | Zod schemas en todas las rutas API |
| **Security headers** | CSP, HSTS, X-Frame-Options en next.config.ts |
| **XSS prevention** | Sanitización en bookmarklet ServiceNow |

---

## Fases de Implementación

### FASE 0: Fundación ✅ COMPLETA

- Proyecto Next.js 15 con App Router + TypeScript
- PostgreSQL 15 + Drizzle ORM (14 tablas, relaciones, índices)
- Auth.js v5 con JWT (8h), login page, middleware
- Permisos SAZ/LAS/ADMIN con permission matrix
- Security headers en next.config.ts
- ServiceNow hybrid mode (clipboard/bookmarklet default, API cuando hay token)
- Seed: admin user, 5 empresas, 15 sitios

### FASE 1: CRUD + Búsqueda + Seguridad ✅ COMPLETA

#### Seguridad integrada
- Rate limiter con cleanup automático y LRU eviction (max 10K entries)
- CSRF validation para métodos mutantes
- API Guard composable (`withAuth`) con rate limit + CSRF + Zod
- Password policy (8 chars, 1 mayúscula, 1 número)
- Account lockout (5 intentos → 15 min)
- XSS fix en bookmarklet ServiceNow
- Rate limiting en login (10/15min por IP)

#### Infraestructura UI
- 23 componentes shadcn/ui instalados
- QueryProvider (staleTime 5min, retry 1) + Toaster (sonner)
- Sidebar con navegación, perfil badge, logout
- DataTable genérica (TanStack Table v8, paginación server-side, sort, search, loading)
- Componentes compartidos: StatusBadge, PageHeader, FormDialog, ConfirmDialog
- Utilidades: apiFetch, toQueryString, formatDate/DateTime, extractIdFromPath

#### Validaciones Zod (7 archivos)
- common (paginationSchema, uuidParamSchema)
- auth (loginSchema, passwordSchema, createUserSchema)
- colaborador, equipo, celular, monitor, insumo (create, update, search schemas)

#### Service Layer (6 servicios)
- colaboradores: list (paginado + join empresa/sitio), getById (con equipos/celulares/monitores asignados), create, update, softDelete, search (autocomplete)
- equipos: list (join empresa/colaborador/sitio), getById (con últimos 20 movimientos), create, update, softDelete
- celulares: list (join empresa/colaborador/linea/sitio), getById, create, update, softDelete
- monitores: list (join colaborador/sitio), getById, create, update, softDelete
- insumos: list (con stockTotal calculado), getById (con stockEntries), create, update, delete, adjustStock (upsert, nunca negativo), getStockBySitio
- dashboard: getDashboardStats (equipos, celulares, insumos bajo stock, movimientos 30d)

#### Custom Hooks (7 archivos)
- CRUD hooks para cada módulo (useList, useById, useCreate, useUpdate, useDelete)
- useAdjustStock para insumos
- useDashboardStats
- useEmpresas, useSitios (staleTime 30min)

#### API Routes (15 rutas protegidas)
- GET/POST: empresas, sitios, colaboradores, equipos, celulares, monitores, insumos
- GET/PATCH/DELETE: colaboradores/[id], equipos/[id], celulares/[id], monitores/[id], insumos/[id]
- POST: insumos/stock (ajuste de stock)
- GET: dashboard/stats

#### Módulos UI (5 módulos completos)
- **Colaboradores**: tabla con búsqueda (nombre/legajo/email), filtros, CRUD, detalle con assets asignados en tabs
- **Equipos**: tabla con búsqueda (serial/hostname/modelo), StatusBadge, CRUD, detalle con tabs de movimientos
- **Celulares**: tabla con búsqueda (IMEI/modelo/marca), línea asignada, CRUD, detalle
- **Monitores**: tabla con búsqueda (serial/marca/modelo), obsoleto badge, CRUD, detalle
- **Insumos**: tabla con stock total (badge rojo si < mín), ajuste de stock por sitio, CRUD, detalle con tabla de stock entries

#### Dashboard
- KPI cards: Equipos total, Celulares total, Insumos bajo stock, Movimientos 30d
- Cards de resumen: Equipos (total/activos/stock/obsoletos), Celulares (total/activos/stock/robados)

#### Tests
- vitest.config.ts con jsdom, path aliases
- Tests unitarios: rate-limit, csrf, format, route-helpers, query-string

---

### FASE 2: Operaciones Core (Pendiente)

- Motor de asignación (buscar colaborador → seleccionar equipo/celular/insumo → ejecutar)
- Motor de devolución (seleccionar activos → estado de devolución → liberar)
- Procesos especiales: ROBO, ROAMING, RECAMBIO, ONBOARDING, OFFBOARDING
- Historial de movimientos (tabla centralizada, filtros, timeline)
- Cada operación genera un movimiento en audit trail

### FASE 3: ServiceNow + Reportes (Pendiente)

- Integración ServiceNow API mode (cuando hay credenciales)
- Corte de stock (snapshot de inventario por sitio, reconciliación)
- Reportes: inventario por sitio, obsolescencia, equipos a recuperar
- Import/Export avanzado desde Excel (QLP, Equipamiento AR)
- Export preservando formato template original

### FASE 4: Colaboración + Polish (Pendiente)

- Panel de administración de usuarios
- Gestión de catálogos (empresas, sitios)
- Notificaciones: stock bajo, garantías por vencer, corte pendiente
- Responsive design (tablet-friendly)
- PWA + modo offline
- CI/CD con GitHub Actions

---

## Estructura de Carpetas (Actual)

```
techops-asset-manager/
├── src/
│   ├── app/
│   │   ├── (auth)/login/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx              # Dashboard
│   │   │   ├── colaboradores/
│   │   │   │   ├── page.tsx          # Lista
│   │   │   │   └── [id]/page.tsx     # Detalle
│   │   │   ├── equipos/
│   │   │   ├── celulares/
│   │   │   ├── monitores/
│   │   │   └── insumos/
│   │   ├── api/
│   │   │   ├── empresas/route.ts
│   │   │   ├── sitios/route.ts
│   │   │   ├── colaboradores/
│   │   │   │   ├── route.ts          # GET list + POST create
│   │   │   │   └── [id]/route.ts     # GET + PATCH + DELETE
│   │   │   ├── equipos/
│   │   │   ├── celulares/
│   │   │   ├── monitores/
│   │   │   ├── insumos/
│   │   │   │   ├── route.ts
│   │   │   │   ├── [id]/route.ts
│   │   │   │   └── stock/route.ts    # POST adjust stock
│   │   │   ├── dashboard/stats/route.ts
│   │   │   └── servicenow/route.ts
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                       # ~23 shadcn/ui components
│   │   ├── layout/sidebar.tsx
│   │   ├── tables/
│   │   │   ├── data-table.tsx
│   │   │   ├── data-table-toolbar.tsx
│   │   │   ├── data-table-pagination.tsx
│   │   │   ├── data-table-column-header.tsx
│   │   │   ├── data-table-row-actions.tsx
│   │   │   └── columns/
│   │   │       ├── colaboradores-columns.tsx
│   │   │       ├── equipos-columns.tsx
│   │   │       ├── celulares-columns.tsx
│   │   │       ├── monitores-columns.tsx
│   │   │       └── insumos-columns.tsx
│   │   ├── forms/
│   │   │   ├── colaborador-form.tsx
│   │   │   ├── equipo-form.tsx
│   │   │   ├── celular-form.tsx
│   │   │   ├── monitor-form.tsx
│   │   │   ├── insumo-form.tsx
│   │   │   └── stock-adjustment-form.tsx
│   │   ├── dashboard/
│   │   │   ├── kpi-card.tsx
│   │   │   └── dashboard-content.tsx
│   │   ├── shared/
│   │   │   ├── status-badge.tsx
│   │   │   ├── page-header.tsx
│   │   │   ├── form-dialog.tsx
│   │   │   └── confirm-dialog.tsx
│   │   └── providers/
│   │       └── query-provider.tsx
│   └── lib/
│       ├── auth/
│       │   ├── config.ts             # NextAuth + lockout
│       │   ├── permissions.ts        # SAZ/LAS/ADMIN matrix
│       │   ├── api-guard.ts          # withAuth() HOF
│       │   └── types.ts
│       ├── db/
│       │   ├── schema.ts             # 14 tables + relations
│       │   └── index.ts              # postgres connection
│       ├── middleware/
│       │   ├── rate-limit.ts
│       │   └── csrf.ts
│       ├── services/
│       │   ├── colaboradores.ts
│       │   ├── equipos.ts
│       │   ├── celulares.ts
│       │   ├── monitores.ts
│       │   ├── insumos.ts
│       │   ├── dashboard.ts
│       │   └── servicenow.ts
│       ├── hooks/
│       │   ├── use-colaboradores.ts
│       │   ├── use-equipos.ts
│       │   ├── use-celulares.ts
│       │   ├── use-monitores.ts
│       │   ├── use-insumos.ts
│       │   ├── use-dashboard.ts
│       │   └── use-catalogos.ts
│       ├── validations/
│       │   ├── auth.ts
│       │   ├── common.ts
│       │   ├── colaborador.ts
│       │   ├── equipo.ts
│       │   ├── celular.ts
│       │   ├── monitor.ts
│       │   └── insumo.ts
│       ├── types/database.ts
│       └── utils/
│           ├── constants.ts
│           ├── format.ts
│           ├── api.ts
│           ├── query-string.ts
│           └── route-helpers.ts
├── tests/
│   ├── setup.ts
│   └── unit/
│       ├── middleware/
│       │   ├── rate-limit.test.ts
│       │   └── csrf.test.ts
│       └── utils/
│           ├── format.test.ts
│           ├── route-helpers.test.ts
│           └── query-string.test.ts
├── CLAUDE.md
├── PLAN.md
├── vitest.config.ts
├── package.json
├── tsconfig.json
├── next.config.ts
└── drizzle.config.ts
```

---

## Métricas de Éxito

| Métrica | Actual | Objetivo |
|---------|--------|----------|
| Tiempo para asignar equipo | ~3 min (Excel + bookmarklet + copiar) | < 30 seg (buscar + click + auto INC) |
| Reconciliación de stock | ~2 horas (manual en Excel) | < 15 min (automático con diferencias) |
| Colaboración | 0 (local) | Multi-usuario con permisos |
| Datos perdidos | Todo (localStorage) | Nunca (PostgreSQL) |
| Reportes | Manual export Excel | 1 click, automático |
| Auditoría | Solo sesión actual | Completo, permanente, por operador |
