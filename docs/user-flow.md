# User Flows

## Production URL Shortener

**Document status:** Development specification\
**Version:** 1.0\
**Related documents:** `prd.md`, `requirements.md`, `architecture.md`

------------------------------------------------------------------------

## 1. Purpose

This document defines the primary user journeys and their expected
states for the URL Shortener MVP. It is intended to guide frontend
screens, API integration, authorization, and end-to-end tests.

## 2. Actors

-   **Visitor:** Opens a short URL without signing in.
-   **Registered user:** Creates and manages their own short links.
-   **System:** Validates requests, persists data, redirects visitors,
    and records analytics.
-   **Operator:** Maintains service health and responds to abuse or
    incidents; operator UI is outside MVP unless separately approved.

## 3. Navigation Model

### Public routes

-   `/` --- landing page or product entry
-   `/login` --- login
-   `/register` --- registration
-   `/:code` --- short-link redirect route

### Authenticated routes

-   `/dashboard` --- overview and link list
-   `/links/new` --- create link
-   `/links/:id` --- link details and analytics
-   `/links/:id/edit` --- edit link

The frontend must not treat route protection as the security boundary.
Every protected API operation must authenticate the user and enforce
ownership on the server.

------------------------------------------------------------------------

## 4. Flow A --- Registration

### Preconditions

-   User is signed out.
-   User has a valid email and password.

### Main flow

1.  User opens `/register`.
2.  User enters email and password, then submits.
3.  Client validates required fields and basic format.
4.  API validates the payload, normalizes email, checks uniqueness, and
    hashes the password.
5.  API creates the account.
6.  API establishes the configured authentication session.
7.  Client navigates to `/dashboard`.
8.  Dashboard loads the current user and their links.

### Alternate and failure paths

-   Missing or invalid fields: show field-level validation; do not
    submit.
-   Email already registered: show a generic, safe response according to
    the account-enumeration policy.
-   Rate limit reached: show a retry-later message.
-   Network or server error: retain safe form values, show an error, and
    allow retry.
-   Session creation fails after account creation: show a recoverable
    message and direct the user to log in; avoid creating duplicate
    accounts on retry.

### Success state

-   User is authenticated.
-   Dashboard is visible.
-   Account data is persisted.

------------------------------------------------------------------------

## 5. Flow B --- Login and Logout

### Login

1.  User opens `/login`.
2.  User enters email and password.
3.  Client validates required fields.
4.  API verifies credentials and establishes a session.
5.  Client requests current-user information.
6.  Client navigates to the intended protected route or `/dashboard`.

### Login failure states

-   Invalid credentials: show a generic authentication error.
-   Rate limited: show a retry-later message.
-   API unavailable: show a service error without clearing the form.
-   Session cannot be established: remain signed out.

### Logout

1.  User selects Logout.
2.  Client sends logout request.
3.  Server invalidates the session.
4.  Client clears authenticated user state.
5.  Client navigates to `/login`.

If logout fails, the client must not claim that the server session was
invalidated. Clear local sensitive UI state and show an appropriate
error; session expiry and server-side invalidation remain authoritative.

------------------------------------------------------------------------

## 6. Flow C --- Create a Short Link

### Preconditions

-   User is authenticated.
-   User has access to the dashboard.

### Main flow

1.  User opens `/dashboard` or `/links/new`.
2.  User enters the destination URL.
3.  User may optionally enter a custom alias and expiration timestamp.
4.  Client validates required fields and basic URL format.
5.  User submits the form.
6.  API authenticates the user.
7.  API validates URL scheme, destination, alias rules, and expiration.
8.  API generates a short code or reserves the requested alias.
9.  API persists the link with ownership.
10. API returns the created link.
11. Client displays the short URL, destination, and copy action.
12. Link appears in the user's list.

### Alternate paths

-   Destination missing: show required-field error.
-   Destination malformed or unsupported scheme: reject with field-level
    error.
-   Custom alias invalid or reserved: show alias validation error.
-   Alias already exists: explain that the alias is unavailable;
    preserve other fields.
-   Generated code collision: server retries generation safely; user
    should not see an internal collision.
-   Rate limit exceeded: show retry-later message.
-   API unavailable: preserve form data and allow retry.
-   Duplicate destination: create a separate link unless deduplication
    is explicitly introduced.

### Success state

-   Link exists in the database.
-   Link belongs to the current user.
-   Short URL is visible and copyable.

------------------------------------------------------------------------

## 7. Flow D --- Copy and Open a Short Link

### Copy

1.  User selects Copy.
2.  Client copies the short URL to the clipboard.
3.  Client shows copy success only if clipboard operation succeeds.
4.  If clipboard access fails, display the short URL with a manual copy
    fallback.

### Open / redirect

1.  Visitor opens `https://short-domain.example/:code`.
2.  Server validates the code format.
3.  Server finds the link by unique code.
4.  Server checks whether the link exists, is active, and is not
    expired.
5.  Server records or queues click analytics according to the analytics
    policy.
