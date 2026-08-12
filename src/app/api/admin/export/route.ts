import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const systems = await prisma.system.findMany({
    include: { category: true, tags: { include: { tag: true } } },
    orderBy: { name: "asc" },
  });

  const data = systems.map((s) => ({
    name: s.name,
    category: s.category.name,
    type: s.type,
    host: s.host,
    url: s.url,
    description: s.description,
    tags: s.tags.map((t) => t.tag.name),
    isFavorite: s.isFavorite,
  }));

  return NextResponse.json(data);
}
