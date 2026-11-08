# Deployment Guide

## 1. Purpose

This document defines the deployment architecture, environment
configuration, release workflow, operational checks, rollback approach,
and production readiness requirements for the URL Shortener.

The deployment target for the MVP is:

-   Frontend: Vercel
-   Backend API: Render
-   PostgreSQL: Neon
-   DNS and edge controls: Cloudflare
-   Error monitoring: Sentry or an equivalent service
-   Source control and CI: GitHub Actions

Provider-specific settings may change. Treat this document as the
deployment baseline and verify current provider capabilities before
configuring production.

## 2. Deployment Architecture

``` text
Browser
  |
  | HTTPS
  v
Cloudflare DNS / Edge
  |
  +----------------------------+
  |                            |
  v                            v
Frontend (Vercel)          Short URL domain
React + Vite                  |
                              v
                         Backend API (Render)
                              |
                              v
                       PostgreSQL (Neon)
```

### 2.1 Frontend

The frontend is a static React + Vite application built from the
production branch and deployed to Vercel.

Responsibilities:

-   Serve the dashboard and authentication screens.
-   Call the backend API using the configured public API origin.
-   Use HTTPS in production.
-   Avoid embedding server secrets in frontend environment variables.
-   Provide a custom domain and appropriate SPA fallback behavior.

### 2.2 Backend

The backend is a Node.js + Express + TypeScript service deployed to
Render.

Responsibilities:

-   Authentication and session handling.
-   Link management.
-   Redirect resolution.
-   Analytics APIs.
-   Request validation, rate limiting, logging, and health checks.
-   Database access through Prisma.

The backend must bind to the host and port provided by the deployment
environment.

### 2.3 Database

Use Neon PostgreSQL as the managed database.

Responsibilities:

-   Store users, links, and click events.
-   Enforce primary keys, unique short codes, foreign keys, and indexes.
-   Provide backups and restore capability according to the selected
    Neon plan.
-   Keep production and staging databases separate.

Use the provider-recommended pooled connection string for normal
application traffic when appropriate, and a direct connection string for
migration operations when required by the provider or Prisma
configuration.

## 3. Domains and Routing (Subdomain Architecture)

Hosting the platform across subdomains is the **approved production architecture** for the platform on the `softics.in` domain. It isolates security boundaries, prevents cookie and session leakage to visitor traffic, and decouples static client delivery from dynamic API and redirect paths.

### 3.1 Production Subdomain Topology

| Subdomain | Role | Service Provider | Target Configuration |
|---|---|---|---|
| `urlref.softics.in` | Client Web Dashboard | Vercel | CNAME pointing to `cname.vercel-dns.com` |
| `apiref.softics.in` | REST API (`/api/v1`) & Redirect Service (`/:code`) | Render | CNAME pointing to Render service URL |

### 3.2 Cross-Subdomain Authentication & Session Cookie Architecture

When the user logs in at `urlref.softics.in`, the backend at `apiref.softics.in` issues a session cookie configured for the parent domain:

1. **Cookie Domain Scope:**
   - Configure the session cookie with `domain: '.softics.in'` (or `domain: 'softics.in'`).
   - According to RFC 6265, setting the parent domain scope allows the browser to send the cookie to all subdomains under `softics.in` (`urlref.softics.in`, `apiref.softics.in`).
2. **CORS Credentials Configuration:**
   - In Express backend (`apiref.softics.in`):
     ```typescript
     app.use(cors({
       origin: 'https://urlref.softics.in', // Exact frontend origin
       credentials: true,                   // Mandates browser send/receive cookies
       methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
     }));
     ```
3. **SameSite & Secure Parameters:**
   - `sameSite: 'lax'` — Browsers treat subdomains of the same registrable domain (`softics.in`) as **SameSite**. This protects against third-party cross-site request forgery while ensuring cookies are sent on top-level navigation and fetch requests.
   - `secure: true` — Mandatory in production over HTTPS; prevents cookies from ever being transmitted over unencrypted HTTP.
4. **Cloudflare Wildcard SSL/TLS:**
   - Use Cloudflare DNS with a Universal Wildcard Certificate (`*.softics.in` and `softics.in`).
   - Enable SSL/TLS **Full (Strict)** mode so connections from Cloudflare to Vercel and Render are encrypted end-to-end.

### 3.3 Redirect Routing

