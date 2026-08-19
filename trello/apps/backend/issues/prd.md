## Problem Statement

Teams need a collaborative Trello-like workspace where work is organized hierarchically: **Organizations → Boards → Sections (lists) → Issues (cards) → Comments**. Users must be able to register and authenticate, manage their profile, create and manage organizations with role-based membership, create boards within organizations, organize work with sections, track detailed issues with assignees, and discuss via comments. Access control must ensure only organization members can access boards/sections/issues, and only admins can manage membership. Real-time collaboration (via the existing `apps/websocket` service) will eventually consume the same data model. The current codebase contains only a stub `app.ts` with a single `/api/signup` route, an incomplete `auth.controller.ts`, empty controller/route/middleware directories, and a Drizzle schema that defines the core tables but has no API surface wired up.

## Solution

Build a complete REST API under `/api` that implements every route in the specified API tree, backed by the existing Drizzle + Postgres schema (`users`, `organizations`, `userOrganizations`, `boards`, `sections`, `issues`, `comments`, `issueUsers`), JWT access/refresh authentication, and authorization middleware. The API will be served by Express (current backend stack) with Zod validation, bcrypt password hashing, and consistent JSON error handling. Each resource group will be a vertical slice (schema → service → controller → route → middleware → validation → tests) so it is independently demoable.

Base prefix: `/api`. All routes below are relative to `/api`.

```
/api/auth          → register, login, logout, refresh, me
/api/users         → me (get/patch/delete), get by id
/api/organizations → CRUD + members sub-resource
/api/organizations/:organizationId/boards → create/list boards
/api/boards        → get/patch/delete/get-full
/api/boards/:boardId/sections → create/list sections
/api/sections      → get/patch/delete
/api/sections/:sectionId/issues → create/list issues
/api/issues        → get/patch/delete/move + assignees + comments sub-resources
/api/comments      → get/patch/delete
```

Authentication uses HTTP-only cookies or Authorization header (to be decided) for access token, with refresh token rotation. Authorization checks organization membership and admin role where required.

## User Stories

### Auth

1. As a visitor, I want to register with username, email, and password, so that I can create an account.
2. As a visitor, I want to log in with email and password, so that I can obtain authenticated access.
3. As an authenticated user, I want to log out, so that my session is terminated.
4. As an authenticated user, I want to refresh my access token using a refresh token, so that I stay logged in without re-entering credentials.
5. As an authenticated user, I want to fetch my current auth profile via `GET /auth/me`, so that the client can confirm session validity.

### Users

6. As an authenticated user, I want to get my own user profile via `GET /users/me`, so that I can view my account details.
7. As an authenticated user, I want to update my own profile (username, email) via `PATCH /users/me`, so that I can keep my information current.
8. As an authenticated user, I want to delete my own account via `DELETE /users/me`, so that I can leave the platform.
9. As an authenticated user, I want to fetch another user's public profile via `GET /users/:userId`, so that I can see who is assigned or commenting.

### Organizations

10. As an authenticated user, I want to create an organization via `POST /organizations`, so that I can start a workspace.
11. As an authenticated user, I want to list organizations I belong to via `GET /organizations`, so that I can navigate my workspaces.
12. As an organization member, I want to fetch organization details via `GET /organizations/:organizationId`, so that I can view its metadata.
13. As an organization admin, I want to update organization details via `PATCH /organizations/:organizationId`, so that I can rename or re-describe it.
14. As an organization admin, I want to delete an organization via `DELETE /organizations/:organizationId`, so that I can clean up unused workspaces.

### Organization Members

15. As an organization admin or member, I want to list members via `GET /organizations/:organizationId/members`, so that I can see who has access.
16. As an organization admin, I want to add a member via `POST /organizations/:organizationId/members`, so that I can invite collaborators.
17. As an organization admin, I want to update a member's role via `PATCH /organizations/:organizationId/members/:userId`, so that I can promote/demote admins.
18. As an organization admin, I want to remove a member via `DELETE /organizations/:organizationId/members/:userId`, so that I can revoke access.

### Boards

