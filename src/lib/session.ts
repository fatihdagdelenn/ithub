import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getIronSession, type IronSession } from "iron-session";
import { prisma } from "@/lib/prisma";
import { sessionOptions, type AppSession, type SessionUser } from "@/lib/sessionConfig";

export { sessionOptions };
export type { AppSession, SessionUser };

export async function getSession(): Promise<IronSession<AppSession>> {
  return getIronSession<AppSession>(cookies(), sessionOptions);
}

/**
 * Returns the logged-in user, re-read from the database on every call.
 *
 * The session cookie only proves *who* the user is. Their role (and whether the account still
 * exists at all) is always taken from the database, so deleting a user or demoting an admin takes
 * effect on their very next request instead of when the 7-day cookie expires.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getSession();
  const sessionUserId = session.user?.id;
  if (!sessionUserId) return null;

  const user = await prisma.user.findUnique({
    where: { id: sessionUserId },
    select: { id: true, username: true, name: true, role: true },
  });
  if (!user) return null;

  return {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role === "ADMIN" ? "ADMIN" : "USER",
  };
}

/**
 * Auth guard for API route handlers. Returns the current user, or a ready-made 401/403 JSON
 * response that the handler should return as-is:
 *
 *   const user = await guardApi("ADMIN");
 *   if (user instanceof NextResponse) return user;
 */
export async function guardApi(role?: "ADMIN"): Promise<SessionUser | NextResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Oturum geçersiz, lütfen tekrar giriş yapın" }, { status: 401 });
  }
  if (role === "ADMIN" && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Bu işlem için yetkiniz yok" }, { status: 403 });
  }
  return user;
}
