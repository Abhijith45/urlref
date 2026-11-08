# Security Requirements

## Production URL Shortener

**Document status:** Development specification\
**Version:** 1.0\
**Related documents:** `prd.md`, `requirements.md`,
`api-specification.md`, `database-schema.md`, `architecture.md`

------------------------------------------------------------------------

## 1. Purpose

Define security controls required before the URL Shortener is exposed to
public traffic.

The service accepts user-provided destination URLs and exposes public
redirects. Its main risks include account compromise, link abuse,
unauthorized data access, redirect manipulation, denial of service, and
leakage of user or visitor information.

Security must be enforced by the backend and infrastructure. Frontend
validation is for usability only.

## 2. Security Objectives

1.  Protect user accounts and sessions.
2.  Enforce link ownership for every private operation.
3.  Prevent unsafe or manipulated redirects.
4.  Reduce abuse of link creation and redirect traffic.
5.  Protect database and application secrets.
6.  Minimize visitor data collection.
7.  Provide logs and operational controls for investigation.
8.  Establish a repeatable security testing and incident response
    process.

## 3. Threat Model

### 3.1 Assets

-   User credentials and session state.
-   Link destinations and private dashboard data.
-   Short-code namespace and redirect integrity.
-   Click analytics.
-   Database credentials and application secrets.
-   Application availability and reputation of the short-link domain.

### 3.2 Trust boundaries

-   Browser ↔ frontend.
-   Browser ↔ API.
-   Public visitor ↔ redirect service.
-   Application ↔ PostgreSQL.
-   Application ↔ optional queue/cache/monitoring services.
-   Deployment pipeline ↔ production environment.

### 3.3 Threats and controls

  -----------------------------------------------------------------------
  Threat                              Required control
  ----------------------------------- -----------------------------------
  Account takeover                    Password hashing, rate limiting,
                                      secure session cookies

  IDOR / cross-user access            Server-side ownership checks on
                                      every link operation

  Open redirect                       Redirect only to persisted
                                      validated destination URLs

  SSRF                                Do not fetch destinations in MVP;
                                      harden any future fetch/preview
                                      feature

  Malicious links                     Abuse reporting, throttling, link
                                      disablement, operational review

  SQL injection                       Prisma parameterization; safe
                                      raw-query policy

  CSRF                                CSRF protection for
                                      cookie-authenticated state changes

  XSS                                 React escaping, safe URL rendering,
                                      CSP, avoid unsafe HTML

  Session theft                       HttpOnly/Secure cookies, HTTPS,
                                      session rotation

  Brute force                         Rate limiting, generic auth errors,
                                      monitoring

  DoS                                 Request limits, rate limits,
                                      database pool limits,
                                      infrastructure protection

  Secret leakage                      Secret manager/platform environment
                                      variables, log redaction

  Analytics privacy                   Minimal fields, retention policy,
                                      no raw IP in MVP

  Cache stale status                  Explicit invalidation or bounded
                                      TTL; active/expiry checks
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 4. Authentication and Account Security

### 4.1 Password handling

-   Store password hashes only.
-   Use Argon2id or another currently approved password-hashing
    algorithm with an appropriate work factor.
-   Never use plain SHA-256 or reversible encryption for passwords.
-   Never log passwords or include them in error responses.
-   Apply password length limits to prevent resource-exhaustion attacks.
-   Avoid arbitrary composition rules that reduce usability without
    meaningful security benefit.
-   Use a generic login error for unknown email and wrong password.

### 4.2 Registration

-   Validate and normalize email consistently.
-   Enforce unique account identity in the database.
-   Rate-limit registration by IP and other appropriate signals.
-   Avoid revealing whether an email is already registered when account
    enumeration is a concern.
-   Do not create default production accounts or passwords.

### 4.3 Login

-   Rate-limit by IP and account identifier using a carefully designed
    policy.
-   Avoid permanent account lockout that attackers can use to deny
    service.
-   Use generic invalid-credentials messages.
-   Monitor repeated failures and unusual patterns.
-   Use CAPTCHA or additional challenge only when risk signals justify
    it.

### 4.4 Session strategy

Recommended MVP: server-managed session with an opaque cookie.

Cookie attributes: - `HttpOnly` - `Secure` in production -
`SameSite=Lax` or stricter if application flows permit - Narrow path and
appropriate expiration - No sensitive data stored in cookie payload

Additional requirements: - Rotate session ID after login. - Invalidate
session server-side on logout. - Enforce idle and absolute session
expiration. - Do not store session identifiers in localStorage. -
Protect session store and configure expiration cleanup. - Do not trust
client-side authentication state as authorization.

If JWT is selected instead, document token lifetime, refresh,
revocation, storage, rotation, and replay protections before
implementation.

------------------------------------------------------------------------

