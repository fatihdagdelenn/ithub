import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guardApi } from "@/lib/session";
import { getVisibility, visibleCategoryWhere } from "@/lib/access";

export async function GET() {
  const user = await guardApi();
  if (user instanceof NextResponse) return user;
  const visibility = await getVisibility(user);
  const categories = await prisma.category.findMany({
    where: visibleCategoryWhere(visibility),
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { systems: true } } },
  });
  return NextResponse.json({ categories });
}