The public redirect route is served directly by the backend at:
```text
https://apiref.softics.in/{code}
```
Optionally, a root path rewrite or short hostname on `softics.in` can proxy to `apiref.softics.in/:code`.
**Critical Rule:** Do NOT route short-link requests through the frontend SPA on Vercel (`urlref.softics.in`). This prevents the SPA router from intercepting short codes or downloading multi-megabyte JavaScript bundles before executing the redirect.

---

## 4. Production Crash Prevention & System Resilience

Real-world production investigations show that high-throughput URL shorteners built on Node.js, Express, Prisma, and PostgreSQL suffer from predictable failure modes if not properly guarded against. Below are the mandatory safeguards implemented to prevent production crashes:

### 4.1 Connection Pool Starvation & Saturation (`P2024` / `P1017`)
- **The Crash Mechanism:** Under traffic spikes or horizontal scaling, multiple backend instances each open separate database connections. PostgreSQL's default `max_connections` (typically 100) is rapidly exhausted. Prisma throws `PrismaClientKnownRequestError: Timed out fetching a new connection from the connection pool (P2024)` and all incoming requests hang and crash.
- **The Safeguards:**
  1. **Pooled Connection URL:** Direct all runtime application traffic through Neon's serverless connection pooler (PgBouncer) via `DATABASE_URL` (`?connection_limit=10&pool_timeout=5`).
  2. **Direct Migration URL:** Reserve direct connection strings (`DIRECT_URL`) strictly for `prisma migrate deploy` in CI/CD or build steps, never for runtime traffic.
  3. **Global Prisma Singleton:** Never instantiate `new PrismaClient()` inside route handlers or per-request contexts. Maintain a strictly controlled global singleton instance.
  4. **Lean Query Projection (`select`):** Never query full records (`SELECT *`) on the redirect path. Only select required fields (`destinationUrl`, `isActive`, `expiresAt`) to minimize memory allocation across the Prisma Rust query engine bridge.

### 4.2 Unhandled Promise Rejections in Fire-and-Forget Analytics
- **The Crash Mechanism:** Decoupling analytics via `setImmediate()` or background event dispatching means any unhandled error (e.g., database insert timeout, connection blip) will bubble up as an unhandled promise rejection. In modern Node.js, this crashes the entire process.
- **The Safeguards:**
  1. **Isolated Error Boundaries:** Every asynchronous background operation must be enclosed in an explicit `try/catch` block that logs warnings without throwing unhandled rejections.
  2. **Process-Level Handlers:** Register global `process.on('unhandledRejection')` and `process.on('uncaughtException')` listeners that trigger an orderly graceful shutdown rather than abrupt segmentation faults.

### 4.3 Graceful Shutdown Protocol (Docker / Render Lifecycle)
- **The Crash Mechanism:** When Render or Docker stops or restarts a container during a deploy or scale-down, it sends a `SIGTERM` signal. If the app immediately terminates via `process.exit(0)`, all active user redirects and API mutations mid-flight are abruptly dropped.
- **The Safeguards:**
  Implement a two-stage graceful shutdown protocol:
  ```typescript
  let isShuttingDown = false;

  async function gracefulShutdown(signal: string, error?: Error) {
    if (isShuttingDown) return;
    isShuttingDown = true;
    logger.info({ signal, error }, 'Initiating graceful shutdown...');

    // 1. Tell health checks we are shutting down so load balancers stop sending traffic
    // 2. Stop accepting new HTTP connections
    server.close(async () => {
      logger.info('HTTP server closed. Releasing database connections...');
      try {
        await prisma.$disconnect();
        logger.info('Database disconnected cleanly.');
        process.exit(error ? 1 : 0);
      } catch (dbErr) {
        logger.error({ dbErr }, 'Error during database disconnection');
        process.exit(1);
      }
    });

    // 3. Hard fallback timeout: Force termination if cleanup hangs past 10 seconds
    setTimeout(() => {
      logger.fatal('Graceful shutdown timed out after 10s. Forcing exit.');
      process.exit(1);
    }, 10000).unref();
  }

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('uncaughtException', (err) => gracefulShutdown('uncaughtException', err));
  process.on('unhandledRejection', (reason) => gracefulShutdown('unhandledRejection', reason as Error));
  ```

