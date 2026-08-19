## Parent PRD

`issues/prd.md`

## What to build

Boards vertical slice: boards within organizations. Implements `POST /api/organizations/:organizationId/boards`, `GET /api/organizations/:organizationId/boards`, `GET /api/boards/:boardId`, `PATCH /api/boards/:boardId`, `DELETE /api/boards/:boardId`, `GET /api/boards/:boardId/full`. All routes enforce that the caller is a member of the owning organization (resolved via `boards.organizationId`). `full` returns nested payload `{ board, sections: [{ section, issues: [{ issue, assignees, comments }] }] }` in one request for the frontend.

## Acceptance criteria

- [ ] `POST /api/organizations/:organizationId/boards { title, description }` creates board, returns 201; 403 if not org member; 400 on invalid
- [ ] `GET /api/organizations/:organizationId/boards` lists boards for org, 403 if not member
- [ ] `GET /api/boards/:boardId` returns board if caller is org member, 404/403 otherwise
- [ ] `PATCH /api/boards/:boardId { title, description }` updates board if member (admin check optional), returns 200
- [ ] `DELETE /api/boards/:boardId` deletes board (cascade sections/issues), 204; admin or member per decision
- [ ] `GET /api/boards/:boardId/full` returns board with sections→issues→assignees→comments nested, respects membership; 404 if board not found
- [ ] Title validation (non-empty) and UUID param validation

## Blocked by

- Blocked by `issues/003-organizations.md`
- Blocked by `issues/004-organization-members.md`

## User stories addressed

- User story 19 (create board)
- User story 20 (list boards)
- User story 21 (get board)
- User story 22 (patch board)
- User story 23 (delete board)
- User story 24 (get board full)
