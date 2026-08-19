## Parent PRD

`issues/prd.md`

## What to build

Users vertical slice: profile management for the authenticated user and public user lookup. Implements `GET /api/users/me`, `PATCH /api/users/me`, `DELETE /api/users/me`, `GET /api/users/:userId`. Reuses auth middleware from `001-auth`. Includes Zod validation for patch body, ownership checks for delete, and handling of cascading deletes (userOrganizations, issueUsers, comments). `GET /users/me` is distinct from `GET /auth/me` but returns same shape.

## Acceptance criteria

- [ ] `GET /api/users/me` returns current user's profile (id, email, username, createdAt), 401 if unauthenticated
- [ ] `PATCH /api/users/me` validates optional `username, email`, checks uniqueness, updates `updatedAt`, returns 200 with updated user; 400 on invalid, 409 on duplicate
- [ ] `DELETE /api/users/me` deletes current user and cascades memberships, returns 204 or 200; subsequent auth fails with 401
- [ ] `GET /api/users/:userId` returns public profile (id, username, email or limited fields) if authenticated, 404 if not found, 401 if unauthenticated
- [ ] All routes enforce authentication via `requireAuth`
- [ ] Validation errors return 400 with Zod issues array

## Blocked by

- Blocked by `issues/001-auth.md`

## User stories addressed

- User story 6 (GET /users/me)
- User story 7 (PATCH /users/me)
- User story 8 (DELETE /users/me)
- User story 9 (GET /users/:userId)