### 4.4 Regular Expression Denial of Service (ReDoS) & Event Loop Defense
- **The Crash Mechanism:** Complex, unconstrained regular expressions in URL parsing or User-Agent detection can exhibit exponential backtracking when given malicious inputs, pegging the Node.js single-threaded CPU at 100% and starving all incoming traffic.
- **The Safeguards:**
  1. Use the native C++ WHATWG `new URL()` parser for URL parsing instead of custom regular expressions.
  2. Enforce an absolute maximum input length of 2048 characters *before* evaluating any string regex.
  3. Use linear-time, non-backtracking regular expressions for device classification and alias validation.

### 4.5 Row-Level Lock Contention Mitigation
- **The Crash Mechanism:** Incrementing a counter directly on the link row (`UPDATE links SET clicks = clicks + 1 WHERE id = ...`) under heavy traffic to a single viral link causes massive row-level write-lock contention, queuing requests until database connection timeouts occur.
- **The Safeguards:**
  - Never execute in-place `UPDATE` operations on the link row during redirects.
  - Insert append-only `click_events` rows asynchronously, or aggregate click totals periodically. Append-only writes do not acquire exclusive row locks on existing records.

---

## 5. Environments

Maintain at least three logical environments:

  Environment   Purpose                     Data
  ------------- --------------------------- ----------------------
  Local         Development and debugging   Local synthetic data
  Staging       Release verification        Isolated test data
  Production    Live user traffic           Production data

Rules:

-   Use separate databases and credentials.
-   Use separate provider services where practical.
-   Never copy production user data into staging without an approved
    anonymization process.
-   Do not use production secrets in local development or CI.
-   Deploy staging before production for significant changes.

### 4.1 Local Development and Docker Setup

Local database is managed using Docker Compose (`postgres:17`):

```yaml
services:
  postgres:
    image: postgres:17
    container_name: url-shortener-db
    environment:
      POSTGRES_USER: shortener
      POSTGRES_PASSWORD: local_password
      POSTGRES_DB: shortener
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Local Environment Variables:

**Backend (`apps/api/.env`):**
```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://shortener:local_password@localhost:5432/shortener
APP_BASE_URL=http://localhost:5000
FRONTEND_URL=http://localhost:5173
```

**Frontend (`apps/web/.env`):**
```env
VITE_API_URL=http://localhost:5000/api/v1
```

## 5. Environment Variables

Use environment variables or the hosting provider's secret manager for
runtime configuration. The exact names should match the application's
validated configuration module.

Example configuration inventory:

  -----------------------------------------------------------------------
  Variable                Required                Description
  ----------------------- ----------------------- -----------------------
  `NODE_ENV`              Yes                     `production` for
                                                  production runtime

  `PORT`                  Provider                Port assigned by the
                                                  host

  `DATABASE_URL`          Yes                     Application database
                                                  connection

  `DIRECT_URL`            Migration-dependent     Direct database
                                                  connection if required

  `APP_URL`               Yes                     Canonical frontend
                                                  origin

  `API_URL`               Yes                     Public backend API
                                                  origin

  `SHORT_LINK_BASE_URL`   Yes                     Public short-link
                                                  origin

  `SESSION_SECRET`        Yes                     Strong secret used for
                                                  session signing

  `COOKIE_DOMAIN`         Deployment-dependent    Cookie domain, if
                                                  shared across
                                                  subdomains

  `CORS_ORIGINS`          Yes                     Explicit allowed
                                                  frontend origins

  `RATE_LIMIT_*`          Recommended             Rate-limit
                                                  configuration

  `SENTRY_DSN`            Optional                Error monitoring DSN

  `LOG_LEVEL`             Recommended             Production log level
  -----------------------------------------------------------------------

### 5.1 Secret handling

-   Generate secrets using a cryptographically secure random generator.
-   Store secrets only in provider-managed secret settings or an
    approved secret manager.
-   Never commit `.env` files containing secrets.
-   Never expose backend secrets through `VITE_*` variables.
-   Rotate secrets using a planned procedure.
-   Redact secrets, session cookies, authorization headers, and
    sensitive query values from logs.

### 5.2 Configuration validation

The backend must validate required environment variables at startup.

If required configuration is missing or invalid:

-   Fail startup.
-   Emit a clear, sanitized configuration error.
-   Do not start in a partially configured state.

The frontend should validate required public configuration during build
and fail the build when values are missing.

## 6. Build and Runtime

### 6.1 Backend build

Recommended release steps:

1.  Install dependencies from the lockfile.
2.  Run linting and type checks.
3.  Run unit and integration tests.
4.  Generate Prisma Client.
5.  Compile TypeScript.
6.  Apply database migrations through the release process.
7.  Start the compiled application.

Use the package manager and scripts defined by the repository. Example
conceptual commands:

``` bash
npm ci
npm run lint
npm run typecheck
npm test
npx prisma generate
npm run build
npm run start
```

Do not run development mode or hot reload in production.

### 6.2 Frontend build

Recommended steps:

``` bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

