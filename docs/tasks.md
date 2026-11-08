# Engineering Tasks Breakdown — URL Shortener

**Project:** Production URL Shortener  
**Author:** Senior Staff Software Engineer & System Architect  
**Architecture:** TypeScript Monorepo (React + Vite + Express + Prisma + PostgreSQL 17)  
**Tracking Document:** `docs/tasks.md`  
**Reference Document:** `docs/implementation-plan.md`

---

## Task Management & Execution Matrix

This document provides the granular, actionable task breakdown for the end-to-end implementation of the URL Shortener application. Each task defines its identifier, priority, complexity, explicit dependencies, impacted files, detailed engineering specifications, and verifiable Definition of Done (DoD).

### Priority Legend
- **P0 (Critical / Blocker):** Foundational architecture, database integrity, core redirect path, auth boundary.
- **P1 (High):** Primary user flows, management CRUD, analytics aggregation, essential UI components.
- **P2 (Medium):** UI polish, secondary filters, advanced charts, operational diagnostics, non-critical optimizations.

### Complexity Legend
- **S (Small):** 1–2 hours (straightforward config, utility function, isolated component).
- **M (Medium):** Half day (module controller + service, database migration, complex form).
- **L (Large):** 1–2 days (full end-to-end subsystem, complex UI feature, multi-service integration).
- **XL (Extra Large):** 3+ days (architectural scaffolding, multi-tier testing framework, production deployment).

---

## Phase 0: Workspace Architecture, Tooling & Shared Contracts

### [TASK-001] [COMPLETED] Monorepo Workspace Initialization & Tooling
- **Status:** COMPLETED
- **Priority:** P0 | **Complexity:** M | **Dependencies:** None
- **Target Files:**
  - `package.json`
  - `.npmrc`
  - `.gitignore`
  - `.editorconfig`
  - `.prettierrc`
  - `packages/config/tsconfig.base.json`
  - `packages/config/eslint-preset.js`
  - `packages/config/package.json`
- **Scope & Specifications:**
  - Initialize root `package.json` with npm/pnpm workspaces: `["apps/*", "packages/*"]`.
  - Configure root scripts: `dev`, `build`, `test`, `lint`, `typecheck`, `clean`.
  - Configure `.gitignore` for Node.js, Vite build outputs, Prisma generated client, `.env` secrets, coverage reports.
  - Setup base TypeScript configuration in `packages/config/tsconfig.base.json` targeting ES2022 with `strict: true`, `moduleResolution: "node"`, `skipLibCheck: true`.
  - Setup unified ESLint configuration with TypeScript-ESLint, React hooks rules, and Prettier integration.
- **Verification / DoD:**
  - Running `npm run typecheck` and `npm run lint` from root executes across all packages without errors.

---

### [TASK-002] [COMPLETED] Shared Contracts Package (`packages/shared`)
- **Status:** COMPLETED
- **Priority:** P0 | **Complexity:** M | **Dependencies:** TASK-001
- **Target Files:**
  - `packages/shared/package.json`
  - `packages/shared/tsconfig.json`
  - `packages/shared/src/index.ts`
  - `packages/shared/src/constants/index.ts`
  - `packages/shared/src/types/index.ts`
  - `packages/shared/src/schemas/auth.schema.ts`
  - `packages/shared/src/schemas/link.schema.ts`
  - `packages/shared/src/schemas/query.schema.ts`
- **Scope & Specifications:**
  - Define domain constants:
    - Base62 character set: `0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ`.
    - Default short-code length: 7 characters.
    - Reserved system aliases blocklist: `api`, `admin`, `login`, `register`, `dashboard`, `health`, `ready`, `metrics`, `favicon.ico`, `s`, `static`, `assets`, `null`, `undefined`.
    - System error codes enum: `VALIDATION_ERROR`, `UNAUTHENTICATED`, `FORBIDDEN`, `LINK_NOT_FOUND`, `CODE_CONFLICT`, `LINK_EXPIRED_OR_INACTIVE`, `RATE_LIMITED`, `INTERNAL_ERROR`.
  - Define domain interfaces:
    - `UserDto`, `LinkDto`, `ClickEventDto`, `LinkAnalyticsDto`, `DashboardOverviewDto`.
    - Generic API envelope types: `ApiSuccess<T>`, `ApiError`, `PaginatedMeta`, `ValidationErrorDetail`.
  - Implement Zod validation schemas:
    - `registerSchema`: Email format, password min 8 chars (1 uppercase, 1 lowercase, 1 number, 1 special character).
    - `loginSchema`: Email and password presence.
    - `createLinkSchema`: Destination URL validation (strict `http:` and `https:`, valid hostname, max 2048 chars), optional `customAlias` (3-32 chars, regex `^[a-zA-Z0-9_-]+$`), optional `expiresAt` (ISO UTC future date).
    - `updateLinkSchema`: Optional `destinationUrl`, optional `isActive` (boolean), optional `expiresAt` (nullable date).
    - `paginationQuerySchema`: `page` (min 1, default 1), `limit` (min 1, max 100, default 20), `search` (optional string), `status` (`all` | `active` | `inactive` | `expired`).
    - `analyticsQuerySchema`: `from` (optional ISO date), `to` (optional ISO date).
- **Verification / DoD:**
  - `npm run build -w packages/shared` compiles `.d.ts` and `.js` outputs cleanly.
  - Unit tests verify schema rejections of invalid URLs (`javascript:...`, non-HTTP, private IPs) and malformed aliases.

---

## Phase 1: Database Architecture & Data Access Foundation

### [TASK-003] Local Containerized PostgreSQL 17 Setup
- **Priority:** P0 | **Complexity:** S | **Dependencies:** TASK-001
- **Target Files:**
  - `docker-compose.yml`
  - `.env.example`
- **Scope & Specifications:**
  - Define PostgreSQL 17 service in `docker-compose.yml` (`image: postgres:17`, container: `url-shortener-db`).
  - Expose port `5432:5432`.
  - Setup persistent volume `postgres_data:/var/lib/postgresql/data`.
  - Configure default local environment variables: `POSTGRES_USER=shortener`, `POSTGRES_PASSWORD=local_password`, `POSTGRES_DB=shortener`.
  - Provide root `.env.example` documenting `DATABASE_URL=postgresql://shortener:local_password@localhost:5432/shortener`.
- **Verification / DoD:**
  - `docker compose up -d` starts container; `pg_isready -h localhost -p 5432 -U shortener` returns exit code 0.

---

### [TASK-004] Prisma Schema Modeling & Canonical Migrations
- **Priority:** P0 | **Complexity:** M | **Dependencies:** TASK-002, TASK-003
- **Target Files:**
  - `apps/api/prisma/schema.prisma`
  - `apps/api/prisma/migrations/0_init/migration.sql`
