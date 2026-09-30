import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { groupSchema } from "@/lib/validation";
import { guardApi } from "@/lib/session";
import { existingCategoryIds, existingUserIds, getGroup } from "@/lib/groups";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await guardApi("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => null);
  const parsed = groupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Geçersiz veri" }, { status: 400 });
  }
  const existing = await prisma.group.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!existing) {
    return NextResponse.json({ error: "Grup bulunamadı" }, { status: 404 });
  }

  const { name, description, allCategories } = parsed.data;
  const clash = await prisma.group.findFirst({ where: { name, NOT: { id: params.id } }, select: { id: true } });
  if (clash) {
    return NextResponse.json({ error: "Bu isimde bir grup zaten var" }, { status: 409 });
  }
  const categoryIds = allCategories ? [] : await existingCategoryIds(parsed.data.categoryIds);
  const memberIds = await existingUserIds(parsed.data.memberIds);

  try {
    // Replace the category and member lists wholesale; the form always sends the full lists.
    await prisma.group.update({
      where: { id: params.id },
      data: {
        name,
        description: description || null,
        allCategories,
        categories: { deleteMany: {}, create: categoryIds.map((categoryId) => ({ categoryId })) },
        members: { deleteMany: {}, create: memberIds.map((userId) => ({ userId })) },
      },
    });
    return NextResponse.json({ group: await getGroup(params.id) });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "Bu isimde bir grup zaten var" }, { status: 409 });
    }
    throw err;
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await guardApi("ADMIN");
  if (auth instanceof NextResponse) return auth;

  // Memberships and category grants are removed by ON DELETE CASCADE.
  await prisma.group.deleteMany({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