Deploy the generated Vite output directory according to the Vercel
project configuration.

### 6.3 Runtime requirements

-   Use a supported Node.js LTS version.
-   Configure the service to listen on `0.0.0.0` and the assigned port.
-   Use graceful shutdown for SIGTERM and SIGINT.
-   Close database connections during shutdown.
-   Configure request and database timeouts.
-   Avoid relying on local filesystem persistence for application data.
-   Store uploaded assets externally if uploads are introduced later.

## 7. Database Migration Strategy

Prisma migrations are the source of truth for schema changes.

### 7.1 Before deployment

-   Review the migration SQL.
-   Test migration against a clean database.
-   Test migration against a staging database with representative data.
-   Confirm indexes and constraints are appropriate.
-   Confirm the migration does not require destructive changes without a
    data migration plan.
-   Back up production before risky schema changes.

### 7.2 Production migration

Run migrations as a controlled release step, not independently from
every application instance.

Recommended order:

1.  Confirm backup and release approval.
2.  Deploy backward-compatible schema changes.
3.  Run `prisma migrate deploy` using the migration connection
    configuration.
4.  Verify migration status.
5.  Deploy application code that uses the new schema.
6.  Verify health and critical workflows.

For breaking schema changes, use an expand-and-contract strategy:

1.  Add the new schema while preserving compatibility.
2.  Deploy code that supports both old and new representations.
3.  Backfill data if required.
4.  Switch application reads and writes.
5.  Remove obsolete schema only in a later release.

Do not use `prisma migrate reset` against staging or production.

## 8. CI/CD Workflow

### 8.1 Pull request checks

Every pull request should run:

-   Dependency installation from lockfile.
-   Formatting and lint checks.
-   TypeScript type checking.
-   Unit tests.
-   Integration tests with isolated PostgreSQL.
-   Prisma migration validation.
-   Frontend and backend production builds.
-   Security and dependency checks.

### 8.2 Staging deployment

After changes are merged to the staging branch or approved release
branch:

1.  Build frontend and backend.
2.  Apply staging migrations.
3.  Deploy backend.
4.  Deploy frontend.
5.  Run health checks.
6.  Run API smoke tests.
7.  Run critical Playwright journeys.
8.  Review logs and error monitoring.

### 8.3 Production deployment

Production deployment should require:

-   Green CI checks.
-   Staging verification.
-   Approved release commit.
-   Reviewed database migration.
-   Confirmed environment variables.
-   Available backup or restore point.
-   Release owner approval.

Use the hosting providers' Git-based deployment or supported CI
integration. Avoid exposing deployment tokens in logs or repository
files.

## 9. Health Checks and Observability

### 9.1 Health endpoints

Implement separate health semantics where appropriate:

-   Liveness: process is running and able to respond.
-   Readiness: service can accept traffic and required dependencies are
    available.

Health endpoints must not expose secrets, database credentials, internal
stack traces, or sensitive infrastructure details.

### 9.2 Monitoring

Monitor:

-   API availability.
-   Redirect latency and error rate.
-   Authentication failures and rate-limit activity.
-   Database connectivity and query latency.
-   Application exceptions.
-   Memory and CPU utilization.
-   Deployment failures.
-   Migration failures.

Use structured logs with request IDs. Avoid logging passwords, session
tokens, authorization headers, or raw IP addresses unless a documented
privacy and retention policy permits it.

### 9.3 Alerts

Configure alerts for:

-   Sustained API error rate.
-   Health check failure.
-   Redirect failure spike.
-   Database connection failure.
-   Elevated latency.
-   Repeated deployment failure.
-   Resource exhaustion.

Alert thresholds should be tuned using staging and initial production
observations rather than guessed as permanent values.

## 10. Security Configuration

Before public launch:

-   Enforce HTTPS.
-   Configure secure session cookies.
-   Set explicit CORS origins.
-   Enable CSRF protections for cookie-authenticated state-changing
    requests.
