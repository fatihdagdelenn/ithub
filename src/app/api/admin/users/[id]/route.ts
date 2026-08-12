import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { userSchema } from "@/lib/validation";
import { requireUser } from "@/lib/session";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json().catch(() => null);
  const parsed = userSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Geçersiz veri" }, { status: 400 });
  }

  if (parsed.data.role === "USER") {
    const target = await prisma.user.findUnique({ where: { id: params.id } });
    if (target?.role === "ADMIN") {
      const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
      if (adminCount <= 1) {
        return NextResponse.json({ error: "Son admin kullanıcının rolü değiştirilemez" }, { status: 409 });
      }
    }
  }

  try {
    const user = await prisma.user.update({
      where: { id: params.id },
      data: {
        username: parsed.data.username,
        name: parsed.data.name,
        role: parsed.data.role,
        ...(parsed.data.password ? { passwordHash: await bcrypt.hash(parsed.data.password, 10) } : {}),
      },
      select: { id: true, username: true, name: true, role: true, createdAt: true },
    });
    return NextResponse.json({ user });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "Bu kullanıcı adı zaten kullanılıyor" }, { status: 409 });
    }
    throw err;
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const current = await requireUser();
  if (current.id === params.id) {
    return NextResponse.json({ error: "Kendi hesabınızı silemezsiniz" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (target?.role === "ADMIN") {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    if (adminCount <= 1) {
      return NextResponse.json({ error: "Son admin kullanıcı silinemez" }, { status: 409 });
    }
  }

  await prisma.user.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
