# URL Shortener --- Requirements Specification

**Version:** 1.0\
**Status:** Proposed\
**Date:** 7 November 2026\
**Product:** Production-oriented URL shortening application

## 1. Purpose

This document defines the functional, non-functional, security,
operational, and acceptance requirements for a URL shortener. The
application lets authenticated users create and manage short links while
public visitors are redirected to their destinations.

The initial implementation is a modular monolith. PostgreSQL is the
source of truth. Redirect processing must remain independent of the
dashboard and should not wait for nonessential analytics processing.

## 2. Goals

-   Create unique short URLs from valid HTTP/HTTPS destinations.
-   Provide authenticated link management.
-   Support custom aliases, expiration, and deactivation.
-   Redirect visitors reliably.
-   Record privacy-aware click analytics.
-   Prevent common abuse and security issues.
-   Provide automated tests, monitoring, backups, and safe deployment.
-   Support incremental scaling without premature microservices.

## 3. Scope

### 3.1 MVP

-   Registration, login, logout, and current-user endpoint.
-   Secure password hashing and authenticated sessions.
-   Create, list, retrieve, update, and deactivate/delete links.
-   Cryptographically secure short-code generation.
-   Custom aliases and reserved aliases.
-   HTTP 302 redirects.
-   Expiration and inactive-link behavior.
-   Basic click events and dashboard analytics.
-   URL validation, rate limiting, ownership checks, and error handling.
-   PostgreSQL, Prisma migrations, tests, CI/CD, logging, monitoring,
    and backups.

### 3.2 Later phases

-   QR code generation.
-   UTM builder.
-   Advanced traffic, device, browser, referrer, and geographic
    analytics.
-   Custom domains.
-   Password-protected links.
-   API keys and public API usage controls.
-   Bulk link creation.
-   Redis cache and distributed rate limiting.
-   Background analytics workers.
-   Edge redirects, multi-region deployment, and analytical storage such
    as ClickHouse when justified.

### 3.3 Out of scope for MVP

-   Microservices.
-   Kafka.
-   Multi-region deployment.
-   Enterprise billing and subscriptions.
-   High-volume analytics infrastructure.
-   Advanced team collaboration.

## 4. Users and Roles

### 4.1 Registered user

Can register, authenticate, create links, view their own links, edit
destinations and settings, set expiration, view analytics, and
deactivate or delete owned links.

### 4.2 Visitor

Can request a short URL without authentication and receive a redirect or
appropriate error response.

### 4.3 Administrator

Future administrative capabilities include reviewing reports,
deactivating abusive links, managing users, inspecting platform metrics,
and investigating incidents. Administrative actions require explicit
role authorization and audit logging.

## 5. Functional Requirements

### FR-001 --- Registration

The system shall accept email and password, validate input, hash the
password before storage, reject duplicate email addresses, and return
consistent errors. Responses should avoid unnecessarily disclosing
account existence.

### FR-002 --- Authentication

The system shall authenticate registered users, establish a secure
session, support logout, expose a current-user endpoint, and protect
authenticated API routes and dashboard pages.

Recommended browser approach: secure HTTP-only cookies with appropriate
SameSite settings. If JWT is selected, implement short-lived access
tokens, refresh rotation, revocation, and safe storage.

### FR-003 --- Create short link

Authenticated users shall submit: - Required: original URL. - Optional:
custom alias. - Optional: expiration timestamp.

The backend shall validate the destination, generate a short code,
persist the link, associate it with the user, enforce uniqueness, and
return the configured short URL.

### FR-004 --- Short-code generation

The system shall use Base62-compatible codes from `0-9`, `a-z`, and
`A-Z`.

-   Recommended initial length: 7 characters.
-   Use cryptographically secure randomness.
-   Use unbiased character selection.
-   Enforce uniqueness in PostgreSQL.
-   Retry only short-code uniqueness conflicts.
-   Stop after a bounded retry count.
-   Return a controlled error if retries are exhausted.

Six characters provide `62^6 = 56,800,235,584` possible combinations;
seven provide `62^7 = 3,521,614,606,208`. These counts do not eliminate
collision risk.

### FR-005 --- Custom aliases

