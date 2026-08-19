## Parent PRD

`issues/prd.md`

## What to build

Issues vertical slice: cards/tasks within a section, including move (drag-and-drop). Implements `POST /api/sections/:sectionId/issues`, `GET /api/sections/:sectionId/issues`, `GET /api/issues/:issueId`, `PATCH /api/issues/:issueId`, `DELETE /api/issues/:issueId`, `PATCH /api/issues/:issueId/move`. Move reassigns `sectionId` to `targetSectionId` (validates target section exists and belongs to same board/org). Authorization resolves `issue → section → board → organization`.

## Acceptance criteria

- [ ] `POST /api/sections/:sectionId/issues { title, description }` creates issue, returns 201; 403 if not org member; 400 on missing title
- [ ] `GET /api/sections/:sectionId/issues` lists issues for section, 403 if not member
- [ ] `GET /api/issues/:issueId` returns issue if caller is org member, 404/403 otherwise
- [ ] `PATCH /api/issues/:issueId { title, description }` updates issue, returns 200
- [ ] `DELETE /api/issues/:issueId` deletes issue (cascade comments/assignees), returns 204
- [ ] `PATCH /api/issues/:issueId/move { targetSectionId }` moves issue to another section, validates target exists and is in same board/org, returns 200; 400 if targetSectionId invalid; 404 if issue/target not found; 403 if not member
- [ ] All UUID and body validation with Zod

## Blocked by

- Blocked by `issues/006-sections.md`

## User stories addressed

- User story 30 (create issue)
- User story 31 (list issues)
- User story 32 (get issue)
- User story 33 (patch issue)
- User story 34 (delete issue)
- User story 35 (move issue)
