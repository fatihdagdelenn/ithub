import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export async function GET() {
  await requireUser();

  const systems = await prisma.system.findMany({
    include: {
      category: true,
      tags: { include: { tag: true } },
    },
    orderBy: { name: "asc" },
  });

  const shaped = systems.map((s) => ({
    id: s.id,
    name: s.name,
    type: s.type,
    host: s.host,
    url: s.url,
    description: s.description,
    isFavorite: s.isFavorite,
    createdAt: s.createdAt,
    category: { id: s.category.id, name: s.category.name, icon: s.category.icon },
    tags: s.tags.map((t) => t.tag.name),
  }));

  return NextResponse.json({ systems: shaped });
}