6.  Server responds with `302 Found` and a `Location` header containing
    the stored destination.
7.  Browser navigates to the destination.

### Redirect outcomes

  -----------------------------------------------------------------------
  Condition                           Expected result
  ----------------------------------- -----------------------------------
  Valid, active, not expired          `302` redirect

  Code not found                      `404` not found page

  Link disabled                       Controlled unavailable-link
                                      response

  Link expired                        Controlled expired-link response

  Invalid code format                 `400` or `404`, per API/web routing
                                      policy

  Database unavailable                `503` service unavailable

  Analytics failure                   Redirect should still succeed if
                                      analytics is designed as
                                      best-effort/asynchronous
  -----------------------------------------------------------------------

Do not expose the destination or owner details on error pages unless
product policy explicitly allows it.

------------------------------------------------------------------------

## 8. Flow E --- View Dashboard and Link List

### Main flow

1.  Authenticated user opens `/dashboard`.
2.  Client loads current-user data.
3.  Client requests the user's links with pagination and sorting.
4.  API verifies authentication and scopes results to the current user.
5.  Client displays links with short URL, destination, status, creation
    date, expiration, and click count.
6.  User can create a link or open a link's detail page.

### States

-   Loading: display skeleton or loading indicator.
-   Empty: explain that no links exist and show create-link entry point.
-   Loaded: display link rows/cards and pagination.
-   API error: show retry action.
-   Session expired: clear user state and navigate to login.

### List behavior

-   Pagination must be server-side.
-   Sorting must use an allowlist of fields.
-   Query parameters must not allow access to another user's records.
-   Destination text must be safely rendered and truncated when
    necessary.
-   Status must be communicated with text or accessible labels, not
    color alone.

------------------------------------------------------------------------

## 9. Flow F --- View Link Details and Analytics

### Main flow

1.  User selects a link from the dashboard.
2.  Client opens `/links/:id`.
3.  Client requests link details and analytics.
4.  API authenticates user and verifies link ownership.
5.  API returns permitted link metadata and aggregate analytics.
6.  Client displays destination, short URL, status, expiration, total
    clicks, and available time-series data.

### Failure paths

-   Link does not exist: show not-found state.
-   Link belongs to another user: return a safe not-found or forbidden
    response according to policy; do not reveal ownership.
-   Analytics unavailable: display link details with analytics
    unavailable state.
-   No click events: show zero-data state.
-   Session expired: return to login.

### MVP analytics

-   Total clicks.
-   Clicks over time only if the aggregation is implemented and
    reliable.
-   Any bot filtering or deduplication limitations must be documented in
    the UI.

------------------------------------------------------------------------

## 10. Flow G --- Edit Destination or Expiration

### Main flow

1.  User opens an owned link's edit page.
2.  Client loads current editable fields.
3.  User updates destination URL and/or expiration.
4.  Client validates fields.
5.  API authenticates user and checks ownership.
6.  API validates new values.
7.  API updates the record.
8.  API invalidates relevant caches if caching exists.
9.  Client shows updated values.

### Failure paths

-   Invalid destination: show validation error.
-   Expiration in the past: reject or immediately mark expired according
    to the agreed policy.
-   Link not found or not owned: safe error response.
-   Update conflict: show that the record changed and reload current
    data.
-   API failure: preserve user edits and allow retry.

### Redirect consistency

After destination update, future redirects must use the new destination.
Any cache must be invalidated or bounded by a documented TTL and must
not allow stale destination behavior beyond the product's defined
consistency window.

------------------------------------------------------------------------

## 11. Flow H --- Deactivate and Reactivate a Link

### Deactivate

1.  User selects Deactivate.
2.  Client shows confirmation if the action is destructive to sharing
    availability.
3.  API authenticates user and checks ownership.
4.  API sets `isActive = false`.
5.  Client updates status to Disabled.
6.  Requests to the short URL no longer redirect.

### Reactivate

1.  User selects Reactivate on a disabled link.
2.  API authenticates user and checks ownership.
3.  API checks expiration and policy constraints.
4.  If not expired, API sets `isActive = true`.
5.  Client updates status to Active.
6.  Redirects resume.

### Edge cases

-   Expired link cannot become active unless expiration is also updated.
-   Repeated deactivate/reactivate requests should be idempotent.
-   A disabled link must remain disabled even if a cached lookup exists.

------------------------------------------------------------------------

## 12. Flow I --- Delete a Link

### Main flow

1.  User selects Delete.
2.  Client presents confirmation with clear impact.
3.  User confirms.
4.  API authenticates user and checks ownership.
5.  API deletes or soft-deletes the link according to the data-retention
    decision.
6.  Client removes the link from the list and navigates to dashboard.

### Failure paths

-   User cancels: no API request.
-   Link missing/not owned: safe error.
-   Database failure: retain list item and show retry.
-   Analytics retention policy requires preservation: delete or
    anonymize analytics according to the documented policy.

### Required decision

