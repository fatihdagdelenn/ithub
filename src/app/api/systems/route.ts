import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guardApi } from "@/lib/session";

export async function GET() {
  const user = await guardApi();
  if (user instanceof NextResponse) return user;

  const systems = await prisma.system.findMany({
    include: {
      category: true,
      tags: { include: { tag: true } },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  const shaped = systems.map((s) => ({
    id: s.id,
    name: s.name,
    type: s.type,
    host: s.host,
    url: s.url,
    description: s.description,
    isFavorite: s.isFavorite,
    isOnline: s.isOnline,
    lastCheckedAt: s.lastCheckedAt,
    createdAt: s.createdAt,
    category: { id: s.category.id, name: s.category.name, icon: s.category.icon },
    tags: s.tags.map((t) => t.tag.name),
  }));

  return NextResponse.json({ systems: shaped });
}
