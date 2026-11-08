# Testing Strategy

## 1. Purpose

This document defines the testing approach for the URL Shortener. It
covers quality goals, test levels, coverage targets, test data,
automation, CI gates, and release verification.

The strategy is designed to verify functional correctness, security
boundaries, reliability, and production behavior without making the test
suite unnecessarily slow or expensive.

## 2. Testing Goals

The test suite must verify that:

-   Users can register, authenticate, and manage only their own links.
-   Link creation validates URLs and generates unique short codes.
-   Public redirects resolve valid codes and return the expected
    redirect response.
-   Expired, disabled, deleted, or unknown links behave consistently.
-   Analytics aggregate click events correctly without exposing
    unauthorized data.
-   API validation, error responses, rate limits, and security controls
    work as specified.
-   Database constraints and transactions protect data integrity.
-   The frontend handles loading, success, empty, validation, and error
    states.
-   Deployment configuration and runtime health checks are verified
    before release.

## 3. Test Pyramid

Use a test pyramid with many fast unit tests, a smaller number of
integration tests, and a focused set of end-to-end tests.

  -----------------------------------------------------------------------
  Test level              Primary purpose         Tooling
  ----------------------- ----------------------- -----------------------
  Unit                    Pure functions,         Vitest
                          validation, business    
                          rules, utility logic    

  Integration             API routes, middleware, Vitest, Supertest, test
                          Prisma/database         PostgreSQL
                          behavior                

  Component               React components and    Vitest, React Testing
                          user interactions       Library

  End-to-end              Critical browser        Playwright
                          journeys across         
                          frontend and API        

  Operational             Build, migrations,      CI scripts, HTTP checks
                          health checks,          
                          deployment smoke tests  
  -----------------------------------------------------------------------

Avoid testing implementation details such as internal function call
counts unless they are part of a meaningful contract.

## 4. Environments

### 4.1 Local development

-   Use a dedicated local PostgreSQL database.
-   Use `.env.test` or equivalent test-only configuration.
-   Never point automated tests at production credentials or production
    databases.
-   Run unit tests during development and integration tests before
    submitting changes.

### 4.2 CI environment

-   Provision an isolated PostgreSQL service for each CI job or test
    run.
-   Apply migrations before integration tests.
-   Use deterministic test configuration and fixed test clock helpers
    where time-sensitive behavior is tested.
-   Keep secrets out of logs and test reports.
-   Ensure tests do not depend on external production services.

### 4.3 Staging

-   Use a staging database and staging credentials.
-   Run migration verification, API smoke tests, and critical browser
    journeys.
-   Use test accounts and non-sensitive URLs.
-   Do not create analytics events from real users or production
    traffic.

## 5. Unit Testing

### 5.1 Short-code generation

Verify:

-   Generated codes meet the configured alphabet and length.
-   Codes do not contain forbidden characters.
-   Generation handles collisions by retrying within a bounded limit.
-   Exhausted retries produce a controlled error.
-   Randomness is injectable so tests are deterministic.
-   The code generator does not depend on mutable global state.

### 5.2 URL validation

Verify:

-   Valid HTTP URLs are accepted.
-   Valid HTTPS URLs are accepted.
-   Missing schemes are rejected or normalized according to the product
    contract.
-   Unsupported schemes such as `javascript:`, `data:`, `file:`, and
    `ftp:` are rejected.
-   Empty, malformed, excessively long, and whitespace-only values are
    rejected.
-   Hostnames are required.
-   Validation does not perform network requests.
-   Normalization preserves meaningful path, query, and fragment
    components.

### 5.3 Business rules

Verify:

-   Link ownership rules.
-   Link status and expiration behavior.
-   Analytics date-range boundaries.
-   Aggregation of clicks by day or other supported dimension.
-   Pagination defaults, limits, and invalid parameter handling.
-   Link creation limits and plan-specific limits, if applicable.

### 5.4 Error mapping

Verify that known domain errors map to the expected HTTP status and
response shape. Unexpected errors must not expose stack traces, SQL
details, secrets, or internal implementation data.

## 6. Integration Testing

Integration tests should exercise the application against a real
PostgreSQL instance using the test schema and the same Prisma migrations
used by deployment.

### 6.1 Authentication

Test:

-   Registration succeeds with valid input.
-   Duplicate email is rejected consistently.
-   Invalid email and password inputs fail validation.
-   Passwords are hashed and never stored in plaintext.
-   Login succeeds with valid credentials.
-   Login fails with invalid credentials without revealing whether the
    email exists.
-   Logout invalidates the session.
-   Protected routes reject missing, expired, or invalid sessions.
-   Session cookies use the required security attributes.
-   CSRF protection is enforced where cookie-based authentication
    requires it.

### 6.2 Link management

Test:

-   Authenticated user creates a link.
-   Short code is persisted and unique.
-   Optional custom alias follows validation rules.
-   Duplicate custom aliases are rejected.
-   User retrieves their own links.
-   User updates their own link.
-   User deletes or disables their own link according to the product
    contract.
-   User cannot read, update, or delete another user's link.
-   Invalid destination URLs are rejected.
-   Expiration and status fields are enforced.
-   Database uniqueness constraints remain effective under concurrent
    creation attempts.

### 6.3 Redirect behavior

Test the public redirect endpoint:

-   Existing active code returns the expected redirect status and
    `Location`.
-   Unknown code returns the defined not-found response.
-   Disabled code does not redirect.
-   Expired code does not redirect.
-   Deleted code does not redirect.
-   Redirect response does not render the destination as HTML.
-   Redirect target is the stored validated URL.
-   Redirect endpoint does not disclose owner or private metadata.
-   Click tracking behavior follows the chosen reliability contract.

For a redirect endpoint, prefer a 302 response for the MVP unless
product requirements explicitly select another status. Tests must assert
the exact status rather than accepting any 3xx response.

### 6.4 Analytics

Test:

-   Redirect events are associated with the correct link.
-   Analytics are scoped to the authenticated link owner.
-   Date filters include and exclude events at the correct boundaries.
-   Empty datasets return stable empty results.
-   Aggregates match inserted test events.
-   Pagination or time-series limits are enforced.
-   Analytics endpoints do not expose raw IP addresses or other
    prohibited personal data.
-   Click event persistence failures follow the documented redirect
    reliability policy.

### 6.5 Database integrity

Test:

-   Foreign keys prevent orphan click events.
-   Unique constraints prevent duplicate short codes.
-   Deletion behavior follows the documented cascade or retention
    policy.
-   Transactions preserve consistency when link creation and related
    records are written together.
-   Migration up/down behavior is verified where rollback is supported.
-   Production migrations are additive or otherwise safely deployable
    according to the release process.

## 7. API Contract Testing

For every endpoint in `api-specification.md`, verify:

-   HTTP method and route.
-   Authentication requirement.
-   Request schema and required fields.
-   Query parameter validation.
-   Success status and response schema.
-   Error status and error response schema.
-   Pagination metadata where applicable.
-   Rate-limit behavior.
-   Ownership and authorization rules.

Use shared schema definitions where possible so request validation and
API contract tests do not drift.

### Required API scenarios

  Endpoint area   Minimum scenarios
  --------------- -------------------------------------------------------
  Register        valid, duplicate email, invalid fields
  Login           valid credentials, invalid credentials, rate limited
  Logout          valid session, missing session
  Current user    authenticated, unauthenticated
  Create link     valid URL, invalid URL, alias conflict, limit reached
  List links      empty list, pagination, invalid filters
  Get link        owner, non-owner, unknown ID
  Update link     valid update, invalid URL, non-owner
  Delete link     owner, non-owner, unknown ID
  Analytics       valid range, invalid range, no events, non-owner
  Redirect        active, unknown, disabled, expired code

## 8. Frontend Testing

Use React Testing Library to test behavior visible to users rather than
component internals.

### 8.1 Authentication screens

Verify:

-   Form fields accept input.
-   Required and format validation appears.
-   Password fields are masked.
-   Submission disables or indicates loading.
-   Success navigates to the expected authenticated page.
-   API errors are displayed safely.
-   Session state is reflected after refresh.

### 8.2 Link dashboard

Verify:

-   Link list renders returned data.
-   Empty state appears when no links exist.
-   Loading state appears during requests.
-   API failures produce a recoverable error state.
-   Create-link form validates destination URL.
-   Copy action copies the correct short URL.
-   Edit and delete actions update the UI after confirmed API success.
-   Pagination and filters update the displayed results.
-   Users do not see controls or data for links they do not own.

