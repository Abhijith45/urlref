# URL Shortener --- Architecture Specification

**Version:** 1.0\
**Status:** Proposed\
**Date:** 7 November 2026\
**Architecture Style:** Modular monolith\
**Primary Runtime:** Node.js + Express + TypeScript\
**Primary Database:** PostgreSQL

------------------------------------------------------------------------

# 1. Purpose

This document defines the technical architecture for the URL Shortener
application. It describes system boundaries, modules, request flows,
data models, API contracts, security controls, deployment,
observability, and scaling strategy.

The architecture must support a secure URL management dashboard and a
fast public redirect path while keeping analytics and other nonessential
work outside the critical redirect response.

# 2. Architecture Goals

-   Reliable short-link resolution.
-   Low-latency redirects.
-   Strong data integrity.
-   Secure authentication and authorization.
-   Clear module boundaries.
-   Testability.
-   Operational visibility.
-   Incremental scalability.
-   Avoidance of premature distributed-system complexity.

# 3. Architecture Decisions

  Area                       Decision
  -------------------------- ---------------------------------
  Application architecture   Modular monolith
  Frontend                   React + Vite + TypeScript
  Backend                    Node.js + Express + TypeScript
  Database                   PostgreSQL
  ORM                        Prisma
  Code generation            Cryptographically secure Base62
  Redirect status            302
  Browser authentication     Secure HTTP-only cookies
  Analytics                  PostgreSQL initially
  Cache                      Redis when justified
  Background processing      BullMQ when justified
  Frontend hosting           Vercel
  Backend hosting            Render
  Database hosting           Neon
  DNS/CDN                    Cloudflare
  Monitoring                 Sentry + OpenTelemetry
  Logging                    Pino or Winston
  CI/CD                      GitHub Actions

# 4. High-Level Architecture

``` mermaid
flowchart TB
    Visitor["Public Visitor"]
    User["Dashboard User"]

    Web["React + Vite Dashboard"]
    API["Express REST API"]
    Redirect["Redirect Handler"]

    Auth["Authentication Module"]
    Links["Link Management Module"]
    Analytics["Analytics Module"]
    Admin["Administration Module"]

    DB[("PostgreSQL")]
    Redis[("Redis Cache")]
    Queue["Background Queue"]
    Worker["Analytics Worker"]

    Monitoring["Logs / Metrics / Traces"]

    User --> Web
    Web --> API

    API --> Auth
    API --> Links
    API --> Analytics
    API --> Admin

    Auth --> DB
    Links --> DB
    Analytics --> DB
    Admin --> DB

    Visitor --> Redirect
    Redirect --> Redis
    Redis --> DB
    Redirect --> DB

    Redirect --> Queue
    Queue --> Worker
    Worker --> DB

    API --> Monitoring
    Redirect --> Monitoring
    Worker --> Monitoring
```

Redis and background processing are optional future components. The
initial implementation may record click events directly in PostgreSQL,
provided redirect latency remains within the agreed performance target.

# 5. System Boundaries

## 5.1 Frontend

Responsibilities: - Render dashboard. - Manage client-side navigation. -
Submit forms. - Display API data. - Provide loading and error states. -
Handle authenticated UI behavior. - Display analytics.

The frontend shall not: - Generate authoritative short codes. - Enforce
resource ownership. - Store database credentials. - Construct trusted
short-link domains from arbitrary user input. - Decide whether a link is
authorized to be edited.

## 5.2 Backend API

Responsibilities: - Authentication. - Authorization. - Request
validation. - Link management. - Alias management. - Redirect
resolution. - Analytics access. - Rate limiting. - Error handling. -
Logging.

## 5.3 Redirect handler

Responsibilities: - Validate short code. - Resolve destination. - Check
active state. - Check expiration. - Return redirect. - Trigger analytics
recording.

The redirect handler shall not require dashboard authentication or
frontend execution.

## 5.4 PostgreSQL

