import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guardApi } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await guardApi("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const [systems, favorites] = await Promise.all([
    prisma.system.findMany({
      include: { category: true, tags: { include: { tag: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.userFavorite.findMany({ where: { userId: auth.id }, select: { systemId: true } }),
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

  return NextResponse.json(data);
}
