import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export async function PATCH(_request: Request, { params }: { params: { id: string } }) {
  await requireUser();

  const existing = await prisma.system.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Sistem bulunamadı" }, { status: 404 });
  }

  const system = await prisma.system.update({
    where: { id: params.id },
    data: { isFavorite: !existing.isFavorite },
  });

  return NextResponse.json({ system });
}