Responsibilities: - Persistent user records. - Persistent link
records. - Unique short-code enforcement. - Unique alias enforcement. -
Click-event storage. - Referential integrity. - Transactional
consistency.

PostgreSQL is authoritative.

## 5.5 Redis

Optional responsibilities: - Short-link cache. - Distributed rate-limit
counters. - Background job queue. - Temporary processing state.

Redis shall not become the authoritative link store.

# 6. Component Architecture

## 6.1 Frontend components

``` text
Web Application
├── Authentication
│   ├── Register Page
│   ├── Login Page
│   └── Session State
├── Dashboard
│   ├── Summary Cards
│   ├── Recent Links
│   └── Click Activity
├── Links
│   ├── Create Form
│   ├── Link Table
│   ├── Search
│   ├── Filters
│   ├── Edit Dialog
│   └── Delete Dialog
├── Analytics
│   ├── Overview
│   ├── Click Trend
│   ├── Referrer Breakdown
│   ├── Device Breakdown
│   └── Geography
└── Settings
    ├── Profile
    └── Security
```

Frontend libraries: - React. - Vite. - TypeScript. - MUI. - React
Router. - TanStack Query. - React Hook Form. - Zod. - Recharts. - Lucide
React.

## 6.2 Backend modules

``` text
API
├── Auth Module
├── User Module
├── Link Module
├── Redirect Module
├── Analytics Module
├── Admin Module
├── Middleware
├── Configuration
├── Database
└── Jobs
```

Module responsibilities:

### Auth

-   Registration.
-   Login.
-   Logout.
-   Session validation.
-   Password hashing.
-   Authentication middleware.

### Users

-   User profile.
-   User lookup.
-   Role management.
-   Account state.

### Links

-   Create.
-   List.
-   Retrieve.
-   Update.
-   Deactivate.
-   Delete.
-   Alias validation.
-   Code generation.

### Redirects

-   Short-code lookup.
-   Cache lookup.
-   Link-state validation.
-   Expiration validation.
-   HTTP redirect.

### Analytics

-   Click event recording.
-   Click aggregation.
-   Link analytics.
-   Dashboard analytics.
-   Retention.

### Administration

-   Abuse review.
-   Link deactivation.
-   User administration.
-   Audit events.

### Jobs

-   Analytics processing.
-   Aggregation.
-   Retention cleanup.
-   Future scheduled tasks.

# 7. Request Flows

## 7.1 Create short link

``` mermaid
sequenceDiagram
    actor User
    participant Web as React
    participant API as Express
    participant Auth as Auth Middleware
    participant Service as Link Service
    participant DB as PostgreSQL

    User->>Web: Submit destination
    Web->>API: POST /api/v1/links
    API->>Auth: Validate session
    Auth-->>API: Authenticated user
    API->>Service: Validate and create
    Service->>Service: Validate URL and alias
    Service->>Service: Generate code
    Service->>DB: Insert link
    DB-->>Service: Created record
    Service-->>API: Link result
    API-->>Web: 201 Created
    Web-->>User: Display short URL
```

Database uniqueness is the final authority. If a generated code
collides, the service retries only the relevant uniqueness conflict.

## 7.2 Redirect

``` mermaid
sequenceDiagram
    actor Visitor
    participant Handler as Redirect Handler
    participant Cache as Redis
    participant DB as PostgreSQL
    participant Analytics as Analytics Recorder

    Visitor->>Handler: GET /:code
    Handler->>Handler: Validate code

    Handler->>Cache: Lookup code

    alt Cache hit
        Cache-->>Handler: Link metadata
    else Cache miss
        Handler->>DB: Lookup shortCode
        DB-->>Handler: Link metadata
        Handler->>Cache: Cache eligible link
    end

    Handler->>Handler: Check active state
    Handler->>Handler: Check expiration

    Handler-->>Visitor: 302 Location

    Handler-->>Analytics: Record click independently
```

Analytics recording should be best-effort or queued. It must not delay
the redirect for nonessential processing.

## 7.3 Update link

