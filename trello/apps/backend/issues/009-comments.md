## Parent PRD

`issues/prd.md`

## What to build

Comments vertical slice: discussion on issues. Implements issue-scoped `GET /api/issues/:issueId/comments`, `POST /api/issues/:issueId/comments` and standalone `GET /api/comments/:commentId`, `PATCH /api/comments/:commentId`, `DELETE /api/comments/:commentId`. Comments are owned by `userId` (author) and linked to `issueId`. List/create require org membership; get requires membership; patch requires author; delete requires author or org admin.

## Acceptance criteria

- [ ] `GET /api/issues/:issueId/comments` returns comments for issue if caller is org member, 404 if issue not found, 403 if not member
- [ ] `POST /api/issues/:issueId/comments { content }` creates comment as caller, returns 201; 400 if content empty; 403 if not org member
- [ ] `GET /api/comments/:commentId` returns single comment if caller is org member, 404 if not found
- [ ] `PATCH /api/comments/:commentId { content }` updates comment if caller is author, returns 200; 403 if not author; 400 if content invalid
- [ ] `DELETE /api/comments/:commentId` deletes comment if caller is author or org admin, returns 204; 403 otherwise; 404 if not found
- [ ] `content` validation (non-empty string) and UUID validation
- [ ] Comments include `userId`, `issueId`, `createdAt`, `updatedAt` and optionally author user object

## Blocked by

- Blocked by `issues/007-issues.md`

## User stories addressed

- User story 39 (list comments)
- User story 40 (add comment)
- User story 41 (get comment)
- User story 42 (update comment)
- User story 43 (delete comment)
