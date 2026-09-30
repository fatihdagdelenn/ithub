import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guardApi } from "@/lib/session";

export async function GET() {
  const user = await guardApi();
  if (user instanceof NextResponse) return user;
  const tags = await prisma.tag.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ tags: tags.map((t) => t.name) });
}