### 8.3 Accessibility

For critical screens, verify:

-   Form controls have accessible names.
-   Keyboard navigation reaches interactive elements.
-   Focus is visible.
-   Dialogs manage focus appropriately.
-   Validation errors are associated with relevant fields.
-   Status updates are announced where appropriate.
-   Color is not the sole indicator of state.

## 9. End-to-End Testing

Use Playwright for a limited set of critical user journeys. Run these
against a test deployment or locally started application with an
isolated database.

### 9.1 Critical journeys

1.  Register a new user.
2.  Log in.
3.  Create a short link.
4.  Open the short URL in a new browser context.
5.  Verify the browser reaches the destination.
6.  Return to the dashboard.
7.  Verify the link appears in the user's list.
8.  Verify click analytics are recorded according to the product
    contract.
9.  Edit the link.
10. Verify the updated destination or metadata.
11. Delete or disable the link.
12. Verify the short URL no longer redirects.

### 9.2 Authorization journey

-   Create two test users.
-   User A creates a link.
-   User B attempts to access, edit, delete, and view analytics for User
    A's link.
-   Verify all unauthorized operations are denied without leaking
    private data.

### 9.3 Browser coverage

At minimum, run critical flows in Chromium. Add Firefox and WebKit
coverage when the supported-browser matrix and CI budget permit. Test
responsive layout at representative desktop and mobile viewport sizes.

## 10. Security Testing

Security tests are required for authentication, authorization, input
validation, redirects, and abuse controls.

### 10.1 Authentication and authorization

-   Verify password hashing.
-   Verify session expiration and logout behavior.
-   Verify protected routes reject unauthenticated requests.
-   Verify ownership checks are enforced on every user-owned resource
    endpoint.
-   Verify user identifiers supplied by clients cannot bypass ownership
    checks.
-   Verify cookie attributes and CSRF controls.

### 10.2 Input and redirect safety

-   Reject unsupported URL schemes.
-   Reject malformed input and unexpected object shapes.
-   Verify redirect destinations are selected only from persisted
    validated URLs.
-   Ensure no open redirect behavior exists in authentication or
    application navigation endpoints.
-   Ensure the server does not fetch destination URLs during validation
    or preview.
-   Verify SQL injection payloads are treated as data by Prisma and
    validation layers.
-   Verify HTML and script payloads are safely rendered or rejected.

### 10.3 Abuse controls

-   Test authentication rate limits.
-   Test link creation rate limits.
-   Test redirect endpoint behavior under high request volume.
-   Verify oversized request bodies are rejected.
-   Verify rate-limit responses include the documented status and
    headers where applicable.
-   Verify logs do not include passwords, session tokens, or unnecessary
    personal data.

Automated tests are not a substitute for a focused security review
before public launch.

## 11. Performance and Reliability Testing

### 11.1 Baseline performance

Measure:

-   Redirect endpoint latency.
-   Link creation latency.
-   Link list latency.
-   Analytics query latency.
-   Database connection pool behavior.

Record baseline results in staging. Define service-level objectives
separately from test assertions; avoid brittle tests that fail solely
due to shared CI machine variance.

### 11.2 Load testing

Before public launch, run controlled load tests against staging:

-   Sustained redirect traffic.
-   Bursts of redirect traffic.
-   Concurrent link creation.
-   Analytics queries over representative event volumes.
-   Database connection saturation behavior.

Do not load test production without an approved plan, limits, and
monitoring.

### 11.3 Reliability checks

Verify:

-   The API returns a controlled error when the database is unavailable.
-   The health endpoint reports dependency status accurately.
-   The redirect path follows the documented click-event failure policy.
-   Timeouts and retries are bounded.
-   Shutdown allows in-flight requests to complete within the configured
    grace period.

## 12. Test Data and Fixtures

Use factories or fixtures for:

-   Users with unique emails.
-   Links with valid and invalid destinations.
-   Active, expired, disabled, and deleted links.
-   Click events across date boundaries.
-   Links owned by different users.

Guidelines:

-   Use synthetic data only.
-   Avoid production user data.
-   Reset or isolate database state between tests.
-   Do not depend on insertion order unless explicitly asserted.
-   Use fixed clocks for expiration and date-range tests.
-   Keep fixture creation explicit and readable.

## 13. Test Coverage Targets