- **Scope & Specifications:**
  - Configure generator: `provider = "prisma-client-js"`.
  - Configure datasource: `provider = "postgresql"`, `url = env("DATABASE_URL")`.
  - Define `UserRole` enum: `USER`, `ADMIN`.
  - Model `User` (`users` table):
    - `id UUID @id @default(uuid())`, `email VARCHAR(320) @unique`, `passwordHash VARCHAR(255) @map("password_hash")`, `role UserRole @default(USER)`, `createdAt TIMESTAMPTZ`, `updatedAt TIMESTAMPTZ`.
    - Relation to `Link[]`.
  - Model `Link` (`links` table):
    - `id UUID @id @default(uuid())`, `userId UUID @map("user_id")`, `code VARCHAR(32) @unique`, `destinationUrl TEXT @map("destination_url")`, `isActive BOOLEAN @default(true)`, `expiresAt TIMESTAMPTZ?`, `createdAt TIMESTAMPTZ`, `updatedAt TIMESTAMPTZ`.
    - Relation to `User` (`onDelete: Restrict`).
    - Relation to `ClickEvent[]`.
    - Composite indexes: `@@index([userId, createdAt(sort: Desc)])` and `@@index([expiresAt])`.
  - Model `ClickEvent` (`click_events` table):
    - `id UUID @id @default(uuid())`, `linkId UUID @map("link_id")`, `clickedAt TIMESTAMPTZ @default(now())`, `referrer VARCHAR(512)?`, `deviceType VARCHAR(64)?`, `countryCode VARCHAR(2)?`.
    - Relation to `Link` (`onDelete: Cascade`).
    - Composite index: `@@index([linkId, clickedAt(sort: Desc)])`.
  - Generate initial migration SQL: `npx prisma migrate dev --name init`.
  - Verify migration SQL includes strict constraints (`CHECK (length(code) > 0)` and `CHECK (length(destination_url) > 0)`).
- **Verification / DoD:**
  - `npx prisma migrate status` reports database schema is up to date with zero drift.
  - Foreign key cascade properly cleans up `click_events` upon link deletion.

---

### [TASK-005] Prisma Client Singleton & Connection Lifecycle
- **Priority:** P0 | **Complexity:** S | **Dependencies:** TASK-004
- **Target Files:**
  - `apps/api/src/database/db.ts`
  - `apps/api/src/database/health.ts`
- **Scope & Specifications:**
  - Implement `PrismaClient` singleton avoiding multiple connections during development hot reloading.
  - Configure connection pool settings (`DATABASE_POOL_MAX`, `DATABASE_CONNECT_TIMEOUT_MS`).
  - Implement graceful shutdown hook: bind `process.on('SIGTERM')` and `process.on('SIGINT')` to call `prisma.$disconnect()`.
  - Implement database health check function: `checkDatabaseConnection()` executing `SELECT 1;`.
- **Verification / DoD:**
  - `checkDatabaseConnection()` resolves to `true` when database is up and catches errors returning `false` when database is down.

---

### [TASK-006] Development Database Seeder
- **Priority:** P1 | **Complexity:** S | **Dependencies:** TASK-005
- **Target Files:**
  - `apps/api/prisma/seed.ts`
- **Scope & Specifications:**
  - Create idempotent seed script generating:
    - 1 Admin user (`admin@shortener.local` with known password hash).
    - 1 Standard test user (`user@shortener.local`).
    - 10 Links for standard user (5 active with generated codes, 2 with custom aliases, 2 expired, 1 deactivated).
    - 100+ Synthetic `click_events` distributed across the active links spanning the last 14 days, with randomized referrers (`twitter.com`, `linkedin.com`, `google.com`, `direct`), device types (`desktop`, `mobile`, `tablet`), and country codes (`US`, `IN`, `GB`, `DE`).
- **Verification / DoD:**
  - `npx prisma db seed` runs idempotently without primary key or unique code collision errors.

---

## Phase 2: Backend Architecture & Core Infrastructure

### [TASK-007] Startup Environment Validation
- **Priority:** P0 | **Complexity:** S | **Dependencies:** TASK-001
- **Target Files:**
  - `apps/api/src/config/env.ts`
- **Scope & Specifications:**
  - Define Zod schema validating: `NODE_ENV`, `PORT`, `DATABASE_URL`, `DIRECT_URL`, `APP_BASE_URL`, `FRONTEND_URL`, `SESSION_SECRET`, `LOG_LEVEL`.
  - Validate `process.env` immediately upon module import.
  - If validation fails, format errors clearly into console.error and call `process.exit(1)`.
  - Export strongly typed `env` configuration object across the backend.
- **Verification / DoD:**
  - Starting the backend without `DATABASE_URL` or `SESSION_SECRET` aborts immediately with exit code 1 and descriptive validation messages.

---

### [TASK-008] Security, CORS & Request Parsing Middleware
- **Priority:** P0 | **Complexity:** S | **Dependencies:** TASK-007
- **Target Files:**
  - `apps/api/src/middleware/security.middleware.ts`
  - `apps/api/src/app.ts`
- **Scope & Specifications:**
  - Configure `helmet()` for HTTP response security headers (HSTS, frameguard, XSS filter, no-sniff).
  - Configure `cors()`:
    - Allowed origin: `env.FRONTEND_URL`.
    - `credentials: true`.
    - Allowed methods: `['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS']`.
    - Allowed headers: `['Content-Type', 'Authorization', 'X-Request-Id', 'X-CSRF-Token']`.
  - Setup body parsers: `express.json({ limit: '100kb' })` and `express.urlencoded({ extended: true, limit: '100kb' })`.
  - Setup signed cookie parser: `cookieParser(env.SESSION_SECRET)`.
- **Verification / DoD:**
  - Cross-origin requests from unapproved domains are rejected with CORS policy errors. Preflight `OPTIONS` requests respond with 204.

---

### [TASK-009] Request ID & Structured Logging Engine
- **Priority:** P0 | **Complexity:** M | **Dependencies:** TASK-007
- **Target Files:**
  - `apps/api/src/middleware/request-id.middleware.ts`
  - `apps/api/src/middleware/logger.middleware.ts`
  - `apps/api/src/utils/logger.ts`
- **Scope & Specifications:**
  - Implement request ID middleware: check incoming `X-Request-Id` or generate fresh UUID v4; attach to `req.id` and set outgoing header `X-Request-Id`.
  - Setup Pino structured logger:
    - Log format: JSON in production, pretty-printed in development.
    - Fields: `timestamp`, `level`, `reqId`, `method`, `path`, `statusCode`, `durationMs`, `userId` (when authenticated).
    - Redact sensitive keys: `password`, `passwordHash`, `cookie`, `authorization`, `token`.
  - Implement HTTP request logging middleware recording request duration upon `res.on('finish')`.
- **Verification / DoD:**
  - Every API response contains `X-Request-Id`; terminal logs output structured JSON entries matching request IDs.

---

### [TASK-010] Centralized Error Envelope Handler
- **Priority:** P0 | **Complexity:** M | **Dependencies:** TASK-002, TASK-009
- **Target Files:**
  - `apps/api/src/errors/app-error.ts`
  - `apps/api/src/middleware/error.middleware.ts`
