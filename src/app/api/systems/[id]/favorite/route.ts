import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guardApi } from "@/lib/session";

export async function PATCH(_request: Request, { params }: { params: { id: string } }) {
  const user = await guardApi();
  if (user instanceof NextResponse) return user;

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
