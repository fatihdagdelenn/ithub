import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const reorderSchema = z.object({ systemIds: z.array(z.string().min(1)).min(1) });

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = reorderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });
  }

  const { systemIds } = parsed.data;
  const systems = await prisma.system.findMany({
    where: { id: { in: systemIds } },
    select: { id: true, categoryId: true },
  });
  if (systems.length !== systemIds.length) {
    return NextResponse.json({ error: "Sistem bulunamadı" }, { status: 404 });
  }
  if (new Set(systems.map((s) => s.categoryId)).size > 1) {
    return NextResponse.json({ error: "Sıralama tek bir kategori içinde yapılmalı" }, { status: 400 });
  }

  await prisma.$transaction(
    systemIds.map((id, index) => prisma.system.update({ where: { id }, data: { sortOrder: index } }))
  );

  return NextResponse.json({ ok: true });
}
