import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guardApi } from "@/lib/session";
import { setFavorite } from "@/lib/systems";
import { getVisibility, visibleSystemWhere } from "@/lib/access";

// Toggles the system in the *current user's* favorites only.
export async function PATCH(_request: Request, { params }: { params: { id: string } }) {
  const user = await guardApi();
  if (user instanceof NextResponse) return user;

  // A system in a category the user can't see is reported as "not found", not "forbidden", so its
  // existence isn't revealed.
  const visibility = await getVisibility(user);
  const system = await prisma.system.findFirst({
    where: { id: params.id, ...visibleSystemWhere(visibility) },
    select: { id: true },
  });
  if (!system) {
    return NextResponse.json({ error: "Sistem bulunamadı" }, { status: 404 });
  }

  const existing = await prisma.userFavorite.findUnique({
    where: { userId_systemId: { userId: user.id, systemId: system.id } },
  });
  const isFavorite = !existing;
  await setFavorite(user.id, system.id, isFavorite);

  return NextResponse.json({ isFavorite });
}
