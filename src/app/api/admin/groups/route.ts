import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { groupSchema } from "@/lib/validation";
import { guardApi } from "@/lib/session";
import { existingCategoryIds, existingUserIds, getGroup, listGroups } from "@/lib/groups";

export async function GET() {
  const auth = await guardApi("ADMIN");
  if (auth instanceof NextResponse) return auth;

  return NextResponse.json({ groups: await listGroups() });
}

export async function POST(request: NextRequest) {
  const auth = await guardApi("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => null);
  const parsed = groupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Geçersiz veri" }, { status: 400 });
  }
  const { name, description, allCategories } = parsed.data;
  if (await prisma.group.findUnique({ where: { name }, select: { id: true } })) {
    return NextResponse.json({ error: "Bu isimde bir grup zaten var" }, { status: 409 });
  }
  // With "all categories" on, an explicit category list is meaningless - don't store one.
  const categoryIds = allCategories ? [] : await existingCategoryIds(parsed.data.categoryIds);
  const memberIds = await existingUserIds(parsed.data.memberIds);

  try {
    const group = await prisma.group.create({
      data: {
        name,
        description: description || null,
        allCategories,
        categories: { create: categoryIds.map((categoryId) => ({ categoryId })) },
        members: { create: memberIds.map((userId) => ({ userId })) },
      },
    });
    return NextResponse.json({ group: await getGroup(group.id) }, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "Bu isimde bir grup zaten var" }, { status: 409 });
    }
    throw err;
  }
}