Users may select a custom alias, subject to: - Configurable length
limits. - Allowed-character rules. - Reserved-route validation. -
Uniqueness. - Ownership and authorization checks.

Reserved examples: `api`, `admin`, `login`, `register`, `dashboard`,
`health`, and `metrics`. The reserved list shall be configurable.

### FR-006 --- List links

Users shall retrieve only links they own. The endpoint shall support
pagination, search, sorting, active/expired filters, creation date,
expiration, and click totals where available.

### FR-007 --- Retrieve link

Users shall retrieve details for an owned link. Cross-user access shall
be denied using a consistent 403 or 404 policy.

### FR-008 --- Update link

Users may update the destination, alias, expiration, and active status.
The system shall validate input, verify ownership, enforce alias
uniqueness, preserve analytics history, and invalidate cache entries if
caching is enabled.

### FR-009 --- Delete or deactivate

The system shall implement a documented deletion policy. Recommended MVP
behavior is deactivation with analytics retention. Inactive links shall
return 410 Gone. Permanent deletion shall follow retention and privacy
requirements.

### FR-010 --- Redirect

The public endpoint `GET /:code` shall: 1. Validate code format. 2.
Resolve the link. 3. Check active status. 4. Check expiration. 5. Return
HTTP 302 and a `Location` header for a valid link. 6. Record analytics
independently of redirect completion.

Unknown codes return 404. Inactive or expired links return 410.
Dependency failures return a controlled response, such as 503 when
appropriate.

### FR-011 --- Expiration

Expiration must be a valid timestamp. Expired links shall not redirect,
even if cached. Expiration enforcement must not depend only on a
background cleanup job.

### FR-012 --- Analytics

The MVP shall record click timestamp and link association, with optional
referrer, device type, and country code when available.

The system shall: - Distinguish total clicks from approximate unique
visitors. - Avoid unnecessary personal data. - Define retention. - Avoid
making redirect completion depend on analytics processing. - Document
analytics collection and privacy behavior.

### FR-013 --- Dashboard

The dashboard shall provide: - Total links. - Total clicks. - Recent
links. - Click activity. - Link creation form. - Link table. - Search
and filters. - Copy, edit, and deactivate/delete actions. - Loading,
empty, validation, and error states.

### FR-014 --- Error handling

The API shall use a consistent error response shape and appropriate
status codes: - 400: invalid input. - 401: unauthenticated. - 403:
forbidden. - 404: resource not found. - 409: conflict. - 410: expired or
inactive link. - 429: rate limit exceeded. - 500: internal error. - 503:
service unavailable.

Internal secrets, stack traces, and infrastructure details shall not be
exposed.

## 6. API Requirements

Base path: `/api/v1`

  Method   Endpoint                 Purpose
  -------- ------------------------ ---------------------
  POST     `/auth/register`         Register
  POST     `/auth/login`            Login
  POST     `/auth/logout`           Logout
  GET      `/auth/me`               Current user
  POST     `/links`                 Create link
  GET      `/links`                 List owned links
  GET      `/links/:id`             Get link
  PATCH    `/links/:id`             Update link
  DELETE   `/links/:id`             Delete/deactivate
  GET      `/links/:id/analytics`   Link analytics
  GET      `/analytics/overview`    Dashboard analytics
  GET      `/health`                Process health
  GET      `/ready`                 Readiness

Public redirect: `GET /:code`.

Example create request:

``` json
{
  "originalUrl": "https://example.com/products",
  "customAlias": "products",
  "expiresAt": null
}
```

The returned short URL shall use a server-configured application base
URL, not an untrusted client-provided domain.

## 7. Data Requirements

### User

-   `id`: UUID primary key.
-   `email`: unique.
-   `passwordHash`: required.
-   `role`: USER or ADMIN.
-   `createdAt`.
-   `updatedAt`.

### Link

-   `id`: UUID primary key.
-   `userId`: foreign key.
-   `originalUrl`: destination.
-   `shortCode`: unique.
-   `customAlias`: optional, unique.
-   `isActive`: boolean.
-   `expiresAt`: optional timestamp.
-   `createdAt`.
-   `updatedAt`.

### ClickEvent

