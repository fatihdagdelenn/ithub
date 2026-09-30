import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/session";

/**
 * What a user is allowed to see.
 *
 * - Admins see everything.
 * - Other users see the union of the categories granted by every group they belong to. A group
 *   with `allCategories` grants everything (including categories created later).
 * - A user in no group sees nothing.
 *
 * Every user-facing read (dashboard, /api/systems, /api/categories, /api/tags, favorites) must go
 * through this, so hidden categories never leave the server - hiding them only in the UI would
 * still leak them through the API.
 */
export type Visibility = { all: true } | { all: false; categoryIds: string[] };

export async function getVisibility(user: SessionUser): Promise<Visibility> {
  if (user.role === "ADMIN") return { all: true };

  const groups = await prisma.group.findMany({
    where: { members: { some: { userId: user.id } } },
    select: { allCategories: true, categories: { select: { categoryId: true } } },
  });

  if (groups.some((g) => g.allCategories)) return { all: true };

  const categoryIds = new Set<string>();
  for (const g of groups) for (const c of g.categories) categoryIds.add(c.categoryId);
  return { all: false, categoryIds: Array.from(categoryIds) };
}

export function visibleCategoryWhere(v: Visibility): Prisma.CategoryWhereInput {
  return v.all ? {} : { id: { in: v.categoryIds } };
}

export function visibleSystemWhere(v: Visibility): Prisma.SystemWhereInput {
  return v.all ? {} : { categoryId: { in: v.categoryIds } };
}

/** Only tags that are used by at least one system the user can see. */
export function visibleTagWhere(v: Visibility): Prisma.TagWhereInput {
  return v.all ? {} : { systems: { some: { system: visibleSystemWhere(v) } } };
}

/** True when the user can see nothing at all (no group grants any category). */
export function hasNoAccess(v: Visibility): boolean {
  return !v.all && v.categoryIds.length === 0;
}
