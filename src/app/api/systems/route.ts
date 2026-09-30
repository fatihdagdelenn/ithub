import { NextResponse } from "next/server";
import { guardApi } from "@/lib/session";
import { loadSystemsFor } from "@/lib/systems";

export async function GET() {
  const user = await guardApi();
  if (user instanceof NextResponse) return user;

  const systems = await loadSystemsFor(user);
  return NextResponse.json({ systems });
}
