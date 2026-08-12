import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { categorySchema } from "@/lib/validation";
import { slugify } from "@/lib/slug";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json().catch(() => null);
  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Geçersiz veri" }, { status: 400 });
  }

  try {
    const category = await prisma.category.update({
      where: { id: params.id },
      data: {
        name: parsed.data.name,
        icon: parsed.data.icon,
        slug: slugify(parsed.data.name),
      },
    });
    return NextResponse.json({ category });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "Bu isimde bir kategori zaten var" }, { status: 409 });
    }
    throw err;
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const systemCount = await prisma.system.count({ where: { categoryId: params.id } });
  if (systemCount > 0) {
    return NextResponse.json(
      { error: "Bu kategoriye bağlı sistemler var. Önce onları taşıyın veya silin." },
      { status: 409 }
    );
  }

  await prisma.category.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