- **Scope & Specifications:**
  - Define custom domain error classes:
    - `AppError` (base class with `statusCode`, `errorCode`, `isOperational`).
    - `ValidationError` (`400`, `VALIDATION_ERROR`, includes `details: ValidationErrorDetail[]`).
    - `UnauthorizedError` (`401`, `UNAUTHENTICATED`).
    - `ForbiddenError` (`403`, `FORBIDDEN`).
    - `NotFoundError` (`404`, `LINK_NOT_FOUND` / `NOT_FOUND`).
    - `ConflictError` (`409`, `CODE_CONFLICT`).
    - `GoneError` (`410`, `LINK_EXPIRED_OR_INACTIVE`).
    - `RateLimitError` (`429`, `RATE_LIMITED`).
  - Implement Express error-handling middleware `(err, req, res, next)`:
    - Map Zod validation errors to `ValidationError`.
    - Map Prisma unique constraint violations (`P2002`) to `ConflictError`.
    - Format output into the standard envelope:
      ```json
      {
        "error": {
          "code": "ERROR_CODE",
          "message": "Safe human message",
          "details": [ ... ],
          "requestId": "req_uuid"
        }
      }
      ```
    - Sanitize unexpected `500` errors in production: hide stack traces and database error internals; log detailed error with `req.id`.
- **Verification / DoD:**
  - Triggering a validation error or unexpected throw returns standardized JSON error envelope with correct HTTP status code and request ID.

---

### [TASK-011] Operational Health & Readiness Probes
- **Priority:** P0 | **Complexity:** S | **Dependencies:** TASK-005, TASK-010
- **Target Files:**
  - `apps/api/src/modules/health/health.routes.ts`
  - `apps/api/src/modules/health/health.controller.ts`
- **Scope & Specifications:**
  - `GET /health` (Liveness): Returns `200 OK` with JSON `{ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() }`.
  - `GET /ready` (Readiness): Checks database connectivity via `checkDatabaseConnection()`. If true, returns `200 OK` `{ status: "ready", database: "connected" }`. If false, returns `503 Service Unavailable` `{ status: "unhealthy", database: "disconnected" }`.
  - Exclude health endpoints from verbose request logging to prevent log pollution from automated polling.
- **Verification / DoD:**
  - Calling `/health` returns 200; calling `/ready` returns 200 when PostgreSQL is running and 503 when PostgreSQL is stopped.

---

## Phase 3: Authentication & Session Management Subsystem

### [TASK-012] Password Hashing & Verification Engine
- **Priority:** P0 | **Complexity:** S | **Dependencies:** TASK-001
- **Target Files:**
  - `apps/api/src/modules/auth/password.service.ts`
- **Scope & Specifications:**
  - Implement `hashPassword(password: string): Promise<string>` using Argon2id (or bcrypt with salt factor 12).
  - Implement `verifyPassword(hash: string, plaintext: string): Promise<boolean>` with constant-time comparison to prevent timing analysis attacks.
  - Enforce memory sanitization where applicable; ensure plaintext passwords are never stored in temporary variables or logged.
- **Verification / DoD:**
  - Unit test verifies correct password matching, rejects incorrect password, and confirms different salts produce different hashes for identical inputs.

---

### [TASK-013] Session Token & Cookie Management Service
- **Priority:** P0 | **Complexity:** M | **Dependencies:** TASK-007
- **Target Files:**
  - `apps/api/src/modules/auth/session.service.ts`
- **Scope & Specifications:**
  - Generate cryptographically secure random session tokens: `crypto.randomBytes(32).toString('hex')`.
  - Configure session cookie options helper:
    - `httpOnly: true`.
    - `secure: env.NODE_ENV === 'production'`.
    - `sameSite: 'lax'`.
    - `maxAge: 7 * 24 * 60 * 60 * 1000` (7 days).
    - `path: '/'`.
  - Implement session rotation: Invalidate old session identifier and issue a fresh session token upon credential authentication.
  - Implement cookie clear helper for logout.
- **Verification / DoD:**
  - Inspection of Set-Cookie header confirms presence of `HttpOnly`, `SameSite=Lax`, and `Secure` (in production mode).

---

### [TASK-014] Authentication Controller & Core Endpoints
- **Priority:** P0 | **Complexity:** M | **Dependencies:** TASK-004, TASK-012, TASK-013
- **Target Files:**
  - `apps/api/src/modules/auth/auth.controller.ts`
  - `apps/api/src/modules/auth/auth.service.ts`
  - `apps/api/src/modules/auth/auth.routes.ts`
- **Scope & Specifications:**
  - `POST /api/v1/auth/register`:
    - Validate payload against `registerSchema`.
    - Normalize email (lowercase and trim).
    - Check if email already exists; return `409 Conflict` if registered.
    - Hash password using `password.service`.
    - Persist user with `role: USER`.
    - Issue session cookie and return `201 Created` with `UserDto` (`id`, `email`, `role`, `createdAt`).
  - `POST /api/v1/auth/login`:
    - Validate payload against `loginSchema`.
    - Find user by normalized email.
    - If user not found or `verifyPassword` fails: return generic `401 UNAUTHENTICATED` ("Invalid email or password").
    - Rotate session, set HTTP-only session cookie, and return `200 OK` with `UserDto`.
  - `POST /api/v1/auth/logout`:
    - Invalidate active session.
    - Clear session cookie.
    - Return `200 OK` with `{ data: { success: true } }`.
  - `GET /api/v1/auth/me`:
    - Retrieve active authenticated user from session.
    - Return `200 OK` with `UserDto`.
- **Verification / DoD:**
  - Full registration -> login -> /auth/me -> logout flow tested with Supertest; unauthorized /auth/me returns 401.

---

### [TASK-015] Authentication & Role Authorization Middleware
- **Priority:** P0 | **Complexity:** S | **Dependencies:** TASK-014
- **Target Files:**
  - `apps/api/src/middleware/auth.middleware.ts`
- **Scope & Specifications:**
  - Implement `requireAuth` middleware:
    - Read session token from signed cookie.
    - Validate token against active session store or verify session validity.
    - Attach authenticated user payload to `req.user` (`id`, `email`, `role`).
    - If missing or invalid: throw `UnauthorizedError('Authentication required')`.
  - Implement `requireRole(role: UserRole)` middleware:
    - Verify `req.user.role === role`.
    - If mismatched: throw `ForbiddenError('Insufficient privileges')`.
- **Verification / DoD:**
  - Request to protected route without cookie returns 401; request with invalid session token returns 401.

---

### [TASK-016] Authentication Brute-Force Rate Limiter & CSRF Defense
- **Priority:** P1 | **Complexity:** S | **Dependencies:** TASK-014
- **Target Files:**
  - `apps/api/src/middleware/rate-limit.middleware.ts`
  - `apps/api/src/middleware/csrf.middleware.ts`
- **Scope & Specifications:**
  - Implement sliding-window rate limiter for auth routes using in-memory token bucket / sliding log:
    - Limit `POST /api/v1/auth/login` and `POST /api/v1/auth/register` to max 5 failed attempts per 15 minutes per IP.
    - Exceeding limit throws `RateLimitError` (`429 RATE_LIMITED`).
  - Implement CSRF defense:
    - Verify `SameSite=Lax` cookie configuration.
    - For mutating API requests (`POST`, `PATCH`, `DELETE`), require custom header `X-Requested-With: XMLHttpRequest` or double-submit CSRF token.