19. As an organization member, I want to create a board in an organization via `POST /organizations/:organizationId/boards`, so that I can organize work.
20. As an organization member, I want to list boards in an organization via `GET /organizations/:organizationId/boards`, so that I can browse workspaces.
21. As an organization member, I want to fetch a single board via `GET /boards/:boardId`, so that I can view its details.
22. As an organization member (or admin), I want to update a board via `PATCH /boards/:boardId`, so that I can rename or re-describe it.
23. As an organization admin, I want to delete a board via `DELETE /boards/:boardId`, so that I can remove obsolete boards.
24. As an organization member, I want to fetch a board with all nested sections, issues, assignees, and comments via `GET /boards/:boardId/full`, so that the frontend can render the full board in one request.

### Sections

25. As an organization member, I want to create a section in a board via `POST /boards/:boardId/sections`, so that I can add a list/column.
26. As an organization member, I want to list sections in a board via `GET /boards/:boardId/sections`, so that I can render the board layout.
27. As an organization member, I want to fetch a single section via `GET /sections/:sectionId`, so that I can view its details.
28. As an organization member, I want to update a section via `PATCH /sections/:sectionId`, so that I can rename it or reorder it.
29. As an organization member, I want to delete a section via `DELETE /sections/:sectionId`, so that I can remove empty lists (cascading issues).

### Issues

30. As an organization member, I want to create an issue in a section via `POST /sections/:sectionId/issues`, so that I can add a card/task.
31. As an organization member, I want to list issues in a section via `GET /sections/:sectionId/issues`, so that I can view cards in a column.
32. As an organization member, I want to fetch a single issue via `GET /issues/:issueId`, so that I can view its details.
33. As an organization member, I want to update an issue via `PATCH /issues/:issueId`, so that I can edit title/description.
34. As an organization member, I want to delete an issue via `DELETE /issues/:issueId`, so that I can remove completed tasks.
35. As an organization member, I want to move an issue to another section via `PATCH /issues/:issueId/move`, so that I can implement drag-and-drop.

### Issue Assignees

36. As an organization member, I want to list assignees of an issue via `GET /issues/:issueId/assignees`, so that I can see who is responsible.
37. As an organization member, I want to assign a user to an issue via `POST /issues/:issueId/assignees`, so that I can delegate work.
38. As an organization member, I want to remove an assignee via `DELETE /issues/:issueId/assignees/:userId`, so that I can reassign work.

### Comments

39. As an organization member, I want to list comments on an issue via `GET /issues/:issueId/comments`, so that I can read discussion.
40. As an organization member, I want to add a comment to an issue via `POST /issues/:issueId/comments`, so that I can discuss work.
41. As an authenticated user, I want to fetch a single comment via `GET /comments/:commentId`, so that I can view or link to it.
42. As a comment author, I want to update my comment via `PATCH /comments/:commentId`, so that I can correct it.
43. As a comment author or admin, I want to delete a comment via `DELETE /comments/:commentId`, so that I can moderate discussion.

### Cross-cutting

44. As an API consumer, I want validation errors to return 400 with structured details, so that I can fix requests.
45. As an API consumer, I want unauthorized requests to return 401 and forbidden requests to return 403, so that I can handle auth flows correctly.
46. As an API consumer, I want not-found resources to return 404, so that I can distinguish missing data from permission errors.
47. As a developer, I want all routes to enforce that the requesting user is a member of the owning organization (via board → organization chain), so that data is isolated.

## Implementation Decisions

