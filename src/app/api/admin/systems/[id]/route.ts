import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { systemSchema } from "@/lib/validation";
import { resolveTagIds } from "@/lib/tags";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json().catch(() => null);
  const parsed = systemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Geçersiz veri" }, { status: 400 });
  }

  const { tags, host, description, ...data } = parsed.data;
  const tagIds = await resolveTagIds(tags);

  const system = await prisma.system.update({
    where: { id: params.id },
    data: {
      ...data,
      host: host || null,
      description: description || null,
      tags: {
        deleteMany: {},
        create: tagIds.map((tagId) => ({ tagId })),
      },
    },
  });

  return NextResponse.json({ system });
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  await prisma.system.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
