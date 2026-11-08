# API Specification

## Production URL Shortener --- REST API v1

**Document status:** Development specification\
**Version:** 1.0\
**Base path:** `/api/v1`\
**Related documents:** `prd.md`, `requirements.md`, `user-flow.md`,
`database-schema.md`, `architecture.md`

------------------------------------------------------------------------

## 1. API Overview

The API supports authentication, short-link lifecycle management, and
link analytics. Public redirect requests are handled separately from the
JSON API.

### 1.1 Base URLs

-   Local: `http://localhost:5000/api/v1`
-   Production: `https://apiref.softics.in/api/v1`
-   Production Frontend: `https://urlref.softics.in`

### 1.2 Content and response conventions

-   Request body: `application/json`
-   Response body: `application/json`, except redirects and health
    endpoints.
-   Dates: ISO 8601 UTC timestamps.
-   IDs: UUID strings.
-   API version: `/api/v1`.
-   All request payloads are validated server-side.
-   Unknown fields should be rejected or ignored consistently;
    recommended MVP behavior is strict validation and rejection.

### 1.3 Authentication

Recommended MVP approach: server-managed session in a secure cookie.

Cookie requirements in production: - `HttpOnly` - `Secure` -
`SameSite=Lax` or stricter where compatible - Appropriate path and
expiration - Session identifier rotated on login and privilege changes

If bearer tokens are selected instead, document token storage, refresh,
revocation, and expiration before implementation. Do not mix strategies
without a defined contract.

### 1.4 Common success envelope

For JSON endpoints:

``` json
{
  "data": {},
  "meta": {}
}
```

`meta` is omitted when not needed.

### 1.5 Common error envelope

``` json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request is invalid.",
    "details": [
      {
        "field": "destinationUrl",
        "code": "INVALID_URL",
        "message": "Enter a valid HTTP or HTTPS URL."
      }
    ],
    "requestId": "req_..."
  }
}
```

Requirements: - `error.code` is stable and machine-readable. - `message`
is safe for display. - `details` is optional. - `requestId` is optional
but recommended for support and log correlation. - Never include stack
traces, SQL errors, secrets, session values, or internal hostnames.

------------------------------------------------------------------------

## 2. Shared Data Contracts

### 2.1 User response

``` json
{
  "id": "uuid",
  "email": "user@example.com",
  "createdAt": "2026-11-07T10:00:00.000Z"
}
```

Never return `passwordHash`, session tokens, or authentication secrets.

### 2.2 Link response

``` json
{
  "id": "uuid",
  "code": "Ab12Cd",
  "shortUrl": "https://<short-domain>/Ab12Cd",
  "destinationUrl": "https://example.com/page",
  "isActive": true,
  "expiresAt": null,
  "createdAt": "2026-11-07T10:00:00.000Z",
  "updatedAt": "2026-11-07T10:00:00.000Z",
  "clickCount": 0
}
```

`clickCount` may be omitted from endpoints that do not load analytics.
`shortUrl` is generated from trusted server configuration, not an
arbitrary request header.

### 2.3 Pagination

List endpoints use: - `page`: integer, default `1`, minimum `1` -
`limit`: integer, default `20`, maximum `100` - `sort`: allowlisted
field - `order`: `asc` or `desc`

Example metadata:

``` json
{
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3
  }
}
```

Offset pagination is acceptable for MVP. Consider cursor pagination if
link counts or page depth become large.

------------------------------------------------------------------------

## 3. Authentication Endpoints

### 3.1 Register

`POST /auth/register`

Authentication: public\
Rate limit: required

Request:

``` json
{
  "email": "user@example.com",
  "password": "Strong-password-here"
}
```

Validation: - Email is required and valid. - Email is normalized
according to the shared account policy. - Password meets configured
minimum length and complexity policy. - Reject unexpected fields. -
Never log the password.

Success: `201 Created`

``` json
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "createdAt": "2026-11-07T10:00:00.000Z"
    }
  }
}
```

The response establishes the configured session only if registration
auto-login is part of the chosen product behavior. Otherwise, return the
account and require login.

Errors: - `400 VALIDATION_ERROR` - `409 EMAIL_UNAVAILABLE` or generic
registration conflict, according to account-enumeration policy -
`429 RATE_LIMITED` - `500 INTERNAL_ERROR`

### 3.2 Login

`POST /auth/login`

Authentication: public\
Rate limit: required

Request:

``` json
{
  "email": "user@example.com",
  "password": "Strong-password-here"
}
```

Success: `200 OK`