``` mermaid
sequenceDiagram
    actor User
    participant Web
    participant API
    participant Auth
    participant Service
    participant DB
    participant Cache

    User->>Web: Update link
    Web->>API: PATCH /api/v1/links/:id
    API->>Auth: Validate session
    Auth-->>API: User identity
    API->>Service: Update request
    Service->>DB: Verify ownership and update
    DB-->>Service: Updated link
    Service->>Cache: Invalidate code cache
    Service-->>API: Updated link
    API-->>Web: 200 OK
```

Cache invalidation must occur after successful database mutation. If
cache invalidation fails, TTL and fallback behavior must prevent
indefinite stale data.

# 8. Redirect Design

## 8.1 Endpoint

``` http
GET /:code
```

## 8.2 Response

Valid link:

``` http
HTTP/1.1 302 Found
Location: https://example.com/products
```

Unknown code: - 404 Not Found.

Inactive or expired: - 410 Gone.

Dependency failure: - Controlled 503 response where appropriate.

## 8.3 Redirect algorithm

``` text
1. Validate code format.
2. Resolve code from cache if enabled.
3. Otherwise query PostgreSQL.
4. If not found, return 404.
5. If inactive, return 410.
6. If expired, return 410.
7. Return 302 with Location.
8. Record click event independently.
```

## 8.4 Redirect constraints

The handler shall: - Avoid loading user profiles. - Avoid analytics
aggregation. - Avoid external destination fetches. - Avoid dashboard
rendering. - Avoid blocking on optional services. - Enforce active and
expiration checks.

## 8.5 Redirect caching

Use 302 for editable links.

Do not permanently cache redirects that may change destination.

If CDN or edge redirects are introduced, cache behavior and invalidation
must be explicitly designed.

# 9. Short-Code Generation

## 9.1 Alphabet

``` text
0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ
```

Alphabet size: 62.

## 9.2 Recommended length

Seven characters for the initial implementation.

## 9.3 Requirements

-   Cryptographically secure randomness.
-   Unbiased Base62 selection.
-   Unique database constraint.
-   Bounded retry.
-   Conflict-specific error handling.
-   No predictable sequential codes.

## 9.4 Collision handling

``` text
Generate code
    |
Insert record
    |
    +-- Success --> Return link
    |
    +-- Unique shortCode conflict
    |       |
    |       +--> Retry with new code
    |
    +-- Other database error
            |
            +--> Fail safely
```

Custom alias conflicts shall not be retried as random code collisions.

# 10. Database Architecture

## 10.1 Entity relationship

``` mermaid
erDiagram
    USERS ||--o{ LINKS : owns
    LINKS ||--o{ CLICK_EVENTS : receives

    USERS {
        uuid id PK
        string email UK
        string password_hash
        string role
        datetime created_at
        datetime updated_at
    }

    LINKS {
        uuid id PK
        uuid user_id FK
        string original_url
        string short_code UK
        string custom_alias UK
        boolean is_active
        datetime expires_at
        datetime created_at
        datetime updated_at
    }

    CLICK_EVENTS {
        uuid id PK
        uuid link_id FK
        datetime clicked_at
        string referrer
        string device_type
        string country_code
    }
```

## 10.2 User table

Fields: - UUID. - Unique email. - Password hash. - Role. - Created
timestamp. - Updated timestamp.

## 10.3 Link table

Fields: - UUID. - User foreign key. - Original URL. - Unique short
code. - Optional unique custom alias. - Active flag. - Optional
expiration. - Created timestamp. - Updated timestamp.

Indexes: - Unique short code. - Unique custom alias. - User and creation
timestamp. - Expiration where useful.

## 10.4 Click event table

Fields: - UUID. - Link foreign key. - Click timestamp. - Referrer. -
Device type. - Country code.

Index: - Link ID and click timestamp.

## 10.5 Integrity rules

-   PostgreSQL enforces uniqueness.
-   Foreign keys enforce ownership relationships.
-   Transactions protect atomic operations.
-   Prisma migrations manage schema evolution.
-   Production data shall not be reset during deployment.
-   Retention and deletion behavior shall be explicit.

