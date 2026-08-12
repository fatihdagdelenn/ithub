import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { categorySchema } from "@/lib/validation";
import { slugify } from "@/lib/slug";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Geçersiz veri" }, { status: 400 });
  }

  const slug = slugify(parsed.data.name);
  const existing = await prisma.category.findFirst({
    where: { OR: [{ name: parsed.data.name }, { slug }] },
  });
  if (existing) {
    return NextResponse.json({ error: "Bu isimde bir kategori zaten var" }, { status: 409 });
  }

  const maxOrder = await prisma.category.aggregate({ _max: { sortOrder: true } });
  const category = await prisma.category.create({
    data: {
      name: parsed.data.name,
      icon: parsed.data.icon,
      slug,
      sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
    },
  });

  return NextResponse.json({ category }, { status: 201 });
}