## 5. Authorization and Ownership

Every private link endpoint must enforce ownership on the server.

Required for: - List links. - Retrieve link details. - Update
destination or expiration. - Deactivate/reactivate. - Delete. - Read
analytics.

Rules: - Derive user identity from the authenticated session. - Never
trust a client-supplied `userId`. - Query by resource ID and
authenticated owner together. - Return a safe not-found response for
non-owned resources when avoiding enumeration. - Apply the same
authorization rules to background jobs and internal services. - Add
authorization tests for every private endpoint.

Authorization must not depend on the frontend hiding buttons or routes.

------------------------------------------------------------------------

## 6. Destination URL Validation

### 6.1 MVP allowlist

Accept only: - `http:` - `https:`

Reject: - `javascript:` - `data:` - `file:` - `ftp:` - custom schemes -
malformed URLs - control characters - URLs with invalid host structure -
embedded username/password credentials unless explicitly supported

Validation must run on the backend for both create and update.

### 6.2 Parsing and normalization

-   Parse using a standard URL parser.
-   Validate protocol and hostname.
-   Preserve destination path, query, and fragment semantics.
-   Do not construct the destination by concatenating untrusted strings.
-   Avoid aggressive normalization that changes the destination.
-   Define handling for internationalized domain names and hostname
    casing.
-   Reject leading/trailing whitespace or normalize it consistently.
-   Never redirect to a destination supplied directly by a redirect
    request query parameter.

### 6.3 Redirect integrity

-   Resolve short code to a database record.
-   Redirect only to the stored validated destination.
-   Use the configured short-link domain to construct displayed short
    URLs.
-   Do not trust arbitrary `Host` or forwarded-host headers unless
    validated by trusted proxy configuration.
-   Use `302 Found` for MVP.
-   Do not use `301` until caching and destination mutability are
    understood.
-   Return controlled errors for missing, disabled, and expired links.

------------------------------------------------------------------------

## 7. SSRF Policy

The MVP must not make server-side HTTP requests to submitted destination
URLs.

Do not implement: - Link preview fetches. - Destination screenshot
generation. - Metadata extraction by fetching user URLs. - URL health
checks from the application server.

If such features are added later, they require a separate SSRF design
including: - Block private, loopback, link-local, multicast, reserved,
and metadata-service IP ranges. - Validate both IPv4 and IPv6. - Resolve
DNS and validate the resolved addresses. - Protect against DNS
rebinding. - Revalidate every redirect hop. - Restrict protocols and
ports. - Apply network egress controls. - Use short timeouts and
response-size limits. - Run fetches in an isolated service with no
access to internal credentials. - Never forward application cookies,
authorization headers, or internal headers. - Log only necessary
metadata.

A hostname allowlist alone is insufficient for a general-purpose URL
fetcher.

------------------------------------------------------------------------

## 8. Link Abuse and Reputation

URL shorteners can be abused for phishing, malware distribution, spam,
and deceptive redirects.

### MVP controls

-   Rate-limit link creation.
-   Limit link creation volume per account.
-   Validate URL syntax and scheme.
-   Provide a way for operators to disable links.
-   Maintain an abuse response process.
-   Monitor abnormal creation and redirect patterns.
-   Avoid presenting the service as certifying destination safety.
-   Use a clear product identity and abuse contact on the public site.

### Future controls

-   Public abuse-report form.
-   Domain reputation checks through a reviewed provider.
-   Automated suspicious-link scoring.
-   User quotas and account verification.
-   Admin moderation interface.
-   Repeat-abuse account suspension.

External reputation services must be evaluated for privacy, cost, false
positives, and data-sharing implications.

------------------------------------------------------------------------

## 9. Rate Limiting and Resource Protection

Apply separate policies to: - Registration. - Login. - Link creation. -
Link mutations. - Analytics queries. - Redirect requests. - Health
endpoints where appropriate.

Requirements: - Use IP-based limits for public endpoints. - Use
account/session-based limits for authenticated actions. - Avoid a single
low limit that blocks legitimate redirect traffic. - Return HTTP `429`
with stable error code. - Include `Retry-After` where available. - Use
distributed rate limiting if multiple application instances are
deployed. - Configure maximum request body size. - Set request,
database, and downstream timeouts. - Limit pagination and analytics date
ranges. - Protect database connection pool capacity. - Apply CDN/WAF
protections where appropriate.

Rate-limit thresholds must be configurable and validated through load
tests.

------------------------------------------------------------------------

## 10. CSRF, CORS, and Browser Security

### 10.1 CSRF

For cookie-authenticated state-changing requests: - Use a CSRF token
strategy. - Validate origin/referer where appropriate. - Use suitable
`SameSite` cookie attributes. - Protect create, update, deactivate,
reactivate, delete, and logout operations. - Do not treat `SameSite` as
the only defense.

