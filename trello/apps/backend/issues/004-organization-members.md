## Parent PRD

`issues/prd.md`

## What to build

Organization members vertical slice: RBAC for organization membership. Implements `GET /api/organizations/:organizationId/members`, `POST /api/organizations/:organizationId/members`, `PATCH /api/organizations/:organizationId/members/:userId`, `DELETE /api/organizations/:organizationId/members/:userId`. Uses `userOrganizations` table with `role` enum `admin|member`. List requires membership; add/update/remove require admin. Handles duplicate membership (409), invalid role (400), and ensures at least one admin remains (optional guard).

## Acceptance criteria

- [ ] `GET /api/organizations/:organizationId/members` returns list of members with user info and role if caller is member, 403 otherwise
- [ ] `POST /api/organizations/:organizationId/members { userId, role }` adds user to org, returns 201; 409 if already member; 404 if user not found; 403 if caller not admin; 400 on invalid role
- [ ] `PATCH /api/organizations/:organizationId/members/:userId { role }` updates role, returns 200; 403 if caller not admin; 404 if membership not found
- [ ] `DELETE /api/organizations/:organizationId/members/:userId` removes membership, returns 204; 403 if caller not admin; 404 if not found
- [ ] Adding a member validates `userId` is UUID and exists in `users`
- [ ] All routes validate `organizationId` and `userId` as UUIDs

## Blocked by

- Blocked by `issues/003-organizations.md`

## User stories addressed

- User story 15 (list members)
- User story 16 (add member)
- User story 17 (update member role)
- User story 18 (remove member)
- User story 47 (org membership isolation)