- **Verification / DoD:**
  - Rapid succession of 6 failed login attempts returns 429 status on the 6th attempt with `Retry-After` header.

---

## Phase 4: URL Management & Short-Code Generation Engine

### [TASK-017] Cryptographically Secure Base62 Code Generator
- **Priority:** P0 | **Complexity:** S | **Dependencies:** TASK-002
- **Target Files:**
  - `apps/api/src/modules/links/code-generator.ts`
- **Scope & Specifications:**
  - Use Base62 alphabet `0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ`.
  - Length: 7 characters ($62^7 \approx 3.52 \text{ trillion}$ combinations).
  - Algorithm: Use `crypto.randomInt(0, 62)` to select characters with zero modulo bias.
  - Implement helper `generateShortCode(length = 7): string`.
- **Verification / DoD:**
  - Unit test runs 50,000 code generations; verifies 100% adherence to 7-character Base62 regex and uniform distribution across characters.

---

### [TASK-018] Destination URL Validation & SSRF Prevention Engine
- **Priority:** P0 | **Complexity:** M | **Dependencies:** TASK-002
- **Target Files:**
  - `apps/api/src/modules/links/url-validator.ts`
- **Scope & Specifications:**
  - Parse destination URL with WHATWG `new URL(input)`.
  - Enforce permitted protocols: Only `http:` and `https:`. Reject `javascript:`, `data:`, `file:`, `ftp:`, `ws:`.
  - Enforce hostname presence and formatting: Must contain valid domain labels with TLD, or valid public IPv4.
  - Implement SSRF defense:
    - Reject loopback (`127.0.0.1`, `localhost`, `::1`).
    - Reject private RFC 1918 subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`).
    - Reject link-local / cloud metadata IPs (`169.254.169.254`).
  - Enforce maximum length limit: 2048 characters.
  - Normalize destination URL: Strip extraneous whitespace and normalize casing of scheme and hostname.
- **Verification / DoD:**
  - Unit test suite validates 30+ edge case URLs: accepts valid external domains; rejects internal IPs, metadata endpoints, and script payloads.

---

### [TASK-019] Custom Alias & Reserved Words Validation Engine
- **Priority:** P0 | **Complexity:** S | **Dependencies:** TASK-002
- **Target Files:**
  - `apps/api/src/modules/links/alias-validator.ts`
- **Scope & Specifications:**
  - Validate custom alias length: Min 3, max 32 characters.
  - Validate character set: Regex `^[a-zA-Z0-9_-]+$`.
  - Validate reserved words: Check lowercase alias against `RESERVED_ALIASES` blocklist.
  - Case-sensitivity policy: Store and query custom aliases case-sensitively, but perform case-insensitive reserved-word matching.
- **Verification / DoD:**
  - Rejects reserved system words (e.g. `api`, `admin`, `dashboard`) with `400 VALIDATION_ERROR`. Rejects punctuation and spaces.

---

### [TASK-020] Collision-Resilient Link Creation Service
- **Priority:** P0 | **Complexity:** M | **Dependencies:** TASK-004, TASK-017, TASK-018, TASK-019
- **Target Files:**
  - `apps/api/src/modules/links/links.service.ts`
- **Scope & Specifications:**
  - Implement `createLink({ userId, destinationUrl, customAlias, expiresAt })`:
    - Validate destination URL with `url-validator`.
    - If `customAlias` provided:
      - Validate format and reserved words with `alias-validator`.
      - Check uniqueness in database; if exists, throw `ConflictError('Custom alias is already in use')`.
      - Set `code = customAlias`.
    - If `customAlias` omitted:
      - Enter collision retry loop (max 5 retries):
        - Generate random short code with `code-generator`.
        - Attempt database insert.
        - Catch Prisma unique constraint violation on `code` (`P2002`); on collision, log warning and increment retry counter.
      - If loop exceeds 5 attempts, throw `ConflictError('Unable to generate unique code. Please retry.')`.
    - Set `userId: userId`, `isActive: true`, `expiresAt: expiresAt || null`.
    - Persist `Link` record and return `LinkDto`.
- **Verification / DoD:**
  - Integration test simulates database unique constraint conflict on first attempt; verifies service retries and succeeds on second attempt.

---

### [TASK-021] User Link Management CRUD Endpoints
- **Priority:** P0 | **Complexity:** M | **Dependencies:** TASK-015, TASK-020
- **Target Files:**
  - `apps/api/src/modules/links/links.controller.ts`
  - `apps/api/src/modules/links/links.routes.ts`
- **Scope & Specifications:**
  - `POST /api/v1/links`: Calls `linksService.createLink`, returns `201 Created` with `LinkDto`.
  - `GET /api/v1/links`:
    - Authenticate via `requireAuth`.
    - Parse query params (`page`, `limit`, `search`, `status`).
    - Scope query strictly to `where: { userId: req.user.id }`.
    - Filter by status (`active`, `inactive`, `expired`).
    - Filter by search: `OR: [{ code: { contains: search, mode: 'insensitive' } }, { destinationUrl: { contains: search, mode: 'insensitive' } }]`.
    - Query total count and paginated records (`skip`, `take`, `orderBy: { createdAt: 'desc' }`).
    - Include click counts: `_count: { select: { clickEvents: true } }`.
    - Return `200 OK` with `{ data: LinkDto[], meta: { page, limit, totalItems, totalPages } }`.
  - `GET /api/v1/links/:id`:
    - Scope query strictly: `where: { id: req.params.id, userId: req.user.id }`.
    - If not found: throw `NotFoundError('Link not found')`.
    - Return `200 OK` with `LinkDto`.
  - `PATCH /api/v1/links/:id`:
    - Validate body against `updateLinkSchema`.
    - Scope query strictly by `id` and `userId`.
    - Update fields: `destinationUrl` (re-validated), `isActive`, `expiresAt`.
    - Return `200 OK` with updated `LinkDto`.
  - `PATCH /api/v1/links/:id/deactivate` & `PATCH /api/v1/links/:id/reactivate`:
    - Status toggle endpoints updating `isActive` boolean.
  - `DELETE /api/v1/links/:id`:
    - Scope query strictly by `id` and `userId`.
    - Delete link; verify Prisma schema cascades deletion to `click_events`.
    - Return `200 OK` with `{ data: { success: true } }`.
- **Verification / DoD:**
  - User A creates a link; User B attempts to access `GET /api/v1/links/:userALinkId` and receives 404. Deleting a link removes it from database.

---

## Phase 5: High-Performance Public Redirect Engine

### [TASK-022] Stateless Public Redirect Route Handler
- **Priority:** P0 | **Complexity:** M | **Dependencies:** TASK-004, TASK-010
- **Target Files:**
  - `apps/api/src/modules/redirects/redirects.routes.ts`
  - `apps/api/src/modules/redirects/redirects.controller.ts`
  - `apps/api/src/modules/redirects/redirects.service.ts`
- **Scope & Specifications:**
  - Mount public route: `GET /:code` at application root level.
  - Bypass authentication middleware; route must remain public and stateless.
  - Validate short code format: 1 to 32 characters, Base62 / alias characters.
  - Execute indexed database query:
    ```typescript
    const link = await prisma.link.findUnique({
      where: { code },
      select: { id: true, destinationUrl: true, isActive: true, expiresAt: true },
    });
    ```
  - State evaluation tree:
    - If `!link`: Return `HTTP 404 Not Found` (clean user-friendly HTML error or JSON).
    - If `!link.isActive`: Return `HTTP 410 Gone` with message "Link has been deactivated by owner".
    - If `link.expiresAt && new Date() >= link.expiresAt`: Return `HTTP 410 Gone` with message "Link has expired".
  - If valid:
    - Set response header: `Location: link.destinationUrl`.
    - Set response header: `Cache-Control: no-cache, no-store, must-revalidate`.
    - Set response header: `Pragma: no-cache`.
    - Send `HTTP 302 Found`.
- **Verification / DoD:**
  - Supertest tests verify: valid link returns 302 with correct Location; expired/disabled link returns 410; nonexistent link returns 404.

---

### [TASK-023] Non-Blocking Asynchronous Click Dispatcher
- **Priority:** P0 | **Complexity:** M | **Dependencies:** TASK-022
- **Target Files:**
  - `apps/api/src/modules/redirects/click-dispatcher.ts`
- **Scope & Specifications:**
  - Implement decoupled event dispatch mechanism:
    - Extract request metadata before sending response:
      - `linkId: link.id`
      - `referrer: req.headers.referer || req.headers.referrer`
      - `userAgent: req.headers['user-agent']`
      - `countryCode: req.headers['cf-ipcountry'] || req.headers['x-country-code']`
    - Dispatch click event asynchronously via `setImmediate()` or Node EventEmitter.
  - Guarantee redirect isolation: Wrap dispatcher call in an isolated error boundary; database write failures must NEVER alter or delay the 302 redirect response.
- **Verification / DoD:**
  - Benchmark / test confirms 302 response completes in < 20ms without waiting for click persistence; simulated database error does not crash server or fail redirect.

---

## Phase 6: Privacy-Aware Analytics Subsystem

### [TASK-024] Click Event Privacy Sanitizer & Persistence Service
- **Priority:** P0 | **Complexity:** M | **Dependencies:** TASK-004, TASK-023
- **Target Files:**
  - `apps/api/src/modules/analytics/analytics.sanitizer.ts`
  - `apps/api/src/modules/analytics/analytics.service.ts`
- **Scope & Specifications:**
  - **Zero Raw IP Storage:** Do not persist client IP address under any circumstances.
  - **Referrer Sanitization:**
    - Parse raw referrer with `new URL()`.
    - Extract hostname only (e.g. `twitter.com`, `linkedin.com`, `google.com`).
    - Strip all path segments, query strings, and auth tokens.
    - If referrer absent or malformed: Record as `"direct"`.
  - **Device Type Classification:**
    - Parse `User-Agent` header with lightweight regex classifier.
    - Categorize into broad buckets: `'desktop'`, `'mobile'`, or `'tablet'`.
    - Do not store raw user-agent string.
  - **Country Code Validation:**
    - Validate country code against ISO 3166-1 alpha-2 format (2 uppercase letters).
    - If invalid or absent: Record as `null`.
  - **Persistence:**
    - Insert record into `click_events`:
      ```typescript
      await prisma.clickEvent.create({
        data: { linkId, clickedAt: new Date(), referrer, deviceType, countryCode },
      });
      ```
- **Verification / DoD:**
  - Unit tests verify referrer path/query parameters are stripped; raw user-agent is reduced to desktop/mobile/tablet; database record contains no raw IP.

---

### [TASK-025] Link-Specific Analytics Aggregation Endpoint
- **Priority:** P1 | **Complexity:** M | **Dependencies:** TASK-015, TASK-024
- **Target Files:**
  - `apps/api/src/modules/analytics/analytics.controller.ts`
  - `apps/api/src/modules/analytics/analytics.routes.ts`
- **Scope & Specifications:**
  - `GET /api/v1/links/:id/analytics`:
    - Authenticate via `requireAuth`.
    - Verify link exists and is owned by `req.user.id`.
    - Parse date filter query parameters (`from`, `to`). Default to last 30 days if omitted.
    - Execute aggregation queries in UTC:
      - `totalClicks`: Count of click events for `linkId` within date window.
      - `series`: Daily click counts bucketed by calendar date (`date: YYYY-MM-DD`, `clicks: number`).
      - `trafficSources`: Top referrers grouped by `referrer` with count, sorted descending.
      - `deviceDistribution`: Counts grouped by `deviceType` (`desktop`, `mobile`, `tablet`).
      - `geographicDistribution`: Counts grouped by `countryCode`, sorted descending.
    - Return `200 OK` with `LinkAnalyticsDto`.
- **Verification / DoD:**
  - Integration test verifies returned analytics match seeded click events; cross-user analytics access is rejected with 404.

---

### [TASK-026] Dashboard Overview Analytics Aggregation Endpoint
- **Priority:** P1 | **Complexity:** M | **Dependencies:** TASK-015, TASK-025
- **Target Files:**
  - `apps/api/src/modules/analytics/analytics.controller.ts`
- **Scope & Specifications:**
  - `GET /api/v1/analytics/overview`:
    - Authenticate via `requireAuth`.
    - Parse date filter query parameters (`from`, `to`). Default to last 30 days.
    - Query aggregate metrics across ALL links owned by `req.user.id`:
      - `totalLinks`: Total count of links owned by the user.
      - `totalClicks`: Total aggregate clicks across all user's links.
      - `clicksOverTime`: Daily aggregated click series across all user links.
      - `trafficSources`: Consolidated top referrers across all user links.
      - `deviceDistribution`: Consolidated device category counts.
      - `geographicDistribution`: Consolidated country distribution.
    - Return `200 OK` with `DashboardOverviewDto`.
- **Verification / DoD:**
  - Integration test verifies overview endpoint returns accurate aggregated totals across multiple links belonging to the authenticated user.

---

## Phase 7: Frontend Application & Interactive Dashboard

### [TASK-027] Frontend Project Scaffolding & MUI Theme System
- **Priority:** P0 | **Complexity:** M | **Dependencies:** TASK-001
- **Target Files:**
  - `apps/web/package.json`
  - `apps/web/vite.config.ts`
  - `apps/web/index.html`
  - `apps/web/src/theme/index.ts`
  - `apps/web/src/theme/palette.ts`
  - `apps/web/src/App.tsx`
  - `apps/web/src/main.tsx`
- **Scope & Specifications:**
  - Setup Vite + React 18/19 + TypeScript.
  - Configure Material UI (MUI v5/v6) with custom theme:
    - Primary color: Deep Indigo (`#4F46E5`); Secondary: Emerald (`#10B981`); Error: Crimson (`#EF4444`).
    - Custom typography scale (Inter font family).
    - Light and dark theme palettes with `CssBaseline`.
    - Local storage persistence for theme mode switch.
  - Setup React Router v6/v7.
  - Setup TanStack Query v5 `QueryClientProvider` with default cache options (`staleTime: 5 mins`, `retry: 1`).