- **Stack**: Keep Express (already in `backend/package.json`) rather than migrating to `Bun.serve()` immediately; align with existing `auth.controller.ts` and Drizzle usage. Bun remains the runtime and test runner.
- **Modules to build/modify**:
  - `src/middlewares/auth.ts` — JWT verification, attaches `req.user`; `requireAuth` guard.
  - `src/middlewares/authorize.ts` — organization membership/role checks; `requireOrgMember`, `requireOrgAdmin`.
  - `src/lib/jwt.ts` — sign/verify access and refresh tokens using `env.ACCESS_TOKEN_SECRET` / `REFRESH_TOKEN_SECRET`; honour `ACCESS_TOKEN_EXPIRY` / `REFRESH_TOKEN_EXPIRY`.
  - `src/lib/validation.ts` — Zod schemas for each resource; thin wrappers for `validateBody` / `validateParams`.
  - `src/controllers/auth/` — register, login, logout, refresh, me.
  - `src/controllers/users/` — getMe, patchMe, deleteMe, getById.
  - `src/controllers/organizations/` — CRUD plus member handlers.
  - `src/controllers/boards/` — org-scoped create/list + board-scoped get/patch/delete/full.
  - `src/controllers/sections/` — board-scoped create/list + section get/patch/delete.
  - `src/controllers/issues/` — section-scoped create/list + issue get/patch/delete/move + assignee handlers + comment-list/create delegation.
  - `src/controllers/comments/` — get/patch/delete (issue-scoped create/list lives under issues controller).
  - `src/routes/*` — one router per resource group mounted under `/api` in `app.ts`.
  - `src/app.ts` — replace stub `/api/signup` with full router mount, global error handler, cookie parser, CORS.
- **Interfaces**: Controllers use `(req, res, next)` Express signature; services are plain async functions taking typed DTOs and `userId`; middleware augments `Request` with `user: { id, email, username }`.
- **Schema changes**: No new tables required for MVP. Verify existing migration: `organizations.name` should not be globally unique (current migration has `UNIQUE` but `schema.ts` does not — decide and generate a follow-up migration). Add `position`/`order` columns to `sections` and `issues` if drag-and-drop ordering is needed (defer to move implementation: use `PATCH /issues/:issueId/move` with `targetSectionId` and optional `position`). Consider adding `createdBy` to `organizations`/`boards` for audit, but not required for routes.
- **API contracts**:
  - Auth: `POST /api/auth/register { username, email, password } → 201 { user }`; `POST /api/auth/login { email, password } → 200 { accessToken, refreshToken }` plus httpOnly cookies; `POST /api/auth/logout → 200`; `POST /api/auth/refresh { refreshToken } → 200 { accessToken }`; `GET /api/auth/me → 200 { user }`.
  - Users: `GET /api/users/me`, `PATCH /api/users/me`, `DELETE /api/users/me`, `GET /api/users/:userId`.
  - Organizations: `POST /api/organizations { name, description }`, `GET /api/organizations`, `GET /api/organizations/:organizationId`, `PATCH /api/organizations/:organizationId`, `DELETE /api/organizations/:organizationId`, plus members sub-resource with `role` enum `admin|member`.
  - Boards: `POST /api/organizations/:organizationId/boards { title, description }`, `GET /api/organizations/:organizationId/boards`, `GET /api/boards/:boardId`, `PATCH /api/boards/:boardId`, `DELETE /api/boards/:boardId`, `GET /api/boards/:boardId/full → { board, sections: [{ section, issues: [{ issue, assignees, comments }] }] }`.
  - Sections: `POST /api/boards/:boardId/sections { title }`, `GET /api/boards/:boardId/sections`, `GET /api/sections/:sectionId`, `PATCH /api/sections/:sectionId`, `DELETE /api/sections/:sectionId`.
  - Issues: `POST /api/sections/:sectionId/issues { title, description }`, `GET /api/sections/:sectionId/issues`, `GET /api/issues/:issueId`, `PATCH /api/issues/:issueId`, `DELETE /api/issues/:issueId`, `PATCH /api/issues/:issueId/move { targetSectionId }`.
  - Issue assignees: `GET /api/issues/:issueId/assignees`, `POST /api/issues/:issueId/assignees { userId }`, `DELETE /api/issues/:issueId/assignees/:userId`.
  - Comments: `GET /api/issues/:issueId/comments`, `POST /api/issues/:issueId/comments { content }`, `GET /api/comments/:commentId`, `PATCH /api/comments/:commentId { content }`, `DELETE /api/comments/:commentId`.
  - Standard status codes: 200, 201, 204, 400, 401, 403, 404, 409 (duplicate member/assignee), 500.
