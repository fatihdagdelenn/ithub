import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guardApi } from "@/lib/session";

export async function GET() {
  const user = await guardApi();
  if (user instanceof NextResponse) return user;
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { systems: true } } },
  });
  return NextResponse.json({ categories });
}