- **Verification / DoD:**
  - `npm run dev -w apps/web` loads landing page; theme mode switches cleanly between light and dark modes.

---

### [TASK-028] API Client & TanStack Query Service Layer
- **Priority:** P0 | **Complexity:** S | **Dependencies:** TASK-002, TASK-027
- **Target Files:**
  - `apps/web/src/services/api-client.ts`
  - `apps/web/src/services/query-keys.ts`
- **Scope & Specifications:**
  - Setup Axios instance with `baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'`.
  - Configure `withCredentials: true` on all requests to pass HTTP-only session cookies.
  - Setup response interceptor extracting standard error envelope messages and redirecting to `/login` on `401 UNAUTHENTICATED`.
  - Setup query key factory:
    ```typescript
    export const queryKeys = {
      auth: { me: ['auth', 'me'] as const },
      links: {
        all: ['links'] as const,
        list: (filters: Record<string, unknown>) => ['links', 'list', filters] as const,
        detail: (id: string) => ['links', 'detail', id] as const,
        analytics: (id: string, range?: string) => ['links', 'analytics', id, range] as const,
      },
      analytics: {
        overview: (range?: string) => ['analytics', 'overview', range] as const,
      },
    };
    ```
- **Verification / DoD:**
  - API client correctly attaches cookies and throws normalized error objects when backend returns error envelopes.

