import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { tagSchema } from "@/lib/validation";

export async function GET() {
  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { systems: true } } },
  });
  return NextResponse.json({ tags });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = tagSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Geçersiz veri" }, { status: 400 });
  }

  try {
    const tag = await prisma.tag.create({ data: { name: parsed.data.name } });
    return NextResponse.json({ tag }, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "Bu etiket zaten var" }, { status: 409 });
    }
    throw err;
  }
}
