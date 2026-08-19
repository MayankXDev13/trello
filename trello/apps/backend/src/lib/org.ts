import { db, eq, and, userOrganizations, boards, sections, issues } from "@repo/db";

export const isOrgMember = async (userId: string, organizationId: string) => {
  const [row] = await db
    .select()
    .from(userOrganizations)
    .where(and(eq(userOrganizations.userId, userId), eq(userOrganizations.organizationId, organizationId)));
  return row ?? null;
};

export const isOrgAdmin = async (userId: string, organizationId: string) => {
  const row = await isOrgMember(userId, organizationId);
  return row?.role === "admin";
};

export const getOrganizationIdByBoard = async (boardId: string): Promise<string | null> => {
  const [board] = await db.select().from(boards).where(eq(boards.id, boardId));
  return board?.organizationId ?? null;
};

export const getOrganizationIdBySection = async (sectionId: string): Promise<string | null> => {
  const [section] = await db.select().from(sections).where(eq(sections.id, sectionId));
  if (!section) return null;
  return getOrganizationIdByBoard(section.boardId);
};

export const getOrganizationIdByIssue = async (issueId: string): Promise<string | null> => {
  const [issue] = await db.select().from(issues).where(eq(issues.id, issueId));
  if (!issue) return null;
  return getOrganizationIdBySection(issue.sectionId);
};