-   `id`: UUID primary key.
-   `linkId`: foreign key.
-   `clickedAt`.
-   `referrer`: optional.
-   `deviceType`: optional.
-   `countryCode`: optional.

Database requirements: - Enforce uniqueness and foreign keys in
PostgreSQL. - Add indexes for short-code lookup, user/creation-time
listing, and link/time analytics. - Use transactions for operations
requiring atomicity. - Use Prisma migrations for schema changes. -
Define retention and deletion behavior. - Configure connection pooling
and backups.

## 8. Security Requirements

### URL validation

-   Permit only HTTP and HTTPS.
-   Reject malformed URLs and unsupported schemes such as `javascript:`,
    `data:`, `file:`, and `ftp:`.
-   Validate host presence and maximum URL length.
-   Do not fetch arbitrary destination URLs during link creation.

### SSRF prevention

If destination fetching is added later, implement: - Localhost and
private IP blocking. - Cloud metadata endpoint blocking. - DNS
resolution validation. - DNS rebinding defenses. - Redirect-chain
validation. - Timeouts and response-size limits.

### Authentication and authorization

-   Hash passwords using Argon2id or a properly configured bcrypt
    implementation.
-   Use secure cookies and HTTPS.
-   Protect state-changing cookie-authenticated requests against CSRF.
-   Restrict CORS to approved frontend origins.
-   Check user ownership on every protected resource.
-   Require explicit authorization for administrator actions.

### Abuse controls

-   Per-IP and per-user rate limits.
-   Login rate limits.
-   Link creation limits.
-   Alias limits.
-   Abuse reporting.
-   Link deactivation.
-   Malicious-domain blocklists.

### Infrastructure

-   Store secrets in managed environment configuration.
-   Restrict database access.
-   Enable TLS.
-   Avoid public database exposure.
-   Monitor suspicious traffic.
-   Keep dependencies updated.

## 9. Non-Functional Requirements

### Performance

Provisional targets, subject to load-test validation: - Redirect p95
below 200 ms under a documented test profile. - Standard CRUD API p95
below 500 ms under a documented test profile. - Error rate below 1%
under defined normal load. - No incorrect destinations. - No duplicate
short codes. - Analytics processing follows the defined reliability
model.

Load tests must document environment, region, concurrency, request rate,
cache state, and database state.

### Reliability

-   PostgreSQL remains the source of truth.
-   Redis failure shall not make link data unavailable when database
    fallback is possible.
-   Redirect processing shall not wait for nonessential analytics.
-   Health and readiness endpoints shall be available.
-   Backups and recovery procedures shall be documented and tested.

### Maintainability

-   TypeScript across frontend and backend.
-   Modular monolith.
-   Business logic separated from route handlers.
-   Shared schemas where appropriate.
-   Reviewed database migrations.
-   Automated tests.
-   Consistent error handling and logging.

### Privacy

-   Collect only necessary analytics.
-   Avoid raw IP retention by default unless justified.
-   Define analytics retention.
-   Document tracking behavior.
-   Treat unique visitor estimates as approximate.

## 10. Frontend Requirements

Technology: - React, Vite, TypeScript. - MUI. - React Router. - TanStack
Query. - React Hook Form. - Zod. - Recharts. - Lucide React.

Pages: - Dashboard. - Links. - Create link. - Analytics. - Settings. -
Future API Keys.

UI requirements: - Responsive layout. - Accessible controls. - Reusable
components. - Consistent loading and error states. - Protected routes. -
Shared API client. - Server state managed through TanStack Query.

## 11. Backend Requirements

Technology: - Node.js. - Express. - TypeScript. - Prisma. - Zod. - Pino
or Winston. - Optional Redis and BullMQ.

Modules: - Auth. - Users. - Links. - Redirects. - Analytics. -
Administration. - Configuration. - Database. - Jobs.

Each module should separate routes, controllers, services, repositories,
schemas, and tests.

## 12. Testing Requirements

### Unit tests --- Vitest

Cover: - Short-code generation. - URL validation. - Alias validation. -
Expiration logic. - Redirect status selection. - Analytics
aggregation. - Authorization helpers.

### Integration tests --- Supertest

Cover: - Registration and login. - Link creation/list/update/delete. -
Duplicate alias. - Redirect success and failures. - Analytics. -
Cross-user access. - Rate limits.

