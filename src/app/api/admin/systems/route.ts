import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { systemSchema } from "@/lib/validation";
import { resolveTagIds } from "@/lib/tags";
import { guardApi } from "@/lib/session";
import { setFavorite } from "@/lib/systems";

export async function POST(request: NextRequest) {
  const auth = await guardApi("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => null);
  const parsed = systemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Geçersiz veri" }, { status: 400 });
  }

  const { tags, host, description, isFavorite, ...data } = parsed.data;
  const tagIds = await resolveTagIds(tags);
  const maxOrder = await prisma.system.aggregate({
    where: { categoryId: data.categoryId },
    _max: { sortOrder: true },
  });

  const system = await prisma.system.create({
    data: {
      ...data,
      host: host || null,
      description: description || null,
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
      tags: { create: tagIds.map((tagId) => ({ tagId })) },
    },
  });
  // "Favorilere ekle" in the form means the admin's own favorites (favorites are per user).
  if (isFavorite) await setFavorite(auth.id, system.id, true);

  return NextResponse.json({ system }, { status: 201 });
}