``` json
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "createdAt": "2026-11-07T10:00:00.000Z"
    }
  }
}
```

Server sets the session cookie. The session ID must be rotated after
successful authentication.

Errors: - `400 VALIDATION_ERROR` - `401 INVALID_CREDENTIALS` -
`429 RATE_LIMITED` - `500 INTERNAL_ERROR`

Use a generic invalid-credentials message for unknown email and wrong
password.

### 3.3 Logout

`POST /auth/logout`

Authentication: required\
CSRF protection: required when cookie-authenticated

Success: `204 No Content`

Server invalidates the session and clears the cookie. If no active
session exists, behavior should be idempotent.

Errors: - `401 UNAUTHENTICATED` where the contract requires an active
session - `403 CSRF_INVALID` - `500 INTERNAL_ERROR`

### 3.4 Current user

`GET /auth/me`

Authentication: required

Success: `200 OK`

``` json
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "createdAt": "2026-11-07T10:00:00.000Z"
    }
  }
}
```

Errors: - `401 UNAUTHENTICATED` - `500 INTERNAL_ERROR`

------------------------------------------------------------------------

## 4. Link Endpoints

### 4.1 Create link

`POST /links`

Authentication: required\
Rate limit: required\
CSRF protection: required for cookie-authenticated requests

Request:

``` json
{
  "destinationUrl": "https://example.com/a/long/path",
  "customAlias": "my-page",
  "expiresAt": "2026-12-01T00:00:00.000Z"
}
```

Fields: - `destinationUrl` --- required, HTTP/HTTPS only. -
`customAlias` --- optional; allowed character set and length configured
by product. - `expiresAt` --- optional ISO 8601 UTC timestamp; null or
omission means no expiration.

Server behavior: 1. Authenticate user. 2. Validate and normalize
destination URL. 3. Validate alias and reserved words. 4. Validate
expiration policy. 5. Generate a code or reserve alias. 6. Persist with
`userId` derived from session. 7. Return created link.

Success: `201 Created`

``` json
{
  "data": {
    "link": {
      "id": "uuid",
      "code": "my-page",
      "shortUrl": "https://<short-domain>/my-page",
      "destinationUrl": "https://example.com/a/long/path",
      "isActive": true,
      "expiresAt": "2026-12-01T00:00:00.000Z",
      "createdAt": "2026-11-07T10:00:00.000Z",
      "updatedAt": "2026-11-07T10:00:00.000Z",
      "clickCount": 0
    }
  }
}
```

Errors: - `400 VALIDATION_ERROR` - `401 UNAUTHENTICATED` -
`409 ALIAS_UNAVAILABLE` - `429 RATE_LIMITED` - `500 INTERNAL_ERROR` -
`503 SERVICE_UNAVAILABLE`

Do not accept `userId` from the request body.

### 4.2 List links

`GET /links`

Authentication: required

Query parameters: - `page` --- default `1` - `limit` --- default `20`,
max `100` - `sort` --- allowlisted: `createdAt`, `updatedAt`,
`clickCount` - `order` --- `asc` or `desc` - `status` --- optional:
`active`, `disabled`, `expired` - `search` --- optional search over code
or destination, with length limits

Success: `200 OK`