# 11. API Architecture

Base path:

``` text
/api/v1
```

## 11.1 Auth endpoints

  Method   Endpoint
  -------- ------------------
  POST     `/auth/register`
  POST     `/auth/login`
  POST     `/auth/logout`
  GET      `/auth/me`

## 11.2 Link endpoints

  Method   Endpoint
  -------- --------------
  POST     `/links`
  GET      `/links`
  GET      `/links/:id`
  PATCH    `/links/:id`
  DELETE   `/links/:id`

## 11.3 Analytics endpoints

  Method   Endpoint
  -------- ------------------------
  GET      `/links/:id/analytics`
  GET      `/analytics/overview`

## 11.4 Operational endpoints

  Method   Endpoint
  -------- -----------
  GET      `/health`
  GET      `/ready`

## 11.5 API middleware order

Recommended conceptual order:

``` text
Request ID
    |
Security headers
    |
CORS
    |
Body parsing
    |
Rate limiting
    |
Authentication where required
    |
Authorization
    |
Validation
    |
Controller
    |
Service
    |
Repository
    |
Error handler
```

Public redirect routes shall use an appropriate middleware subset and
shall not require authentication.

# 12. Authentication Architecture

## 12.1 Recommended browser session

Use: - HTTP-only cookie. - Secure flag in production. - Appropriate
SameSite. - Session expiration. - Logout invalidation. - CSRF protection
for state-changing requests.

## 12.2 Password handling

-   Use Argon2id or properly configured bcrypt.
-   Never store plaintext passwords.
-   Avoid logging credentials.
-   Implement password reset only with secure token lifecycle.

## 12.3 Authorization

Every protected link operation must verify: - Authenticated user. - Link
ownership. - Required role. - Operation permission.

Do not trust frontend ownership checks.

# 13. URL Security Architecture

## 13.1 Allowed schemes

-   HTTP.
-   HTTPS.

Reject: - javascript. - data. - file. - ftp. - Unsupported schemes.

## 13.2 Validation

Use the standard URL parser.

Validate: - Syntax. - Scheme. - Host. - Maximum length. - Alias
format. - Reserved paths.

## 13.3 SSRF

The MVP shall not fetch destination URLs.

If link previews or metadata fetching are introduced, isolate that
capability and implement: - Private IP rejection. - Localhost
rejection. - Metadata endpoint rejection. - DNS resolution validation. -
DNS rebinding protection. - Redirect-chain validation. - Request
timeout. - Response-size limits.

## 13.4 Abuse

Implement: - Rate limiting. - Link creation quotas. - Alias quotas. -
Reporting. - Deactivation. - Blocklists. - Administrative audit logging.

# 14. Analytics Architecture

## 14.1 MVP

Click events are stored in PostgreSQL.

The redirect response shall not wait for analytics aggregation.

## 14.2 Future processing

``` mermaid
flowchart LR
    Visitor["Visitor"]
    Redirect["Redirect Handler"]
    Queue["Redis Queue"]
    Worker["Analytics Worker"]
    Storage[("Analytics Storage")]
    Dashboard["Analytics Dashboard"]

    Visitor --> Redirect
    Redirect --> Queue
    Queue --> Worker
    Worker --> Storage
    Storage --> Dashboard
```

Potential technologies: - BullMQ. - Redis. - PostgreSQL aggregates. -
ClickHouse when volume warrants.

## 14.3 Analytics fields

-   Link ID.
-   Click timestamp.
-   Referrer.
-   Device type.
-   Country code.

## 14.4 Privacy

-   Minimize personal data.
-   Avoid raw IP storage by default.
-   Define event retention.
-   Treat unique visitors as approximate.
-   Document collection and processing.

# 15. Frontend Architecture

## 15.1 Stack

-   React.
-   Vite.
-   TypeScript.
-   MUI.
-   React Router.
-   TanStack Query.
-   React Hook Form.
-   Zod.
-   Recharts.
-   Lucide React.

