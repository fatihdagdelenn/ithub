import { NextResponse } from "next/server";
import { guardApi } from "@/lib/session";
import { loadSystemsFor } from "@/lib/systems";
import { getVisibility } from "@/lib/access";

export async function GET() {
  const user = await guardApi();
  if (user instanceof NextResponse) return user;

  const systems = await loadSystemsFor(user, await getVisibility(user));
  return NextResponse.json({ systems });
}