### 10.2 CORS

-   Allow only explicitly configured frontend origins.
-   Do not combine wildcard origin with credentials.
-   Allow only required methods and headers.
-   Avoid reflecting arbitrary origin values.
-   CORS is not authorization.

### 10.3 Security headers

Configure at least: - `Content-Security-Policy` -
`Strict-Transport-Security` in HTTPS production -
`X-Content-Type-Options: nosniff` - `Referrer-Policy` -
`X-Frame-Options` or CSP `frame-ancestors` - A suitable
`Permissions-Policy`

CSP must match actual frontend asset and API requirements. Avoid broad
`unsafe-eval` or `unsafe-inline` allowances unless justified.

### 10.4 XSS

-   Render user-controlled destination URLs as text.
-   Do not use `dangerouslySetInnerHTML` for user data.
-   Validate URL before creating clickable links.
-   Use safe link attributes and avoid unsafe scriptable schemes.
-   Ensure analytics and error text are escaped.
-   Apply CSP as defense-in-depth.

------------------------------------------------------------------------

## 11. Database and Data Security

-   Use managed PostgreSQL with TLS.
-   Use separate credentials for development, staging, and production.
-   Grant the application only required database privileges.
-   Keep migration credentials separate from runtime credentials where
    supported.
-   Never expose the database publicly without required network
    controls.
-   Use parameterized queries; avoid unsafe raw SQL.
-   Enforce uniqueness and foreign keys in the database.
-   Use connection pool limits.
-   Encrypt backups according to provider capabilities.
-   Restrict backup access.
-   Test restore procedures.
-   Do not log connection strings or database credentials.
-   Review data access and retention periodically.

### 11.1 Data minimization

MVP click events should store: - Link ID. - Click timestamp.

Do not store raw IP addresses, full user-agent strings, visitor
identity, or full referrer URLs by default.

If analytics metadata is added: - Define its purpose. - Review privacy
and applicable legal obligations. - Limit access. - Define retention and
deletion. - Avoid collecting sensitive URL query parameters. - Consider
aggregation or truncation before persistence.

------------------------------------------------------------------------

## 12. Secrets and Configuration

Secrets include: - Database credentials. - Session signing/encryption
keys. - OAuth credentials if added. - Monitoring DSNs where sensitive. -
Queue/cache credentials. - Deployment tokens.

Requirements: - Store secrets in platform secret/environment
management. - Never commit secrets to Git. - Provide `.env.example` with
placeholders only. - Do not print secrets during startup. - Rotate
secrets when exposed and periodically according to operational policy. -
Restrict production secret access. - Use separate credentials per
environment. - Review deployment logs and CI output for accidental
leakage.

------------------------------------------------------------------------

## 13. Logging and Monitoring

### 13.1 Log requirements

Use structured logs with: - Timestamp. - Severity. - Request ID. - Route
or operation. - Status code. - Duration. - Safe user/account identifier
where operationally necessary. - Error code.

Do not log: - Passwords. - Session cookies. - Authorization headers. -
CSRF tokens. - Database URLs. - Full request bodies by default. - Raw IP
addresses unless explicitly approved and justified. - Sensitive
destination query values.

### 13.2 Monitoring

Monitor: - Authentication failures. - Link creation rates. - Redirect
rates and latency. - HTTP 4xx/5xx rates. - Rate-limit triggers. -
Database availability and pool saturation. - Analytics queue
backlog/failure if asynchronous. - Backup and migration failures. -
Abuse reports and disabled-link counts.

Alerts should be actionable and routed to an owner.

------------------------------------------------------------------------

## 14. Infrastructure and Deployment Security

-   Enforce HTTPS for frontend, API, and short-link domain.
-   Configure trusted proxy behavior explicitly.
-   Do not trust arbitrary `X-Forwarded-*` headers.
-   Use a WAF/CDN where appropriate.
-   Restrict production database network access.
-   Keep runtime and dependencies patched.
-   Use non-root containers if containerized.
-   Configure least-privilege deployment credentials.
-   Separate staging and production.
-   Protect production deployments with review and CI checks.
-   Use health checks without exposing sensitive diagnostics.
-   Configure safe rollback.
-   Disable debug mode in production.

### Cloudflare / proxy considerations

-   Configure the origin to accept traffic only from trusted proxy paths
    where feasible.
-   Ensure client IP handling uses trusted proxy configuration.
-   Do not use untrusted forwarded host values to generate short URLs.
-   Confirm TLS mode and origin certificate configuration.
-   Ensure rate limits and caching do not bypass link status checks.

------------------------------------------------------------------------

## 15. Dependency and Supply-Chain Security