## 15.2 Feature structure

``` text
web/src/
├── components/
├── features/
│   ├── auth/
│   ├── links/
│   ├── analytics/
│   └── dashboard/
├── pages/
├── hooks/
├── services/
├── routes/
└── main.tsx
```

## 15.3 Data flow

-   TanStack Query manages server state.
-   React Hook Form manages form state.
-   Zod validates input.
-   Shared API client handles requests.
-   Query invalidation follows successful mutations.
-   Protected routes depend on backend authentication state.

Avoid duplicating server state in global client stores.

# 16. Backend Architecture

## 16.1 Module structure

``` text
apps/api/src/
├── modules/
│   ├── auth/
│   ├── users/
│   ├── links/
│   ├── redirects/
│   ├── analytics/
│   └── admin/
├── middleware/
├── config/
├── database/
├── jobs/
├── utils/
└── server.ts
```

## 16.2 Module responsibilities

Routes: - Declare HTTP endpoints. - Apply middleware.

Controllers: - Parse request context. - Return HTTP responses.

Services: - Business logic. - Validation coordination. - Transactions. -
Code generation orchestration.

Repositories: - Prisma/database access.

Schemas: - Request validation.

Tests: - Module behavior and edge cases.

## 16.3 Monorepo Project Structure

``` text
url-shortener/
│
├── apps/
│   ├── web/
│   │   └── src/
│   │       ├── components/
│   │       ├── features/
│   │       ├── pages/
│   │       ├── hooks/
│   │       ├── services/
│   │       └── routes/
│   │
│   └── api/
│       └── src/
│           ├── modules/
│           │   ├── auth/
│           │   ├── links/
│           │   ├── redirects/
│           │   ├── analytics/
│           │   └── users/
│           ├── middleware/
│           ├── config/
│           ├── database/
│           ├── jobs/
│           ├── utils/
│           └── server.ts
│
├── packages/
│   ├── shared/
│   │   ├── schemas/
│   │   └── types/
│   └── config/
│
├── docker-compose.yml
├── package.json
└── README.md
```

## 16.4 Shared packages

A monorepo includes: - Shared Zod schemas. - Shared API types. -
Shared configuration. - Formatting and linting configuration.

Do not share server-only secrets or database code with the frontend
package.

# 17. Caching Architecture

## 17.1 Cache entry

Example:

``` text
Key:
link:aB92xK

Value:
{
  "originalUrl": "https://example.com/products",
  "isActive": true,
  "expiresAt": null
}
```

## 17.2 Cache behavior

-   PostgreSQL is authoritative.
-   Redis is optional.
-   Use TTL.
-   Invalidate after updates.
-   Invalidate after deletion.
-   Check expiration.
-   Avoid indefinite stale entries.
-   Fall back to PostgreSQL on Redis failure.

## 17.3 Cache invalidation

``` text
Database mutation succeeds
    |
Invalidate cache
    |
If invalidation fails:
    |
TTL limits stale lifetime
    |
Database fallback remains authoritative
```

Cache correctness must be tested, not assumed.

# 18. Deployment Architecture

## 18.1 Initial deployment

  Component          Platform
  ------------------ ------------
  Frontend           Vercel
  Backend            Render
  PostgreSQL         Neon
  DNS/CDN            Cloudflare
  Error monitoring   Sentry

## 18.2 Domain separation (Production Topology)

``` text
urlref.softics.in
    Client Web Dashboard (Vercel)

apiref.softics.in/api/v1
    REST API Backend (Render)

apiref.softics.in/:code
    Public Redirect Service (Render)
```

## 18.3 Deployment requirements

-   HTTPS.
-   DNS configuration.
-   Secure environment variables.
-   CORS.
-   Cookie configuration.
-   Database migration.
-   Health checks.
-   Monitoring.
-   Backup.
-   Smoke tests.

## 18.4 CI/CD

