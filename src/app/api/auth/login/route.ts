import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Kullanıcı adı ve parola gerekli" }, { status: 400 });
  }

  const { username, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    return NextResponse.json({ error: "Geçersiz kullanıcı adı veya parola" }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Geçersiz kullanıcı adı veya parola" }, { status: 401 });
  }

  const session = await getSession();
  session.user = {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role === "ADMIN" ? "ADMIN" : "USER",
  };
  await session.save();

  return NextResponse.json({ user: session.user });
}