-   Apply authentication and link-creation rate limits.
-   Validate request bodies, query parameters, and route parameters.
-   Configure security headers.
-   Ensure secrets are stored in provider secret settings.
-   Confirm user ownership checks on all private resource endpoints.
-   Confirm redirect destinations are validated and persisted.
-   Confirm the server does not fetch user-provided destination URLs.
-   Review database permissions and connection security.
-   Run dependency vulnerability checks.

CORS is not an authentication mechanism. Authorization must be enforced
by the backend.

## 11. Deployment Checklist

### Pre-deployment

-   [ ] CI checks pass.
-   [ ] Staging tests pass.
-   [ ] Release commit is reviewed.
-   [ ] Environment variables are configured.
-   [ ] Database backup or restore point is confirmed.
-   [ ] Migration SQL is reviewed.
-   [ ] DNS and TLS configuration are verified.
-   [ ] Monitoring and alerts are enabled.

### Deployment

-   [ ] Deploy backward-compatible migrations.
-   [ ] Deploy backend.
-   [ ] Verify backend readiness.
-   [ ] Deploy frontend.
-   [ ] Verify frontend and API connectivity.
-   [ ] Run critical smoke tests.
-   [ ] Verify redirect hostname routing.

### Post-deployment

-   [ ] Register or use a controlled test account.
-   [ ] Create a test link.
-   [ ] Open the short URL and verify redirect.
-   [ ] Verify link dashboard and analytics.
-   [ ] Verify error rate and latency.
-   [ ] Confirm no unexpected migration or database errors.
-   [ ] Remove or disable test data according to policy.

## 12. Rollback and Recovery

### 12.1 Application rollback

If the release introduces a regression:

1.  Identify the last known-good release.
2.  Confirm whether the database schema remains compatible.
3.  Roll back the frontend and/or backend application version.
4.  Verify health and critical workflows.
5.  Record the incident and corrective action.

### 12.2 Database rollback

Do not assume application rollback requires reversing the database
migration.

Prefer forward-compatible migrations. If data loss or schema
incompatibility is involved:

-   Stop further deployment.
-   Assess backup and restore options.
-   Follow the approved recovery procedure.
-   Preserve evidence and logs.
-   Obtain approval before destructive database operations.

### 12.3 Recovery priorities

1.  Restore API and redirect availability.
2.  Protect user and link data integrity.
3.  Restore database connectivity.
4.  Verify authentication and ownership enforcement.
5.  Restore analytics consistency.
6.  Communicate service status through the established channel.

Define recovery time and recovery point objectives before launch. They
depend on hosting plan, backup frequency, and business requirements.

## 13. Backup and Restore

-   Enable managed database backups according to the selected Neon plan.
-   Document backup retention and point-in-time recovery availability.
-   Restrict backup access.
-   Test restore procedures in a non-production environment.
-   Verify restored schema, users, links, and click events.
-   Record the restore duration and any data loss window.
-   Do not consider backups verified until a restore test has succeeded.

## 14. Cost and Resource Controls

-   Select hosting plans based on measured traffic and service
    requirements.
-   Monitor database compute, storage, connection usage, and provider
    limits.
-   Avoid unbounded analytics queries.
-   Apply pagination and date-range limits.
-   Set request body size limits.
-   Configure log retention.
-   Review provider usage after launch and before major traffic
    campaigns.

Do not scale infrastructure solely from assumptions. Use measured
latency, error rates, resource utilization, and traffic patterns.

## 15. Release Acceptance Criteria

A release is deployable when:

-   Required CI checks pass.
-   Staging verification is complete.
-   Production configuration is validated.
-   Database migrations are reviewed and tested.
-   Security controls are enabled.
-   Health checks and monitoring are operational.
-   Critical user journeys pass.
-   Rollback and recovery steps are understood.
-   No unresolved critical or high-severity defect remains.

## 16. Open Deployment Decisions

Finalize these before production:

-   Actual frontend, API, and short-link domains.
-   Whether the short-link hostname is served directly by Render or
    through a Cloudflare proxy.
-   Exact production and staging environment variable names.
-   Session cookie domain and cross-subdomain behavior.
-   Prisma migration connection configuration for Neon.
-   Backup retention and restore objectives.
-   Required uptime, latency, recovery time, and recovery point
    objectives.
-   Production release approval and rollback owner.
-   Monitoring provider and alert thresholds.