GitHub Actions: 1. Install. 2. Lint. 3. Type-check. 4. Unit test. 5.
Integration test. 6. Build. 7. Deploy staging. 8. Smoke test. 9. Deploy
production.

Migrations must be reviewed and tested before production application.

# 19. Observability

## 19.1 Logging

Use Pino or Winston.

Fields: - Timestamp. - Level. - Request ID. - Route. - Method. -
Status. - Duration. - User ID where appropriate. - Error code.

Do not log: - Passwords. - Tokens. - Cookies. - Sensitive query
parameters. - Unnecessary personal data.

## 19.2 Monitoring

Use: - Sentry. - OpenTelemetry. - Hosting metrics. - PostgreSQL
metrics. - Redis metrics. - Uptime checks.

## 19.3 Metrics

-   Redirect latency.
-   API latency.
-   Error rate.
-   Database connections.
-   Cache hit ratio.
-   Redirect throughput.
-   Queue lag.
-   Rate-limit events.

## 19.4 Health and readiness

`/health`: - Process liveness.

`/ready`: - Ability to serve requests. - Critical dependency readiness.

Do not expose sensitive infrastructure details.

# 20. Performance and Scaling

## 20.1 Initial

-   PostgreSQL.
-   Indexed short-code lookup.
-   Connection pooling.
-   Simple redirect handler.
-   Basic click events.

## 20.2 Intermediate

-   Redis cache.
-   Background analytics.
-   Distributed rate limits.
-   Multiple stateless backend instances.
-   Queue monitoring.

## 20.3 Advanced

-   Edge redirects.
-   Analytics partitioning.
-   ClickHouse.
-   Read replicas.
-   Multi-region architecture.
-   Advanced queueing.

## 20.4 Performance targets

Provisional targets: - Redirect p95 under 200 ms for documented test
load. - CRUD API p95 under 500 ms. - Error rate under 1% under defined
normal load.

Load-test results must state the environment, concurrency, traffic
profile, cache state, and database state.

# 21. Failure Handling & Crash Resilience

## Database connection exhaustion (`P2024` / `P1017`)

-   Route all runtime queries through a managed connection pooler (PgBouncer/Neon).
-   Use `connection_limit` and `pool_timeout` in the connection string to prevent queue overflows.
-   Maintain a single global `PrismaClient` instance across the app lifecycle.
-   Reserve direct connection strings (`DIRECT_URL`) strictly for migrations.

## Process crashes (uncaughtException & unhandledRejection)

-   Wrap all fire-and-forget asynchronous tasks (such as background click tracking) in explicit try/catch blocks.
-   Register top-level handlers for `uncaughtException` and `unhandledRejection`.
-   Trigger an orderly two-stage graceful shutdown: stop accepting new traffic with `server.close()`, release database connections, and exit.
-   Enforce a 10-second hard fallback timeout to prevent hanging orchestrator deployments.

## PostgreSQL unavailable

-   Return controlled service error.
-   Do not return an incorrect destination.
-   Emit operational logs.
-   Trigger monitoring.

## Redis unavailable

-   Fall back to PostgreSQL.
-   Avoid making cache availability a correctness dependency.
-   Alert if cache failure affects performance.

## Analytics failure or queue unavailable

-   Do not block redirect on nonessential processing.
-   Apply the defined event reliability policy.
-   Monitor lost or delayed events.
-   Avoid claiming guaranteed event delivery unless the implementation
    provides it.

## Event loop blocking & ReDoS

-   Parse URLs using standard WHATWG `new URL()` parser (C++ engine), avoiding recursive regexes.
-   Cap input string length to 2048 characters before evaluating any regex.
-   Use linear-time, non-backtracking regular expressions for device and alias validation.

## Invalid link

-   Return 404 for unknown codes.
-   Return 410 for inactive or expired links.

## Cache stale

-   Invalidate on mutation.
-   Use TTL.
-   Verify active and expiration behavior.
-   Test stale destination scenarios.

# 22. Security Controls

