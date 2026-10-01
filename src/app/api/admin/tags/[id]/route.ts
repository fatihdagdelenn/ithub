import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { tagSchema } from "@/lib/validation";
import { guardApi } from "@/lib/session";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await guardApi("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => null);
  const parsed = tagSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Geçersiz veri" }, { status: 400 });
  }

  try {
    const tag = await prisma.tag.update({
      where: { id: params.id },
      data: { name: parsed.data.name },
    });
    return NextResponse.json({ tag });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "Bu etiket zaten var" }, { status: 409 });
    }
    throw err;
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await guardApi("ADMIN");
  if (auth instanceof NextResponse) return auth;

  await prisma.tag.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