Coverage is a signal, not a substitute for meaningful assertions.

Initial targets:

-   Business logic and validation: at least 90% statement coverage.
-   API route and authorization logic: at least 80% statement coverage.
-   Overall backend: at least 80% statement coverage.
-   Critical redirect, authentication, and ownership paths: every
    defined branch covered.
-   Frontend: prioritize critical user flows and error states over a
    single global percentage.

Coverage exclusions must be documented and limited to generated code,
configuration glue, or other justified files.

## 14. CI Pipeline

Recommended pull-request pipeline:

1.  Install dependencies using the lockfile.
2.  Run formatting and lint checks.
3.  Run TypeScript type checking.
4.  Run unit tests.
5.  Start isolated PostgreSQL.
6.  Apply Prisma migrations.
7.  Run integration and API contract tests.
8.  Build frontend and backend.
9.  Run selected Playwright critical-path tests.
10. Publish test and coverage reports.

### CI failure conditions

A pull request must fail when:

-   Lint or type checking fails.
-   Required unit or integration tests fail.
-   Database migrations cannot be applied.
-   Production builds fail.
-   Critical end-to-end tests fail.
-   Coverage drops below the agreed threshold without an approved
    exception.
-   Secret scanning or dependency checks identify a blocking issue.

Do not automatically deploy production from an unverified branch.

## 15. Release Verification

Before production release:

-   Confirm CI is green.
-   Verify migrations against a production-like database.
-   Confirm environment variables are configured.
-   Confirm authentication and cookie settings for the production
    domain.
-   Confirm CORS and CSRF configuration.
-   Confirm rate limits.
-   Confirm health and readiness endpoints.
-   Confirm logs and error monitoring receive test events.
-   Run staging smoke tests for registration, login, link creation,
    redirect, analytics, and link deletion.
-   Verify backup and restore procedures.
-   Verify rollback or forward-fix procedures.
-   Confirm no test accounts, debug endpoints, or test secrets are
    enabled in production.

After deployment:

-   Run a minimal production smoke test using a controlled test account
    and destination.
-   Verify redirect behavior and API health.
-   Check error rates, latency, and database connectivity.
-   Remove or disable test data according to the retention policy.

## 16. Defect Severity

  -----------------------------------------------------------------------
  Severity                Definition              Release handling
  ----------------------- ----------------------- -----------------------
  Critical                Data exposure,          Block release;
                          authentication bypass,  immediate remediation
                          major outage, unsafe    
                          redirect behavior       

  High                    Core workflow broken,   Block release
                          ownership bypass,       
                          widespread API failure  

  Medium                  Important feature       Fix before release or
                          degraded with           approve explicitly
                          workaround              

  Low                     Minor UI issue or       Track and schedule
                          non-critical edge case  
  -----------------------------------------------------------------------

All defects should include reproduction steps, expected behavior, actual
behavior, environment, severity, and relevant sanitized logs.

## 17. Test Ownership

-   Developers own unit tests and tests for changed behavior.
-   Backend owners maintain API, database, authorization, and redirect
    integration tests.
-   Frontend owners maintain component and accessibility tests.
-   The release owner verifies staging and production smoke tests.
-   Security-sensitive changes require review of relevant security
    tests.

## 18. Definition of Done

A feature is test-complete when:

-   Acceptance criteria are covered by automated or documented manual
    tests.
-   Validation and failure cases are tested.
-   Authorization is tested for user-owned resources.
-   Relevant unit and integration tests pass.
-   Frontend behavior is tested where applicable.
-   API contract changes are reflected in tests and documentation.
-   No known critical or high-severity defect remains open.
-   CI passes and the change is reviewable.

## 19. Open Decisions

The following decisions must be finalized before implementation or
release:

-   Whether click-event persistence failure should block, delay, or not
    affect redirects.
-   Whether analytics are synchronous, asynchronous, or queued.
-   Whether deleted links retain analytics records.
-   Whether link expiration is enforced at request time or through
    background cleanup.
-   Which browsers and viewport sizes are officially supported.
-   Exact rate-limit thresholds for authentication, link creation, and
    redirects.
-   Whether custom aliases are case-sensitive.
-   Required performance objectives and load-test thresholds.

These decisions must be documented in the relevant product,
architecture, API, or security specification and reflected in tests.
