# URL Shortener — Development Rules & Guardrails

## 1. Core Engineering Principles
1. **PostgreSQL is the source of truth:** All data integrity, uniqueness constraints, and referential integrity are enforced at the database level.
2. **Stateless, fast redirect engine:** The public redirect path (`GET /:code`) must remain lightweight, executing indexed lookups and returning HTTP 302. Never load dashboard data or block on analytics writes.
3. **Decoupled business logic:** Route handlers and controllers only parse HTTP input and format responses. All business operations, code generation, and transactions reside in services.
4. **Ownership boundary enforcement:** Every authenticated mutation and analytics query must be explicitly scoped to the authenticated user ID (`WHERE id = $1 AND user_id = $authUserId`). Never trust client-supplied owner IDs.
5. **No SSRF / Safe destination URLs:** Validate URLs server-side using standard URL parsers. Accept only `http:` and `https:`. Do not fetch destination URLs server-side.
6. **Strict migration policy:** All database schema changes must use reviewed Prisma migrations (`prisma/migrations`). Never perform destructive resets in shared or production environments.

## 2. Technology Stack & Directory Structure
- **Monorepo Layout:**
  - `apps/web`: React + Vite + TypeScript + MUI + TanStack Query + React Hook Form + Zod.
  - `apps/api`: Node.js + Express + TypeScript + Prisma.
  - `packages/shared`: Shared Zod validation schemas and TypeScript types.
  - `packages/config`: Shared configuration / ESLint / tsconfig.
  - `docker-compose.yml`: Local PostgreSQL 17 (`image: postgres:17`, port `5432:5432`, db `shortener`).
- **Testing Baseline:**
  - Unit & Integration: Vitest + Supertest.
  - End-to-End: Playwright.

## 3. Short-Code & Redirect Rules
- **Alphabet:** Base62 (`0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ`).
- **Default Length:** 7 characters ($62^7 \approx 3.52$ trillion combinations).
- **Generation:** Cryptographically secure random selection (`crypto.randomInt` or unbiased byte mapping).
- **Collision Handling:** Rely on database unique constraint on `code`; implement bounded retry attempts (e.g., max 3-5 retries).
- **Redirect Responses:**
  - Valid active link: `HTTP 302 Found` with `Location: <destinationUrl>`.
  - Inactive or expired link: `HTTP 410 Gone`.
  - Non-existent link: `HTTP 404 Not Found`.

## 4. API & Error Conventions
- **Base Version:** `/api/v1`
- **Standard Success Envelope:**
  ```json
  {
    "data": { ... },
    "meta": { ... } // optional pagination/meta
  }
  ```
- **Standard Error Envelope:**
  ```json
  {
    "error": {
      "code": "ERROR_CODE",
      "message": "Human-readable safe message",
      "details": [ ... ], // optional validation breakdown
      "requestId": "req_..."
    }
  }
  ```
- **Key Error Codes:** `VALIDATION_ERROR` (400), `UNAUTHENTICATED` (401), `FORBIDDEN` (403), `LINK_NOT_FOUND` (404), `CODE_CONFLICT` (409), `LINK_EXPIRED_OR_INACTIVE` (410), `RATE_LIMITED` (429), `INTERNAL_ERROR` (500).

## 5. Security & Privacy Guardrails
- **Authentication:** HTTP-only, secure, `SameSite=Lax` cookies with CSRF defense for state-changing requests.
- **Subdomain Cookie Sharing:** For our production topology (`urlref.softics.in` and `apiref.softics.in`), set session cookie `domain: '.softics.in'`, `secure: true`, `sameSite: 'lax'`, and configure CORS with exact origin `https://urlref.softics.in` and `credentials: true`.
- **Passwords:** Strong password hashing (Argon2id or bcrypt) with strict minimum requirements. Never log or return password hashes.
- **Analytics Privacy:** Never store raw IP addresses or raw visitor fingerprints. Store only sanitized `deviceType` (desktop/mobile/tablet), `referrer` domain, and ISO `countryCode`.
- **Secrets Management:** Secrets reside exclusively in environment variables (`.env` locally, platform secret managers in staging/production). Never commit credentials or expose backend secrets via `VITE_*`.

## 6. Crash Prevention & Production Reliability Rules
1. **Connection Pooling Guard:** Never instantiate `new PrismaClient()` inside route handlers or per-request contexts. Always use a singleton instance and route runtime traffic through connection poolers (PgBouncer/Neon) using `?connection_limit=10&pool_timeout=5`. Reserve `DIRECT_URL` strictly for migrations.
2. **Async Error Boundaries:** Every decoupled or background operation (such as fire-and-forget click tracking via `setImmediate`) must be enclosed in an isolated try/catch block. Never allow unhandled promise rejections to crash the event loop.
3. **Graceful Shutdown Protocol:** Always listen for `SIGTERM`, `SIGINT`, `uncaughtException`, and `unhandledRejection`. Orderly stop HTTP ingress (`server.close()`), disconnect database pools, and enforce a 10-second hard fallback timeout to avoid hanging orchestrator deploys.
4. **ReDoS & Payload Defense:** Validate URLs using native WHATWG `URL` parser instead of nested regexes. Limit all user input strings to 2048 characters before evaluation.
5. **No Row-Lock Contention on Redirects:** Never execute synchronous `UPDATE links SET clicks = clicks + 1` inline with redirects. Use append-only `click_events` writes to avoid row-level lock deadlocks under high traffic.