-   Password hashing.
-   Secure cookies.
-   Authentication middleware.
-   Ownership authorization.
-   CSRF protection.
-   CORS restrictions.
-   URL scheme validation.
-   SSRF controls if fetching is added.
-   Rate limiting.
-   Abuse reporting.
-   Secret management.
-   HTTPS.
-   Database access restrictions.
-   Dependency updates.
-   Error sanitization.

# 23. Testing Architecture

## Unit

-   Code generator.
-   URL parser.
-   Alias validation.
-   Expiration.
-   Redirect decision.
-   Analytics aggregation.

## Integration

-   Auth.
-   Link CRUD.
-   Redirect.
-   Analytics.
-   Authorization.
-   Rate limiting.
-   Database constraints.

## End-to-end

-   Registration.
-   Login.
-   Create link.
-   Copy link.
-   Redirect.
-   Dashboard verification.
-   Analytics verification.

## Concurrency

-   Duplicate alias creation.
-   Short-code collision.
-   Concurrent link updates.
-   Cache invalidation.
-   Database transaction behavior.

# 24. Operational Readiness

Before launch: - Production environment configured. - HTTPS
configured. - Database migration reviewed. - Backups enabled. - Recovery
tested. - Logs enabled. - Error monitoring enabled. - Uptime monitoring
enabled. - Rate limits configured. - Abuse handling documented. - Smoke
tests passing. - Release and rollback procedures documented.

# 25. Architecture Evolution

The architecture shall evolve based on measured need.

Potential triggers: - Redirect latency exceeds target. - Database lookup
load becomes significant. - Analytics write load affects redirects. -
Queue lag increases. - Database connection pressure increases. -
Geographic latency becomes a product concern.

Possible responses: - Query/index optimization. - Redis cache. -
Background workers. - Analytics aggregation. - Read replicas. - Edge
redirects. - Separate analytics storage. - Multi-region deployment.

Microservices are not a default next step. Extract a module only when
its independent scaling, deployment, ownership, or reliability needs
justify the operational cost.

# 26. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Short-code collisions | Unique database constraints and retries with bounded limit |
| Malicious destinations | URL validation, protocol allowlisting (HTTP/HTTPS), and abuse reporting |
| Redirect latency | Indexed code lookups, lean handler, and optional Redis caching |
| Analytics write load | Background processing (BullMQ/workers) to decouple writes from redirect |
| Database connection exhaustion | Managed connection pooling |
| Stale cache | TTL and cache invalidation on link update/deletion |
| Unauthorized link access | Strict ownership checks (scoping by `userId` in every query) |
| Permanent redirect caching | Use HTTP 302 for editable links to prevent browser caching |
| Platform abuse | Rate limits, reserved alias blocklists, and administrative takedown |
| Data loss | Regular automated backups and verified restore procedures |
| Deployment failure | Staging environment, CI/CD pipeline, and smoke tests |
| Premature complexity | Start as modular monolith and follow staged scaling |

# 27. Architecture Acceptance Criteria

The architecture is accepted when: - Frontend and backend boundaries are
defined. - Modules have clear responsibilities. - PostgreSQL is
authoritative. - Short-code uniqueness is enforced. - Redirects do not
require frontend execution. - Analytics is separated from redirect
latency. - Authentication and authorization are explicit. - URL
validation is defined. - Cache fallback is defined. - Migrations are
controlled. - Tests cover critical flows. - Monitoring and backup plans
exist. - Scaling steps are measurable and staged.

# 28. Final Architecture Summary

The URL Shortener shall use a modular monolith with React, Express,
TypeScript, PostgreSQL, and Prisma.

The dashboard communicates with the REST API. The public redirect
handler resolves short codes directly and returns HTTP 302. PostgreSQL
remains authoritative. Redis, background workers, edge redirects, and
analytical storage are introduced only when measured requirements
justify them.

The key architectural principle is:

**Keep redirects fast and independent, keep PostgreSQL authoritative,
keep analytics off the critical path, and scale from measured
bottlenecks rather than assumptions.**