### End-to-end tests --- Playwright

Journey: 1. Register. 2. Login. 3. Create link. 4. Copy link. 5. Open
link. 6. Verify destination. 7. Verify dashboard record. 8. Verify
analytics.

### Edge cases

-   Invalid URL.
-   Duplicate alias.
-   Unknown code.
-   Expired link.
-   Inactive link.
-   Unauthorized request.
-   Cross-user access.
-   Database unavailable.
-   Redis unavailable.
-   Concurrent alias creation.
-   Concurrent code creation.
-   Cache invalidation.
-   Analytics failure.

## 13. Performance and Scalability Requirements

Optimization sequence:

1.  PostgreSQL indexes, query plans, connection pooling, and query
    optimization.
2.  Redis cache for frequently requested codes, with TTL and
    invalidation.
3.  Background analytics processing.
4.  CDN or edge redirects where cache semantics permit.
5.  Horizontal scaling of stateless backend instances.
6.  Advanced analytics storage, partitioning, and multi-region
    evaluation when justified.

Cache requirements: - PostgreSQL remains authoritative. - Use TTL. -
Invalidate on update and delete. - Check expiration. - Prevent stale
destinations. - Fall back to PostgreSQL if Redis is unavailable.

Do not introduce Kafka, ClickHouse, microservices, or multi-region
deployment without measured need.

## 14. Deployment Requirements

Initial services: - Vercel: frontend. - Render: backend. - Neon:
PostgreSQL. - Cloudflare: DNS, CDN, and security. - Sentry: error
monitoring.

Suggested domain separation: - `app.short.ly`: dashboard. -
`api.short.ly`: API. - `short.ly/:code`: redirects.

Production requirements: - HTTPS. - DNS. - Environment secrets. - CORS
and cookie configuration. - Database migrations. - Health checks. -
Monitoring. - Backups. - Smoke tests.

Hosting limits, pricing, connection limits, and runtime constraints must
be verified before release.

## 15. CI/CD Requirements

GitHub Actions shall: 1. Install dependencies. 2. Run ESLint. 3. Run
TypeScript checks. 4. Run unit tests. 5. Run integration tests. 6. Build
frontend. 7. Build backend. 8. Deploy staging. 9. Run smoke tests. 10.
Deploy production.

Migrations must be reviewed, tested in staging, and applied without
destructive resets. Recovery or rollback procedures shall be documented.

## 16. Production Readiness Checklist

### Application

-   [ ] Authentication and authorization.
-   [ ] Short-code uniqueness.
-   [ ] Alias uniqueness.
-   [ ] URL validation.
-   [ ] Reserved aliases.
-   [ ] Redirect behavior.
-   [ ] Expiration.
-   [ ] Deactivation.
-   [ ] Rate limiting.
-   [ ] Error handling.

### Database

-   [ ] Migrations tested.
-   [ ] Indexes reviewed.
-   [ ] Foreign keys configured.
-   [ ] Connection pooling.
-   [ ] Backups.
-   [ ] Recovery procedure.
-   [ ] Retention policy.

### Security

-   [ ] HTTPS.
-   [ ] Secrets configured.
-   [ ] CORS restricted.
-   [ ] Cookie settings.
-   [ ] CSRF protection where required.
-   [ ] Password hashing.
-   [ ] API rate limits.
-   [ ] Abuse reporting.

### Testing

-   [ ] Unit tests.
-   [ ] Integration tests.
-   [ ] E2E tests.
-   [ ] Redirect tests.
-   [ ] Authorization tests.
-   [ ] Concurrency tests.
-   [ ] Smoke tests.

### Infrastructure and operations

-   [ ] Frontend deployed.
-   [ ] Backend deployed.
-   [ ] Database deployed.
-   [ ] Domain and TLS.
-   [ ] Health checks.
-   [ ] Logging.
-   [ ] Monitoring.
-   [ ] Backups.
-   [ ] Incident and recovery documentation.

## 17. Development Phases

### Phase 1 --- Foundation

Repository, TypeScript, frontend/backend setup, Docker, PostgreSQL,
Prisma, schema, health endpoint.

### Phase 2 --- Authentication