``` json
{
  "data": {
    "links": [
      {
        "id": "uuid",
        "code": "Ab12Cd",
        "shortUrl": "https://<short-domain>/Ab12Cd",
        "destinationUrl": "https://example.com/page",
        "isActive": true,
        "expiresAt": null,
        "createdAt": "2026-11-07T10:00:00.000Z",
        "updatedAt": "2026-11-07T10:00:00.000Z",
        "clickCount": 10
      }
    ]
  },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

Requirements: - Results are scoped to authenticated user. - Sort fields
are allowlisted. - Search is parameterized and length-limited. - Expired
status is derived consistently from server time. - Do not expose
click-event rows.

Errors: - `400 VALIDATION_ERROR` - `401 UNAUTHENTICATED` -
`500 INTERNAL_ERROR`

### 4.3 Get link

`GET /links/:id`

Authentication: required

Success: `200 OK`

``` json
{
  "data": {
    "link": {
      "id": "uuid",
      "code": "Ab12Cd",
      "shortUrl": "https://<short-domain>/Ab12Cd",
      "destinationUrl": "https://example.com/page",
      "isActive": true,
      "expiresAt": null,
      "createdAt": "2026-11-07T10:00:00.000Z",
      "updatedAt": "2026-11-07T10:00:00.000Z",
      "clickCount": 10
    }
  }
}
```

Errors: - `400 INVALID_ID` - `401 UNAUTHENTICATED` -
`404 LINK_NOT_FOUND` - `500 INTERNAL_ERROR`

The server must query within the current user's ownership scope. Return
a safe not-found response for non-owned records.

### 4.4 Update link

`PATCH /links/:id`

Authentication: required\
CSRF protection: required for cookie-authenticated requests

Request:

``` json
{
  "destinationUrl": "https://example.com/new-destination",
  "expiresAt": null
}
```

Allowed fields: - `destinationUrl` - `expiresAt`

`isActive` is changed through dedicated status endpoints. `code` is
immutable in MVP. Unknown fields are rejected.

Success: `200 OK`

``` json
{
  "data": {
    "link": {
      "id": "uuid",
      "code": "Ab12Cd",
      "shortUrl": "https://<short-domain>/Ab12Cd",
      "destinationUrl": "https://example.com/new-destination",
      "isActive": true,
      "expiresAt": null,
      "createdAt": "2026-11-07T10:00:00.000Z",
      "updatedAt": "2026-11-07T10:05:00.000Z",
      "clickCount": 10
    }
  }
}
```

Errors: - `400 VALIDATION_ERROR` - `401 UNAUTHENTICATED` -
`404 LINK_NOT_FOUND` - `409 UPDATE_CONFLICT` if optimistic concurrency
is implemented - `500 INTERNAL_ERROR`

### 4.5 Deactivate link

`POST /links/:id/deactivate`

Authentication: required\
CSRF protection: required for cookie-authenticated requests

Success: `200 OK`

``` json
{
  "data": {
    "link": {
      "id": "uuid",
      "isActive": false,
      "updatedAt": "2026-11-07T10:05:00.000Z"
    }
  }
}
```

Repeated deactivation should be idempotent.

Errors: - `401 UNAUTHENTICATED` - `404 LINK_NOT_FOUND` -
`500 INTERNAL_ERROR`

### 4.6 Reactivate link

`POST /links/:id/reactivate`

Authentication: required\
CSRF protection: required for cookie-authenticated requests

Server checks: - Link belongs to current user. - Link is not deleted. -
Link is not expired. - Any product policy restrictions are satisfied.

Success: `200 OK`

``` json
{
  "data": {
    "link": {
      "id": "uuid",
      "isActive": true,
      "updatedAt": "2026-11-07T10:05:00.000Z"
    }
  }
}
```

Errors: - `401 UNAUTHENTICATED` - `404 LINK_NOT_FOUND` -
`409 LINK_EXPIRED` - `500 INTERNAL_ERROR`

### 4.7 Delete link

`DELETE /links/:id`

Authentication: required\
CSRF protection: required for cookie-authenticated requests

Recommended MVP behavior: hard delete link and associated click events,
with code reuse policy separately defined.

Success: `204 No Content`

Errors: - `401 UNAUTHENTICATED` - `404 LINK_NOT_FOUND` -
`500 INTERNAL_ERROR`

Deletion must follow the data-retention policy in `database-schema.md`.

### 4.8 Link analytics

`GET /links/:id/analytics`

Authentication: required

Query parameters: - `from` --- optional ISO 8601 timestamp - `to` ---
optional ISO 8601 timestamp - `interval` --- optional: `day`; default
depends on implementation

Success: `200 OK`

``` json
{
  "data": {
    "linkId": "uuid",
    "totalClicks": 125,
    "series": [
      {
        "date": "2026-11-06",
        "clicks": 20
      },
      {
        "date": "2026-11-07",
        "clicks": 30
      }
    ],
    "trafficSources": [
      { "referrer": "twitter.com", "clicks": 65 },
      { "referrer": "direct", "clicks": 40 }
    ],
    "deviceDistribution": [
      { "deviceType": "desktop", "clicks": 80 },
      { "deviceType": "mobile", "clicks": 45 }
    ],
    "geographicDistribution": [
      { "countryCode": "US", "clicks": 70 },
      { "countryCode": "IN", "clicks": 35 }
    ]
  }
}
```

Requirements: - Verify link ownership before returning analytics. -
`from` must be earlier than `to`. - Restrict date range to a configured
maximum. - Aggregate in UTC. - Do not expose raw click events or visitor
identifiers.

Errors: - `400 VALIDATION_ERROR` - `401 UNAUTHENTICATED` -
`404 LINK_NOT_FOUND` - `500 INTERNAL_ERROR`

### 4.9 Dashboard overview analytics

`GET /analytics/overview`

Authentication: required

Query parameters:
- `from` --- optional ISO 8601 timestamp
- `to` --- optional ISO 8601 timestamp

Success: `200 OK`

``` json
{
  "data": {
    "totalLinks": 24,
    "totalClicks": 1420,
    "clicksOverTime": [
      {
        "date": "2026-11-01",
        "clicks": 120
      },
      {
        "date": "2026-11-02",
        "clicks": 185
      }
    ],
    "trafficSources": [
      {
        "referrer": "twitter.com",
        "clicks": 620
      },
      {
        "referrer": "direct",
        "clicks": 450
      }
    ],
    "deviceDistribution": [
      {
        "deviceType": "desktop",
        "clicks": 800
      },
      {
        "deviceType": "mobile",
        "clicks": 550
      },
      {
        "deviceType": "tablet",
        "clicks": 70
      }
    ],
    "geographicDistribution": [
      {
        "countryCode": "US",
        "clicks": 600
      },
      {
        "countryCode": "IN",
        "clicks": 420
      },
      {
        "countryCode": "GB",
        "clicks": 180
      }
    ]
  }
}
```

Requirements:
- Scope all aggregation strictly to links owned by the authenticated user.
- Aggregate over configured date range in UTC.
- Return zero-filled time series for empty dates if configured.

Errors:
- `400 VALIDATION_ERROR`
- `401 UNAUTHENTICATED`
- `500 INTERNAL_ERROR`

------------------------------------------------------------------------

## 5. Public Redirect Endpoint

### 5.1 Redirect

`GET /:code`

This route is served by the short-link host and is not under `/api/v1`.

Server behavior: 1. Validate code format and reject reserved application
paths. 2. Resolve code using the unique index. 3. Check link active
status. 4. Check expiration using server time. 5. Record click analytics
according to the event policy. 6. Return redirect response.

Successful response: - `302 Found` -
`Location: <stored destination URL>` - `Cache-Control` should reflect
the redirect consistency policy. Recommended MVP: avoid long-lived
caching until invalidation behavior is implemented.

Error behavior: - Unknown code: `404 Not Found` - Disabled or expired
link: controlled `404` or `410 Gone` response, chosen consistently -
Malformed code: `400` or `404`, chosen consistently - Database
unavailable: `503 Service Unavailable`

The redirect endpoint must not: - Accept destination URL from the
visitor request. - Redirect to arbitrary query parameters. - Trust an
unvalidated host header to construct the short URL. - Reveal private
link metadata. - Block redirect indefinitely waiting for analytics.

### 5.2 Redirect response choice

MVP uses `302 Found`: - Destination can change. - Link deactivation and
expiration should take effect. - Avoid permanent caching by browsers and
intermediary proxies.

Do not switch to `301` without a documented product decision.

------------------------------------------------------------------------

## 6. Health and Operational Endpoints

### 6.1 Liveness

`GET /health/live`

No authentication.

Success: `200 OK`

``` json
{
  "status": "ok"
}
```

Liveness should indicate that the process is running, not that every
dependency is healthy.

### 6.2 Readiness

`GET /health/ready`

No authentication, but should expose only minimal operational status.

Success:

``` json
{
  "status": "ready"
}
```

Failure: `503 Service Unavailable`

Readiness may check database connectivity with a short timeout. Do not
expose database hostnames, credentials, or detailed dependency errors.

------------------------------------------------------------------------

## 7. Error Codes

  HTTP   Code                    Meaning
  ------ ----------------------- ----------------------------------------------
  400    `VALIDATION_ERROR`      Request fields invalid
  400    `INVALID_ID`            Resource identifier malformed
  401    `UNAUTHENTICATED`       Session missing or invalid
  401    `INVALID_CREDENTIALS`   Login credentials invalid
  403    `CSRF_INVALID`          CSRF validation failed
  404    `LINK_NOT_FOUND`        Link missing or not owned
  409    `ALIAS_UNAVAILABLE`     Alias already reserved
  409    `UPDATE_CONFLICT`       Concurrent update conflict
  409    `LINK_EXPIRED`          Link cannot be reactivated due to expiration
  429    `RATE_LIMITED`          Rate limit exceeded
  500    `INTERNAL_ERROR`        Unexpected server failure
  503    `SERVICE_UNAVAILABLE`   Dependency or service unavailable

Error code names and semantics must remain stable within API v1.

------------------------------------------------------------------------

## 8. Validation Rules

### Destination URL

-   Required for create.
-   Optional for patch, but if supplied must be valid.
-   Accept only `http` and `https`.
-   Reject credentials embedded in URL unless product explicitly
    supports them.
-   Reject malformed URLs and control characters.
-   Do not perform server-side destination fetches in MVP.
-   Normalize only where safe; preserve path/query semantics.

### Custom alias

-   Optional.
-   Allowed characters: configured ASCII alphabet and digits; hyphen may
    be allowed if approved.
-   Enforce configured min/max length.
-   Case handling must match redirect routing and database uniqueness.
-   Reject reserved route names.
-   Return conflict for existing alias.

### Expiration

-   ISO 8601 timestamp.
-   Store UTC.
-   Null means no expiration.
-   Reject invalid timestamps.
-   Define whether past expiration is rejected at create/update;
    recommended reject for create and update.
-   Reactivation must check expiration.

### Pagination and search

-   `page >= 1`.
-   `1 <= limit <= 100`.
-   Sorting fields allowlisted.
-   Search string length bounded.
-   Parameterized queries only.

------------------------------------------------------------------------

## 9. Security Requirements

-   Authentication middleware on all protected endpoints.
-   Ownership enforcement on link details, mutations, and analytics.
-   CSRF defense for cookie-authenticated mutations.
-   Rate limiting on auth, link creation, and redirects.
-   Request schema validation.
-   Secure session cookies.
-   Security headers.
-   Safe error responses.
-   Structured logs with request ID.
-   No credentials, passwords, cookies, or raw tokens in logs.
-   Use trusted configured short-link origin to build `shortUrl`.
-   Avoid open redirect by redirecting only to persisted validated
    destinations.
-   Avoid SSRF by not fetching destinations in MVP.
-   Apply database parameterization through Prisma or safe SQL.

------------------------------------------------------------------------

## 10. Rate-Limit Policy

Exact thresholds are configuration decisions and must be tuned after
load testing. Apply limits by: - IP for public registration/login and
redirect abuse controls. - Authenticated user for link creation. -
Session/user for sensitive mutations.

Rate-limit response: - HTTP `429`. - Stable `RATE_LIMITED` error. -
`Retry-After` header when available. - Do not expose internal rate-limit
keys or infrastructure details.

Do not use a single low global limit that blocks normal redirect
traffic. Redirect protection should be designed separately from account
and link-creation limits.

------------------------------------------------------------------------

## 11. CORS and CSRF

### CORS

-   Allow only configured frontend origins.
-   Do not use wildcard origins with credentials.
-   Set allowed methods and headers explicitly.
-   CORS is not authentication.

### CSRF

If session cookies authenticate API requests: - Protect state-changing
requests. - Validate origin/referer where appropriate. - Use a CSRF
token strategy compatible with the frontend. - `SameSite` cookie policy
is defense-in-depth, not the only CSRF defense.

------------------------------------------------------------------------

## 12. API Versioning and Compatibility

-   All JSON endpoints are under `/api/v1`.
-   Additive optional fields may be introduced without breaking clients.
-   Do not rename or change field types in v1 without compatibility
    planning.
-   Error codes remain stable.
-   Redirect URLs are product resources and must remain compatible.
-   Deprecation must be documented before removal.

------------------------------------------------------------------------

## 13. OpenAPI Implementation Requirements

Before release, create a machine-readable OpenAPI file: - Recommended
location: `docs/openapi.yaml`. - Define all paths, schemas,
authentication, errors, query parameters, and status codes. - Generate
or validate API documentation from the contract. - Use contract
validation in tests. - Keep OpenAPI aligned with runtime validation
schemas.

This Markdown document is the human-readable API contract;
`openapi.yaml` is the implementation artifact to add during API
development.

------------------------------------------------------------------------

## 14. API Acceptance Checklist

-   [ ] Register, login, logout, and current-user endpoints implemented.
-   [ ] Session behavior and CSRF policy documented.
-   [ ] Create/list/get/update/delete link endpoints implemented.
-   [ ] Deactivate/reactivate endpoints implemented.
-   [ ] Analytics endpoint enforces ownership.
-   [ ] Redirect endpoint validates code and checks active/expiration.
-   [ ] All user IDs derive from authenticated identity.
-   [ ] URL and alias validation are server-side.
-   [ ] Pagination and sorting are bounded and allowlisted.
-   [ ] Error envelope and stable codes are consistent.
-   [ ] Rate limits are applied and tested.
-   [ ] CORS and security headers are configured.
-   [ ] OpenAPI contract matches implementation.
-   [ ] Integration and E2E tests cover success and failure paths.
