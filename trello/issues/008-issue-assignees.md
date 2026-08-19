## Parent PRD

`issues/prd.md`

## What to build

Issue assignees vertical slice: assigning users to issues (many-to-many via `issueUsers`). Implements `GET /api/issues/:issueId/assignees`, `POST /api/issues/:issueId/assignees`, `DELETE /api/issues/:issueId/assignees/:userId`. Assignee must be a member of the owning organization. Authorization checks org membership via `issue → section → board → organization`.

## Acceptance criteria

- [ ] `GET /api/issues/:issueId/assignees` returns list of assignees (user objects) if caller is org member, 404 if issue not found, 403 if not member
- [ ] `POST /api/issues/:issueId/assignees { userId }` assigns user to issue, returns 201; 409 if already assigned; 404 if user or issue not found; 403 if assignee is not org member or caller not org member; 400 on invalid UUID
- [ ] `DELETE /api/issues/:issueId/assignees/:userId` removes assignee, returns 204; 404 if assignment not found; 403 if caller not org member
- [ ] Unique constraint `issue_user_unique` is handled with 409
- [ ] Validation for UUID params and body

## Blocked by

- Blocked by `issues/007-issues.md`

## User stories addressed

- User story 36 (list assignees)
- User story 37 (assign user)
- User story 38 (remove assignee)
