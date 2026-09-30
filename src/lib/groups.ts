import { prisma } from "@/lib/prisma";
import type { GroupDTO } from "@/lib/types";

const groupInclude = {
  categories: { select: { categoryId: true } },
  members: { select: { userId: true } },
} as const;

type GroupWithRelations = {
  id: string;
  name: string;
  description: string | null;
  allCategories: boolean;
  createdAt: Date;
  categories: { categoryId: string }[];
  members: { userId: string }[];
};

export function toGroupDTO(g: GroupWithRelations): GroupDTO {
  return {
    id: g.id,
    name: g.name,
    description: g.description,
    allCategories: g.allCategories,
    categoryIds: g.categories.map((c) => c.categoryId),
    memberIds: g.members.map((m) => m.userId),
    createdAt: g.createdAt.toISOString(),
  };
}

export async function listGroups(): Promise<GroupDTO[]> {
  const groups = await prisma.group.findMany({ include: groupInclude, orderBy: { name: "asc" } });
  return groups.map(toGroupDTO);
}

export async function getGroup(id: string): Promise<GroupDTO | null> {
  const group = await prisma.group.findUnique({ where: { id }, include: groupInclude });
  return group ? toGroupDTO(group) : null;
}

// Drop IDs that don't exist (e.g. deleted in another tab) instead of failing on a foreign key.
export async function existingCategoryIds(ids: string[]): Promise<string[]> {
  if (ids.length === 0) return [];
  const rows = await prisma.category.findMany({ where: { id: { in: ids } }, select: { id: true } });
  return rows.map((r) => r.id);
}

export async function existingUserIds(ids: string[]): Promise<string[]> {
  if (ids.length === 0) return [];
  const rows = await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true } });
  return rows.map((r) => r.id);
}

export async function existingGroupIds(ids: string[]): Promise<string[]> {
  if (ids.length === 0) return [];
  const rows = await prisma.group.findMany({ where: { id: { in: ids } }, select: { id: true } });
  return rows.map((r) => r.id);
}
