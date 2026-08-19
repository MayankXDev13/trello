## Parent PRD

`issues/prd.md`

## What to build

Organizations CRUD vertical slice: create, list, fetch, update, delete organizations. Implements `POST /api/organizations`, `GET /api/organizations`, `GET /api/organizations/:organizationId`, `PATCH /api/organizations/:organizationId`, `DELETE /api/organizations/:organizationId`. Creating an organization also creates a `userOrganizations` row with `role = admin` for the creator. List returns only organizations the current user is a member of. Fetch/update/delete enforce membership (and admin for update/delete). Includes Zod validation for `name, description`.

## Acceptance criteria

- [ ] `POST /api/organizations { name, description }` creates org, creates admin membership for caller, returns 201 with org; 400 on invalid; 401 if unauthenticated
- [ ] `GET /api/organizations` returns only orgs where `userOrganizations.userId = caller`, 401 if unauthenticated
- [ ] `GET /api/organizations/:organizationId` returns org if caller is member, 404 if not found, 403 if not a member
- [ ] `PATCH /api/organizations/:organizationId` allows admin to update name/description, returns 200; 403 if member (non-admin); 404/403 if not member
- [ ] `DELETE /api/organizations/:organizationId` allows admin to delete (cascade boards/sections/issues), returns 204; 403 if non-admin
- [ ] UUID param validation returns 400 on malformed ids
- [ ] Membership helper (`requireOrgMember` / `requireOrgAdmin`) is extracted for reuse

## Blocked by

- Blocked by `issues/001-auth.md`
- Blocked by `issues/002-users.md`

## User stories addressed

- User story 10 (create org)
- User story 11 (list orgs)
- User story 12 (get org)
- User story 13 (patch org)
- User story 14 (delete org)
