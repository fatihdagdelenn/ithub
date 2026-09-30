import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guardApi } from "@/lib/session";
import { getVisibility, visibleTagWhere } from "@/lib/access";

export async function GET() {
  const user = await guardApi();
  if (user instanceof NextResponse) return user;
  const visibility = await getVisibility(user);
  const tags = await prisma.tag.findMany({ where: visibleTagWhere(visibility), orderBy: { name: "asc" } });
  return NextResponse.json({ tags: tags.map((t) => t.name) });
}