---

### [TASK-029] Authentication Feature Views & RequireAuth Wrapper
- **Priority:** P0 | **Complexity:** M | **Dependencies:** TASK-028
- **Target Files:**
  - `apps/web/src/features/auth/AuthContext.tsx`
  - `apps/web/src/features/auth/useAuth.ts`
  - `apps/web/src/features/auth/RequireAuth.tsx`
  - `apps/web/src/features/auth/LoginPage.tsx`
  - `apps/web/src/features/auth/RegisterPage.tsx`
- **Scope & Specifications:**
  - Create `AuthContext` providing `user`, `isLoading`, `login()`, `register()`, `logout()`.
  - Implement `LoginPage`:
    - Responsive card layout with brand logo.
    - Email and password inputs with React Hook Form + Zod resolver (`loginSchema`).
    - Error banner displaying backend validation messages.
    - "Don't have an account? Sign up" link.
    - Redirect to dashboard (or return URL) upon login.
  - Implement `RegisterPage`:
    - Email, password, and confirm password inputs with React Hook Form + Zod resolver (`registerSchema`).
    - Password complexity indicator bar.
    - Error banner.
    - Redirect to dashboard upon registration.
  - Implement `<RequireAuth>` wrapper:
    - Renders loading spinner / skeleton while checking session status.
    - Redirects unauthenticated visitors to `/login` with target path preserved in location state.
- **Verification / DoD:**
  - Attempting to visit `/dashboard` when logged out redirects to `/login`. Logging in redirects back to `/dashboard`.

---

### [TASK-030] Application Shell, Navigation & Layout
- **Priority:** P1 | **Complexity:** M | **Dependencies:** TASK-027, TASK-029
- **Target Files:**
  - `apps/web/src/components/layout/AppLayout.tsx`
  - `apps/web/src/components/layout/TopNavbar.tsx`
  - `apps/web/src/components/layout/Sidebar.tsx`
  - `apps/web/src/components/layout/ToastProvider.tsx`
- **Scope & Specifications:**
  - Implement responsive top navigation bar: Brand logo, theme toggle button, "Create Link" CTA button, user profile menu with logout action.
  - Implement responsive sidebar drawer: Navigation items for Dashboard (`/dashboard`), Links (`/links`), Analytics (`/analytics`). Collapsible on mobile screens.
  - Implement global Toast / Notification system for immediate user feedback on mutations (success, error, link copied).
- **Verification / DoD:**
  - Navigation drawer collapses into hamburger menu on mobile viewports (< 768px); theme toggle and logout functions operate smoothly.

---

### [TASK-031] Dashboard Overview View & Quick-Create Widget
- **Priority:** P1 | **Complexity:** M | **Dependencies:** TASK-028, TASK-030
- **Target Files:**
  - `apps/web/src/features/dashboard/DashboardPage.tsx`
  - `apps/web/src/features/dashboard/QuickCreateCard.tsx`
  - `apps/web/src/features/dashboard/MetricSummaryCards.tsx`
  - `apps/web/src/features/dashboard/RecentLinksTable.tsx`
- **Scope & Specifications:**
  - **Metric Summary Cards:**
    - Total Links card, Total Clicks card, 7-Day Click Activity card, Active Links card.
    - Display skeleton loaders while data is fetching.
  - **Quick Create Widget:**
    - Prominent card with destination URL text input.
    - Instant "Shorten" button triggering `useCreateLink` mutation.
    - Upon success: Displays created short URL with 1-click copy button and success alert.
  - **Recent Links Section:**
    - Compact table showing the 5 most recently created links.
    - Short code, destination URL (truncated), click counter, quick copy icon.
- **Verification / DoD:**
  - Entering a URL in the quick-create widget creates the link, refreshes dashboard metrics, and displays the short link with functioning copy button.

---

### [TASK-032] Links Management Data Table & Filtering
- **Priority:** P1 | **Complexity:** L | **Dependencies:** TASK-028, TASK-030
- **Target Files:**
  - `apps/web/src/features/links/LinksListPage.tsx`
  - `apps/web/src/features/links/LinksTable.tsx`
  - `apps/web/src/features/links/LinkStatusBadge.tsx`
  - `apps/web/src/features/links/LinkSearchFilter.tsx`
- **Scope & Specifications:**
  - **Search & Filter Bar:**
    - Debounced search input (300ms) matching short code or destination.
    - Status filter dropdown (`All`, `Active`, `Disabled`, `Expired`).
    - "New Link" button opening Create Link Modal.
  - **Links Data Table:**
    - Columns: Short URL (with copy icon), Destination URL (truncated with hover tooltip), Status Badge (`Active`, `Disabled`, `Expired`), Total Clicks, Created Date, Expiration Date, Actions Menu (`...`).
    - Row Actions Menu: Copy Short URL, View Analytics, Edit Link, Toggle Active/Inactive, Delete Link.
    - Pagination controls: Page size selector (10, 25, 50 rows), previous/next page navigation.
    - Loading skeletons for table rows.
    - Empty state view when no links match search/filter criteria.
- **Verification / DoD:**
  - Searching by keyword filters table dynamically; switching status filter updates query parameters and renders matching records.

---

### [TASK-033] Create, Edit & Delete Link Modals
- **Priority:** P1 | **Complexity:** M | **Dependencies:** TASK-032
- **Target Files:**
  - `apps/web/src/features/links/CreateLinkModal.tsx`
  - `apps/web/src/features/links/EditLinkModal.tsx`
  - `apps/web/src/features/links/DeleteLinkDialog.tsx`
- **Scope & Specifications:**
  - **Create Link Modal:**
    - Destination URL input with real-time protocol validation.
    - Optional Custom Alias accordion with validation rules and reserved-word warnings.
    - Optional Expiration date-time picker.
    - Submit button with spinner. Upon success: Shows short URL, 1-click copy action, and QR code preview.
  - **Edit Link Modal:**
    - Input to update destination URL.
    - Switch to activate/deactivate link (`isActive`).
    - Date picker to modify or remove expiration date.
  - **Delete Link Dialog:**
    - Warning dialog stating deletion is permanent and deletes all associated click events.
    - Confirm button executing delete mutation; invalidates `links` query cache upon completion.
