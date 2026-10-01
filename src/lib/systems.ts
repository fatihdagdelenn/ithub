import { prisma } from "@/lib/prisma";
import { visibleSystemWhere, type Visibility } from "@/lib/access";
import type { SessionUser } from "@/lib/session";
import type { SystemDTO } from "@/lib/types";

/**
 * Loads the dashboard's system list for one user: only systems in categories the user may see
 * (see lib/access.ts), with `isFavorite` reflecting that user's own favorites. Shared by the
 * dashboard page (initial render) and GET /api/systems (refresh).
 */
export async function loadSystemsFor(user: SessionUser, visibility: Visibility): Promise<SystemDTO[]> {
  const [systems, favorites] = await Promise.all([
    prisma.system.findMany({
      where: visibleSystemWhere(visibility),
      include: { category: true, tags: { include: { tag: true } } },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.userFavorite.findMany({ where: { userId: user.id }, select: { systemId: true } }),
  ]);
  const favoriteIds = new Set(favorites.map((f) => f.systemId));

  return systems.map((s) => ({
    id: s.id,
    name: s.name,
    type: s.type,
    host: s.host,
    url: s.url,
    description: s.description,
    isFavorite: favoriteIds.has(s.id),
    isOnline: s.isOnline,
    lastCheckedAt: s.lastCheckedAt?.toISOString() ?? null,
    category: { id: s.category.id, name: s.category.name, icon: s.category.icon },
    tags: s.tags.map((t) => t.tag.name),
  }));
}

/** Adds or removes a system from one user's favorites. Idempotent in both directions. */
export async function setFavorite(userId: string, systemId: string, favorite: boolean): Promise<void> {
  if (favorite) {
    await prisma.userFavorite.upsert({
      where: { userId_systemId: { userId, systemId } },
      update: {},
      create: { userId, systemId },
    });
  } else {
    await prisma.userFavorite.deleteMany({ where: { userId, systemId } });
  }
}
