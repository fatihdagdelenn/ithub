import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const bulkDeleteSchema = z.object({ ids: z.array(z.string().min(1)).min(1).max(500) });

export async function DELETE(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = bulkDeleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  const result = await prisma.system.deleteMany({ where: { id: { in: parsed.data.ids } } });
  return NextResponse.json({ deleted: result.count });
}