- **Auth flow**: Passwords hashed with bcrypt (10 rounds). Access token short-lived (15m default), refresh token long-lived (7d), stored via httpOnly cookie or returned in body. `POST /refresh` verifies refresh token and issues new pair. `GET /auth/me` and `GET /users/me` both return current user but under different prefixes; keep both for compatibility (auth/me is session check, users/me is profile).
- **Authorization**: Every organization-scoped route checks `userOrganizations` for membership; admin-only routes (`PATCH/DELETE organization`, member add/update/remove, board delete) check `role === 'admin'`. Board/section/issue/comment routes resolve the owning organization via joins (`comment → issue → section → board → organization`) and reuse the same check. Assignee/comment author checks allow self-edit.
- **Validation**: Zod schemas for body, params (UUID), and query; middleware returns 400 with `issues` array on failure.
- **Error handling**: Central error middleware maps thrown `AppError(status, message)` to JSON; unknown errors → 500.
- **Cascades**: Drizzle `onDelete: "cascade"` already handles board→sections→issues→comments/assignees and user/org removal; delete handlers rely on DB cascade but also return 404 if not found / not authorized.

## Testing Decisions

- **What makes a good test**: Test external HTTP behavior (status codes, JSON shape, auth/authorization, validation) via `fetch`/`supertest` against the Express app, not internal function calls. Assert side effects via DB queries where needed. Each vertical slice has happy path, 401/403, 404, 400 validation, and isolation tests.
- **Which modules will be tested**:
  - Auth slice: register/login/logout/refresh/me.
  - Users slice: me CRUD + getById.
  - Organizations slice: org CRUD + members.
  - Boards slice: org-board create/list, board CRUD, full.
  - Sections slice: board-section create/list, section CRUD.
  - Issues slice: section-issue create/list, issue CRUD, move.
  - Assignees slice: assign/list/remove.
  - Comments slice: issue comments + comment CRUD.
- **Prior art**: No existing tests in `apps/backend` (no `*.test.ts` found). Use `bun test` with `bun:test` (`test`, `expect`) per `CLAUDE.md`. Spin up test DB via `DATABASE_URL` (or in-memory Postgres via `pg-mem` / testcontainers if available); seed users/orgs via helpers. Follow patterns from `packages/db` schema for direct DB assertions. Use `Bun.file` / `fetch` style where applicable but supertest against exported `app` is acceptable for Express.

## Out of Scope

- Real-time websocket broadcasting of mutations (handled by `apps/websocket` — will subscribe to DB changes later).
- OAuth (Google/GitHub), email verification, password reset / forgot-password flows, even though env vars exist.
- File uploads / S3 profile pics, even though S3 env vars exist.
- Pagination, filtering, search, sorting beyond basic list endpoints.
- Board/section/issue reordering beyond single `move` endpoint (no bulk reorder API).
- Audit logs, activity feed, notifications.
- Rate limiting, request logging, metrics, and analytics (PostHog).
- Frontend integration (React app in `apps/frontend`).
- Changing runtime from Express to `Bun.serve()` or introducing `Elysia`/`Hono`.

## Further Notes

- The current `app.ts` stub at `POST /api/signup` (unhashed password, no validation) must be removed and replaced by the full router. The existing `auth.controller.ts` has bugs (e.g., `existingUser` truthiness check on array) that must be fixed in the Auth slice.
- `organizations.name` unique constraint inconsistency between `schema.ts` (no unique) and initial migration (unique) should be resolved; organizations should allow duplicate names across different owners but may enforce per-user uniqueness if desired — keep non-unique for now.
- `GET /auth/me` vs `GET /users/me` duplication is intentional per spec; implement both and ensure they return the same user payload but via different routers.
- `GET /boards/:boardId/full` is the primary endpoint for the frontend board view; ensure it performs a single efficient query (joins or batched queries) and respects membership checks.
- Consider adding `position` columns in a follow-up if ordering stability is required; initial `move` can simply reassign `sectionId`.
- Env vars `RESEND_*`, `AWS_*`, `GOOGLE_*`, `GITHUB_*` are not needed for this PRD; leave them unused.
- All routes are under `/api`; ensure `app.ts` mounts routers with correct prefixes to match the spec exactly (e.g., `/api/organizations/:organizationId/boards` not `/api/boards` for creation).