- **Verification / DoD:**
  - Creating, editing, and deleting a link updates the table immediately without manual page refresh.

---

### [TASK-034] Interactive Analytics Dashboard & Charts (Recharts)
- **Priority:** P1 | **Complexity:** L | **Dependencies:** TASK-028, TASK-030
- **Target Files:**
  - `apps/web/src/features/analytics/LinkAnalyticsPage.tsx`
  - `apps/web/src/features/analytics/DashboardAnalyticsPage.tsx`
  - `apps/web/src/features/analytics/ClicksOverTimeChart.tsx`
  - `apps/web/src/features/analytics/DeviceBreakdownChart.tsx`
  - `apps/web/src/features/analytics/TrafficSourcesTable.tsx`
  - `apps/web/src/features/analytics/GeographicDistributionTable.tsx`
- **Scope & Specifications:**
  - Recharts integration:
    - **Clicks Over Time:** Responsive `AreaChart` / `LineChart` showing daily clicks with hover tooltips and UTC date labels.
    - **Device Breakdown:** `PieChart` / donut chart displaying percentages for desktop, mobile, tablet.
    - **Traffic Sources Table:** Top referrer domains with click volume and percentage share progress bars.
    - **Geographic Distribution Table:** Country code table displaying country flag, click volume, and percentage share.
  - Date Range Presets: Last 7 Days, Last 30 Days, Last 90 Days buttons.
  - Create `LinkAnalyticsPage` (`/links/:id/analytics`): Deep dive for a single link.
  - Create `DashboardAnalyticsPage` (`/analytics`): Overview across all user links.
- **Verification / DoD:**
  - Charts resize responsively across screen widths, handle zero clicks with clean empty states, and render tooltips smoothly.

---

## Phase 8: Comprehensive Multi-Tier Testing Suite

### [TASK-035] Vitest Unit Testing Framework & Utility Tests
- **Priority:** P0 | **Complexity:** M | **Dependencies:** TASK-017, TASK-018, TASK-019
- **Target Files:**
  - `apps/api/src/modules/links/code-generator.spec.ts`
  - `apps/api/src/modules/links/url-validator.spec.ts`
  - `apps/api/src/modules/links/alias-validator.spec.ts`
  - `apps/api/src/modules/analytics/analytics.sanitizer.spec.ts`
  - `apps/api/src/errors/error-mapper.spec.ts`
- **Scope & Specifications:**
  - Configure Vitest for `apps/api`.
  - Write test suites:
    - `code-generator`: 7-char length, Base62 regex check, uniform distribution.
    - `url-validator`: Valid HTTP/HTTPS, rejection of javascript/file/data schemes, SSRF rejection of 127.0.0.1, 10.0.0.0/8, 169.254.169.254, max length.
    - `alias-validator`: Length, allowed characters, reserved words rejection.
    - `analytics.sanitizer`: Hostname-only referrer extraction, user-agent device classification, ISO country validation, absence of raw IP.
- **Verification / DoD:**
  - `npm run test` executes all unit tests with 100% pass rate and > 90% logic coverage.

---

### [TASK-036] Supertest Backend API Integration Test Suite
- **Priority:** P0 | **Complexity:** L | **Dependencies:** TASK-014, TASK-021, TASK-022, TASK-025
- **Target Files:**
  - `apps/api/test/auth.integration.spec.ts`
  - `apps/api/test/links.integration.spec.ts`
  - `apps/api/test/redirect.integration.spec.ts`
  - `apps/api/test/analytics.integration.spec.ts`
  - `apps/api/test/setup.ts`
- **Scope & Specifications:**
  - Setup isolated PostgreSQL test database connection and schema migration before running integration tests.
  - Write test suites:
    - `auth.integration`: Registration, duplicate email rejection, login, session cookie validation, logout, `/auth/me`, rate limit trigger.
    - `links.integration`: Link creation, custom alias, collision retry handling, paginated listing, update, delete.
    - **Ownership Isolation Test:** Verify User B cannot access, modify, or delete User A's links (receives 404).
    - `redirect.integration`: Active link returns 302 with Location header; disabled link returns 410; expired link returns 410; nonexistent code returns 404. Non-blocking click dispatch verification.
    - `analytics.integration`: Click event insertion, link analytics aggregation, dashboard overview aggregation.
- **Verification / DoD:**
  - All integration tests pass against test PostgreSQL database without leaving orphan records.

---

### [TASK-037] Playwright End-to-End Test Suite
- **Priority:** P1 | **Complexity:** L | **Dependencies:** TASK-029, TASK-031, TASK-032, TASK-034
- **Target Files:**
  - `playwright.config.ts`
  - `tests/e2e/link-lifecycle.spec.ts`
  - `tests/e2e/custom-alias.spec.ts`
  - `tests/e2e/expiration.spec.ts`
  - `tests/e2e/deactivation.spec.ts`
  - `tests/e2e/tenant-isolation.spec.ts`
- **Scope & Specifications:**
  - Configure Playwright with Chromium, Firefox, and WebKit targets.
  - Implement critical user journeys:
    - **Journey 1 (Full Lifecycle):** Register user -> Log in -> Create short link -> Copy short link -> Navigate to short URL in new page -> Verify 302 redirect to target destination -> Return to dashboard -> Verify click count incremented to 1.
    - **Journey 2 (Custom Alias):** Create short link with alias `playwright-test` -> Open `http://localhost:5000/playwright-test` -> Verify target reached.
    - **Journey 3 (Expiration):** Create link with past expiration -> Open short link -> Verify 410 Gone page displayed.
    - **Journey 4 (Deactivation):** Deactivate link -> Open short link -> Verify 410 Gone -> Reactivate link -> Open short link -> Verify 302 redirect.
    - **Journey 5 (Multi-Tenant Isolation):** User A creates a link; User B attempts direct URL navigation to User A's link ID; verify 404 page is rendered.
- **Verification / DoD:**
  - `npx playwright test` runs headlessly and passes all 5 journeys.

---

## Phase 9: Production Containerization, CI/CD & Cloud Deployment

### [TASK-038] Production Multi-Stage Dockerfile & Packaging
- **Priority:** P0 | **Complexity:** S | **Dependencies:** TASK-010
- **Target Files:**
  - `apps/api/Dockerfile`
  - `apps/api/.dockerignore`
- **Scope & Specifications:**
  - Implement multi-stage Docker build:
    - Stage 1 (`builder`): Node.js 20/22 LTS alpine, install all dependencies, generate Prisma client, build TypeScript to JavaScript (`dist/`).
    - Stage 2 (`runner`): Lightweight alpine, install production dependencies only, copy `dist/` and `prisma/`, switch to non-root `USER node`, expose port 5000.
  - Ensure image size is minimized (< 200MB) with no development tools or source secrets baked in.
- **Verification / DoD:**
  - `docker build -t shortener-api -f apps/api/Dockerfile .` builds cleanly; container starts and responds to `/health`.