-   Pin dependencies through lockfiles.
-   Use automated dependency vulnerability scanning.
-   Review high and critical vulnerabilities before release.
-   Avoid unmaintained packages for authentication, URL parsing, and
    cryptography.
-   Use official packages and verified sources.
-   Keep Node.js and build tooling supported.
-   Protect GitHub Actions or CI secrets.
-   Restrict workflow permissions.
-   Avoid executing untrusted pull-request code with production secrets.
-   Review generated artifacts and dependency updates.

------------------------------------------------------------------------

## 16. Security Testing

### Authentication

-   Invalid credentials.
-   Brute-force/rate-limit behavior.
-   Session rotation.
-   Logout invalidation.
-   Cookie flags.
-   CSRF rejection.

### Authorization

-   User A cannot read User B's link.
-   User A cannot update, deactivate, reactivate, delete, or read
    analytics for User B's link.
-   Client-supplied user IDs are ignored.
-   Non-owned resources return safe responses.

### URL and redirect

-   HTTP and HTTPS accepted.
-   Unsupported schemes rejected.
-   Malformed URLs rejected.
-   Embedded credentials rejected according to policy.
-   Query-string redirect manipulation rejected.
-   Host header manipulation does not change short URL origin.
-   Disabled and expired links do not redirect.
-   Destination update takes effect according to cache policy.

### Injection and browser security

-   SQL/ORM injection attempts.
-   XSS payloads in destination and alias.
-   Unsafe URL schemes in dashboard.
-   CSP and security headers.
-   Request body limits.

### Abuse and resilience

-   Link creation rate limit.
-   Login rate limit.
-   Redirect flood behavior.
-   Database unavailable behavior.
-   Analytics failure behavior.
-   Queue saturation if applicable.

Automate security tests in CI where practical. Perform a manual security
review before public launch.

------------------------------------------------------------------------

## 17. Incident Response

### 17.1 Malicious link report

1.  Receive report through the documented abuse channel.
2.  Identify the short code.
3.  Review destination and evidence using safe procedures.
4.  Disable the link if confirmed or risk is sufficiently high.
5.  Record action and reason without storing unnecessary personal data.
6.  Respond to the reporter according to policy.
7.  Escalate repeat abuse or legal requests to the designated operator.

### 17.2 Credential or secret exposure

1.  Revoke or rotate affected credential.
2.  Identify affected environment and service.
3.  Review logs for unauthorized access.
4.  Restore secure configuration.
5.  Notify affected parties if required.
6.  Document root cause and preventive changes.

### 17.3 Service compromise

1.  Restrict access or isolate affected component.
2.  Preserve necessary logs.
3.  Rotate secrets and sessions.
4.  Patch or rollback.
5.  Restore from trusted backups if needed.
6.  Verify integrity and monitor.
7.  Document incident and lessons.

------------------------------------------------------------------------

## 18. Privacy and Legal Review

Before public launch: - Publish privacy policy and terms appropriate to
the service. - Publish an abuse contact or reporting mechanism. - Define
analytics collection and retention. - Review applicable Indian data
protection requirements and any requirements for target markets. -
Define response procedures for valid legal requests. - Avoid promising
that short links are safe or that destination sites are verified. -
Avoid collecting visitor data beyond the product's stated purpose.

This document is engineering guidance, not legal advice. Product owners
should obtain appropriate legal review for public launch.

------------------------------------------------------------------------

## 19. Security Release Gates

Do not launch publicly until: - \[ \] HTTPS is enforced. - \[ \] Session
cookie configuration is reviewed. - \[ \] Authentication rate limits are
active. - \[ \] Link creation rate limits are active. - \[ \]
Server-side ownership checks cover every private endpoint. - \[ \] URL
validation rejects unsupported schemes. - \[ \] Redirects use only
stored validated destinations. - \[ \] CSRF protection is tested if
cookie auth is used. - \[ \] CORS is restricted to trusted origins. - \[
\] Security headers are configured. - \[ \] Secrets are absent from
source control and logs. - \[ \] Database backups and restore are
tested. - \[ \] Error responses do not expose internals. - \[ \]
Critical security tests pass. - \[ \] Abuse response owner and process
are defined. - \[ \] Privacy policy and terms are available. - \[ \]
High/critical dependency vulnerabilities are resolved or formally
accepted.

## 20. Security Decisions to Finalize

-   Session cookie auth versus bearer-token auth.
-   Password hashing algorithm and parameters.
-   Session expiration and revocation policy.
-   Rate-limit thresholds and storage.
-   Alias character set and reserved names.
-   Link deletion and code-reuse policy.
-   Analytics retention.
-   Abuse report channel and moderation authority.
-   Whether destination reputation checking is included.
-   Whether any future feature fetches destination URLs.

These decisions must be documented before implementation of the relevant
feature.
