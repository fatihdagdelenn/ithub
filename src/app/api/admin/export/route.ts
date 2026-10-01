import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guardApi } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await guardApi("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const [systems, favorites, groups] = await Promise.all([
    prisma.system.findMany({
      include: { category: true, tags: { include: { tag: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.userFavorite.findMany({ where: { userId: auth.id }, select: { systemId: true } }),
    prisma.group.findMany({
      include: {
        categories: { select: { category: { select: { name: true } } } },
        members: { select: { user: { select: { username: true } } } },
      },
      orderBy: { name: "asc" },
    }),
  ]);
  // `isFavorite` in the export reflects the exporting admin's own favorites.
  const favoriteIds = new Set(favorites.map((f) => f.systemId));

  const data = systems.map((s) => ({
    name: s.name,
    category: s.category.name,
    type: s.type,
    host: s.host,
    url: s.url,
    description: s.description,
    tags: s.tags.map((t) => t.tag.name),
    isFavorite: favoriteIds.has(s.id),
  }));

  // v2 format: groups reference categories by name and members by username, so the file can be
  // imported into another installation. Passwords are never exported.
  return NextResponse.json({
    format: "ithub-export",
    version: 2,
    exportedAt: new Date().toISOString(),
    systems: data,
    groups: groups.map((g) => ({
      name: g.name,
      description: g.description,
      allCategories: g.allCategories,
      categories: g.categories.map((c) => c.category.name).sort(),
      members: g.members.map((m) => m.user.username).sort(),
    })),
  });
}
