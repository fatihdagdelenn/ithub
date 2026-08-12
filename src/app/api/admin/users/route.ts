import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { userSchema } from "@/lib/validation";

export async function GET() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, username: true, name: true, role: true, createdAt: true },
  });
  return NextResponse.json({ users });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = userSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Geçersiz veri" }, { status: 400 });
  }
  if (!parsed.data.password) {
    return NextResponse.json({ error: "Parola gerekli" }, { status: 400 });
  }

  try {
    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    const user = await prisma.user.create({
      data: {
        username: parsed.data.username,
        name: parsed.data.name,
        role: parsed.data.role,
        passwordHash,
      },
      select: { id: true, username: true, name: true, role: true, createdAt: true },
    });
    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "Bu kullanıcı adı zaten kullanılıyor" }, { status: 409 });
    }
    throw err;
  }
}