Registration, login, logout, password hashing, sessions, middleware,
protected routes.

### Phase 3 --- URL management

Code generator, URL and alias validation, CRUD, database constraints.

### Phase 4 --- Redirect engine

Public route, lookup, status checks, expiration, 302 response,
integration tests.

### Phase 5 --- Dashboard

Overview, create form, table, search, filters, copy, edit, delete.

### Phase 6 --- Analytics

Click events, totals, analytics endpoints, charts, privacy and
retention.

### Phase 7 --- Security and testing

Rate limits, security review, unit/integration/E2E tests, concurrency
tests.

### Phase 8 --- Production deployment

Managed database, hosting, domains, HTTPS, secrets, CI/CD, monitoring,
backups, smoke tests.

### Phase 9 --- Enhancements

QR codes, custom domains, API keys, background analytics, Redis,
advanced reporting.

## 18. Proposed Timeline

  Week   Focus                      Deliverable
  ------ -------------------------- -------------------------
  1      Foundation and database    Development environment
  2      Authentication and links   URL management API
  3      Redirects and analytics    Redirect engine
  4      Frontend and security      MVP dashboard
  5      Testing and deployment     Release candidate
  6      Enhancements               Advanced features

Timeline is an estimate and depends on implementation depth, testing,
and deployment constraints.

## 19. Acceptance Criteria

The MVP is complete when: 1. Users can register and authenticate. 2.
Authenticated users can create short URLs. 3. Short codes are unique. 4.
Custom aliases are validated. 5. Users can view only their links. 6.
Users can update links. 7. Users can deactivate or delete links. 8.
Visitors can access valid short URLs. 9. Valid links return 302. 10.
Invalid links return appropriate errors. 11. Expired links return 410.
12. Cross-user access is denied. 13. Click events are recorded according
to the analytics model. 14. Dashboard displays basic analytics. 15.
Automated tests cover core behavior. 16. Production uses HTTPS. 17.
Migrations are applied safely. 18. Monitoring is enabled. 19. Backups
are configured. 20. Smoke tests pass.

## 20. Definition of Done

A feature is done when: - Requirements are implemented. - Validation and
authorization are implemented. - Errors are handled. - Relevant tests
pass. - Migrations are reviewed. - Documentation is updated. - No
secrets are exposed. - Feature works in its target environment.

A release is done when acceptance criteria pass, security checks pass,
migrations are validated, monitoring and backups are active, and smoke
tests pass.

## 21. Engineering Principles

1.  PostgreSQL is the source of truth.
2.  Database constraints enforce uniqueness.
3.  Redirects remain independent of dashboard code.
4.  Analytics does not unnecessarily delay redirects.
5.  Authentication and authorization are separate.
6.  Business logic stays outside route handlers.
7.  Database changes use migrations.
8.  Secrets are never committed.
9.  Core behavior is automated-tested.
10. Monitoring exists before public launch.
11. Performance decisions are measurement-driven.
12. Distributed systems are introduced only when justified.
13. Data collection follows privacy requirements.
14. Recovery procedures are documented.

## 22. Final Technical Decisions

  Category         Decision
  ---------------- ---------------------------------
  Architecture     Modular monolith
  Frontend         React + Vite + TypeScript
  UI               MUI
  Backend          Node.js + Express + TypeScript
  Database         PostgreSQL
  ORM              Prisma
  Short codes      Secure Base62
  Redirect         HTTP 302
  Authentication   HTTP-only cookie-based approach
  Analytics        PostgreSQL initially
  Cache            Redis when justified
  Jobs             BullMQ when justified
  Testing          Vitest, Supertest, Playwright
  CI/CD            GitHub Actions
  Hosting          Vercel, Render, Neon
  DNS/CDN          Cloudflare
  Monitoring       Sentry, OpenTelemetry
  Logging          Pino or Winston

## 23. Summary

The URL Shortener shall be delivered as a secure and maintainable
modular monolith. The MVP prioritizes database integrity,
authentication, short-code generation, redirects, basic analytics,
testing, monitoring, and production deployment.

The recommended implementation order is:

**Foundation → Database → Authentication → URL Management → Redirect
Engine → Dashboard → Analytics → Security → Testing → Deployment →
Scalability Enhancements.**
