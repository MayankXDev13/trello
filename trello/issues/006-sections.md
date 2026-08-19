## Parent PRD

`issues/prd.md`

## What to build

Sections vertical slice: lists/columns within a board. Implements `POST /api/boards/:boardId/sections`, `GET /api/boards/:boardId/sections`, `GET /api/sections/:sectionId`, `PATCH /api/sections/:sectionId`, `DELETE /api/sections/:sectionId`. Authorization resolves `section → board → organization` and checks membership. Create/list are board-scoped; get/patch/delete are section-scoped.

## Acceptance criteria

- [ ] `POST /api/boards/:boardId/sections { title }` creates section, returns 201; 403 if not org member; 404 if board not found
- [ ] `GET /api/boards/:boardId/sections` lists sections for board, 403 if not member
- [ ] `GET /api/sections/:sectionId` returns section if caller is org member, 404/403 otherwise
- [ ] `PATCH /api/sections/:sectionId { title }` updates section, returns 200; 403 if not member
- [ ] `DELETE /api/sections/:sectionId` deletes section (cascade issues), returns 204; 403 if not member
- [ ] Validation: title non-empty, UUID params
- [ ] Ordering: if `position` column is added, maintain order; otherwise creation order is sufficient for MVP

## Blocked by

- Blocked by `issues/005-boards.md`

## User stories addressed

- User story 25 (create section)
- User story 26 (list sections)
- User story 27 (get section)
- User story 28 (patch section)
- User story 29 (delete section)