---

### [TASK-039] GitHub Actions CI/CD Pipeline
- **Priority:** P0 | **Complexity:** M | **Dependencies:** TASK-035, TASK-036, TASK-038
- **Target Files:**
  - `.github/workflows/ci.yml`
  - `.github/workflows/e2e.yml`
- **Scope & Specifications:**
  - `ci.yml` workflow (triggers on PRs and pushes to `main`):
    - Checkout code.
    - Setup Node.js LTS with npm cache.
    - `npm ci`.
    - Run linter and typechecker: `npm run lint`, `npm run typecheck`.
    - Spin up PostgreSQL 17 test container service.
    - Run migrations: `npx prisma migrate deploy`.
    - Run unit and integration tests: `npm run test`.
    - Build frontend and backend: `npm run build`.
  - `e2e.yml` workflow:
    - Build and launch backend and frontend services.
    - Install Playwright browsers with dependencies.
    - Execute Playwright test suites; upload test traces/videos on failure.
- **Verification / DoD:**
  - GitHub Actions runs green on PR push; blocking checks prevent merging when tests fail.

---

### [TASK-040] Cloud Deployment Configuration (Render + Vercel + Neon)
- **Priority:** P0 | **Complexity:** M | **Dependencies:** TASK-038, TASK-039
- **Target Files:**
  - `apps/web/vercel.json`
  - `render.yaml`
- **Scope & Specifications:**
  - **Database (Neon PostgreSQL):**
    - Setup Neon PostgreSQL instance.
    - Configure pooled runtime string (`DATABASE_URL`) and direct migration string (`DIRECT_URL`).
  - **Backend (Render):**
    - Setup Render Web Service for `apps/api`.
    - Build command: `npm run build`.
    - Pre-deploy / release command: `npx prisma migrate deploy`.
    - Start command: `node dist/server.js`.
    - Health check endpoint: `/health`.
    - Configure environment secrets in Render dashboard.
  - **Frontend (Vercel):**
    - Setup Vercel project for `apps/web`.
    - Configure `vercel.json` with SPA rewrite: `[{ "source": "/(.*)", "destination": "/index.html" }]`.
    - Set public environment variable: `VITE_API_URL=https://apiref.softics.in/api/v1`.
    - Assign production custom domain: `urlref.softics.in`.
- **Verification / DoD:**
  - Production deployment completes; frontend loads on `urlref.softics.in` and successfully communicates with backend API on `apiref.softics.in` over HTTPS.

---

### [TASK-041] DNS, Cloudflare Edge & TLS Hardening
- **Priority:** P1 | **Complexity:** S | **Dependencies:** TASK-040
- **Target Files:**
  - `docs/deployment.md`
- **Scope & Specifications:**
  - Configure DNS records on Cloudflare under `softics.in`:
    - `urlref.softics.in` -> Vercel CNAME (`cname.vercel-dns.com`).
    - `apiref.softics.in` -> Render service CNAME.
  - Enforce SSL/TLS Full (Strict).
  - Configure automatic HTTPS rewrites and HSTS.
  - Configure Cloudflare DDOS / WAF rules.
- **Verification / DoD:**
  - Visiting `http://urlref.softics.in` redirects to `https://urlref.softics.in`; SSL Labs test achieves A+ grade.

---

### [TASK-042] Observability, Sentry & Disaster Recovery Drill
- **Priority:** P1 | **Complexity:** M | **Dependencies:** TASK-040
- **Target Files:**
  - `apps/api/src/utils/sentry.ts`
  - `apps/web/src/utils/sentry.ts`
- **Scope & Specifications:**
  - Integrate Sentry error tracking in backend and frontend.
  - Setup uptime monitoring probe checking `/health` every 60 seconds.
  - Configure threshold alerts for sustained 5xx spikes or database connection drops.
  - **Database Restoration Drill:**
    - Execute manual backup snapshot in Neon.
    - Perform test restore into an isolated staging branch.
    - Verify tables, users, links, and click events restore with zero data corruption.
- **Verification / DoD:**
  - Intentional test exception in backend triggers alert in Sentry; database restore drill passes with 100% record integrity.

---

## 7. Sprint Schedule & Task Assignment Roadmap

```text
Week 1: Foundations & Persistence
└── TASK-001: Monorepo Scaffolding
└── TASK-002: Shared Contracts & Zod Schemas
└── TASK-003: Local PostgreSQL 17 Docker Setup
└── TASK-004: Prisma Schema Modeling & Canonical Migrations
└── TASK-005: Prisma Client Singleton & Connection Lifecycle
└── TASK-006: Development Database Seeder

Week 2: Backend Architecture & Auth
└── TASK-007: Startup Environment Validation
└── TASK-008: Security, CORS & Request Parsing Middleware
└── TASK-009: Request ID & Structured Logging Engine
└── TASK-010: Centralized Error Envelope Handler
└── TASK-011: Health & Readiness Probes
└── TASK-012: Password Hashing & Verification Engine
└── TASK-013: Session Token & Cookie Management
└── TASK-014: Authentication Controller & Endpoints
└── TASK-015: Authentication & Role Authorization Middleware
└── TASK-016: Auth Rate Limiter & CSRF Defense

Week 3: URL Engine & Public Redirects
└── TASK-017: Cryptographically Secure Base62 Code Generator
└── TASK-018: Destination URL Validation & SSRF Prevention
└── TASK-019: Custom Alias & Reserved Words Engine
└── TASK-020: Collision-Resilient Link Creation Service
└── TASK-021: User Link Management CRUD Endpoints
└── TASK-022: Stateless Public Redirect Route Handler
└── TASK-023: Non-Blocking Asynchronous Click Dispatcher

Week 4: Analytics Engine & Frontend Foundation
└── TASK-024: Click Event Privacy Sanitizer & Persistence
└── TASK-025: Link-Specific Analytics Aggregation Endpoint
└── TASK-026: Dashboard Overview Analytics Endpoint
└── TASK-027: Frontend Scaffolding & MUI Theme System
└── TASK-028: API Client & TanStack Query Service Layer
└── TASK-029: Auth Feature Views & RequireAuth Wrapper
└── TASK-030: Application Shell, Navigation & Layout
└── TASK-031: Dashboard Overview View & Quick-Create Widget

Week 5: Links Management UI & Multi-Tier Testing
└── TASK-032: Links Management Data Table & Filtering
└── TASK-033: Create, Edit & Delete Link Modals
└── TASK-034: Interactive Analytics Charts (Recharts)
└── TASK-035: Vitest Unit Testing Framework & Utility Tests
└── TASK-036: Supertest Backend Integration Test Suite
└── TASK-037: Playwright End-to-End Test Suite

Week 6: Production Hardening, CI/CD & Launch
└── TASK-038: Production Multi-Stage Dockerfile & Packaging
└── TASK-039: GitHub Actions CI/CD Pipeline
└── TASK-040: Cloud Deployment (Render + Vercel + Neon)
└── TASK-041: DNS, Cloudflare Edge & TLS Hardening
└── TASK-042: Observability, Sentry & Disaster Recovery Drill
```