Before implementation, define whether deletion is: - **Hard delete:**
link and associated click events are removed. - **Soft delete:** link is
marked deleted and retained for operational or audit purposes.

The redirect response for a deleted link must be documented. Recommended
MVP behavior: return not found and do not redirect.

------------------------------------------------------------------------

## 13. Flow J --- Expired Link

### Main flow

1.  Visitor requests a short code.
2.  Server loads the link.
3.  Server compares expiration with current server time.
4.  If expired, server does not redirect.
5.  Server returns a controlled expired-link response.

### Dashboard behavior

-   Display status as Expired.
-   Allow the owner to edit expiration if policy permits.
-   Reactivation alone must not bypass expiration.

### Boundary rule

A link is expired when `now >= expiresAt`. All timestamps are stored and
compared consistently, preferably in UTC.

------------------------------------------------------------------------

## 14. Flow K --- Unauthorized Link Management

### Scenario

A user attempts to access or mutate a link they do not own.

### Flow

1.  Client requests a link using an ID.
2.  API authenticates the user.
3.  API queries the link within the current user's ownership scope.
4.  If no owned record is found, API returns a safe not-found response.
5.  Client displays a generic unavailable state.

### Security requirement

Never authorize based on a client-provided `userId`. The server derives
the user identity from the authenticated session.

------------------------------------------------------------------------

## 15. Flow L --- Rate Limit and Abuse Handling

### Link creation

1.  User submits link creation.
2.  API checks rate-limit policy.
3.  If within limit, continue validation and creation.
4.  If over limit, return a rate-limit response with retry guidance
    where safe.

### Redirect abuse

1.  Visitor requests a short link.
2.  Edge/API protection evaluates request rate and abuse signals.
3.  Legitimate request continues to redirect.
4.  Suspicious traffic may be throttled or blocked under documented
    policy.

### Abuse report / operator response

The MVP may not include a public report UI. The operational process must
still define how an operator receives a report, reviews the short code,
disables a malicious link, and records the action.

------------------------------------------------------------------------

## 16. Flow M --- Session Expiration

1.  User opens a protected route.
2.  Client requests protected API data.
3.  API returns an authentication-required response.
4.  Client clears stale authenticated state.
5.  Client redirects to `/login`.
6.  After successful login, client may return to the originally
    requested route if the redirect target is validated as an internal
    path.

Do not accept arbitrary external return URLs from query parameters.

------------------------------------------------------------------------

## 17. Screen Inventory

  ------------------------------------------------------------------------
  Screen                  Access                  Main purpose
  ----------------------- ----------------------- ------------------------
  Landing                 Public                  Explain product and
                                                  direct users to
                                                  login/register

  Register                Public                  Create account

  Login                   Public                  Authenticate

  Dashboard               Authenticated           List links and summary

  Create Link             Authenticated           Create short link

  Link Details            Authenticated           View link and analytics

  Edit Link               Authenticated           Update
                                                  destination/expiration

  Redirect Error          Public                  Explain invalid,
                                                  disabled, or expired
                                                  link

  Not Found               Public                  Handle unknown
                                                  application routes
  ------------------------------------------------------------------------

## 18. Shared UI States

Every API-backed screen should define: - Initial loading. - Loaded
state. - Empty state. - Validation error. - Authentication-required
state. - Permission/not-found state. - Rate-limit state. -
Network/server error. - Retry behavior.

Mutating actions should disable duplicate submission while a request is
pending. Success messages must be shown only after the server confirms
the operation.

## 19. End-to-End Test Scenarios

### Authentication

-   Register with valid data.
-   Register with invalid data.
-   Register duplicate email.
-   Login with valid and invalid credentials.
-   Logout and verify protected APIs reject the session.
-   Session expiration redirects to login.

### Link creation

-   Create generated-code link.
-   Create custom alias.
-   Reject invalid URL.
-   Reject unsupported scheme.
-   Reject reserved alias.
-   Reject duplicate alias.
-   Verify ownership is assigned server-side.

### Redirect

-   Redirect active link.
-   Return controlled response for unknown code.
-   Return controlled response for disabled link.
-   Return controlled response for expired link.
-   Verify redirect destination changes after edit.
-   Verify analytics failure does not break redirect if analytics is
    best-effort.

### Management

-   List only current user's links.
-   View owned link.
-   Reject access to another user's link.
-   Edit destination.
-   Deactivate/reactivate.
-   Delete and verify defined deletion behavior.

### Resilience and security

-   Rate-limit link creation.
-   Handle database unavailable.
-   Handle malformed code.
-   Verify authorization on every mutation.
-   Verify no secret data appears in logs or error responses.

## 20. Flow Completion Criteria

A flow is complete when: - Preconditions and actor permissions are
enforced. - Main and failure paths are implemented. - API responses are
handled consistently. - Loading, empty, success, and error states are
present. - Relevant automated tests pass. - The flow works at mobile and
desktop viewport sizes. - Security and ownership checks are verified
server-side.
