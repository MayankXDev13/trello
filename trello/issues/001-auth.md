## Parent PRD

`issues/prd.md`

## What to build

Auth vertical slice: end-to-end registration, login, logout, refresh, and session check. Covers `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `POST /api/auth/refresh`, `GET /api/auth/me`. Includes Zod validation, bcrypt hashing (10 rounds), JWT access/refresh signing via `env.ACCESS_TOKEN_SECRET` / `REFRESH_TOKEN_SECRET`, auth middleware (`requireAuth`), and error handling. Fixes existing bugs in `auth.controller.ts` (array truthiness check, missing token return, missing cookie/header handling). This slice unblocks all other slices.

## Acceptance criteria

- [ ] `POST /api/auth/register` validates `username, email, password`, checks duplicate email/username, hashes password, returns 201; 409/400 on duplicate; 400 on invalid body
- [ ] `POST /api/auth/login` validates credentials, returns 200 with `accessToken` and `refreshToken` (body and/or httpOnly cookie), 401 on invalid credentials
- [ ] `POST /api/auth/logout` clears/invalidates refresh token, requires auth, returns 200
- [ ] `POST /api/auth/refresh` verifies refresh token and issues new access token (and optionally new refresh token), 401 on invalid/expired
- [ ] `GET /api/auth/me` returns current user (id, email, username) when authenticated, 401 otherwise
- [ ] Passwords are never returned in responses; bcrypt compare is used
- [ ] JWT middleware attaches `req.user` and is reusable by other slices
- [ ] Central error handler returns JSON `{ message }` with correct status codes

## Blocked by

None - can start immediately

## User stories addressed

- User story 1 (register)
- User story 2 (login)
- User story 3 (logout)
- User story 4 (refresh)
- User story 5 (GET /auth/me)
- User story 44-47 (validation, 401/403/404 handling for auth routes)
