import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { importSchema } from "@/lib/validation";
import { resolveTagIds } from "@/lib/tags";
import { slugify } from "@/lib/slug";

async function nextSortOrder(categoryId: string, cache: Map<string, number>): Promise<number> {
  const cached = cache.get(categoryId);
  if (cached !== undefined) {
    cache.set(categoryId, cached + 1);
    return cached;
  }
  const maxOrder = await prisma.system.aggregate({ where: { categoryId }, _max: { sortOrder: true } });
  const next = (maxOrder._max.sortOrder ?? -1) + 1;
  cache.set(categoryId, next + 1);
  return next;
}

async function resolveCategoryId(name: string, cache: Map<string, string>): Promise<string> {
  const key = name.trim().toLowerCase();
  const cached = cache.get(key);
  if (cached) return cached;

  const existing = await prisma.category.findFirst({ where: { name: name.trim() } });
  if (existing) {
    cache.set(key, existing.id);
    return existing.id;
  }

  const maxOrder = await prisma.category.aggregate({ _max: { sortOrder: true } });
  const created = await prisma.category.create({
    data: {
      name: name.trim(),
      slug: slugify(name),
      icon: "folder",
      sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
    },
  });
  cache.set(key, created.id);
  return created.id;
}

export async function POST(request: NextRequest) {
  const categoryCache = new Map<string, string>();
  const sortOrderCache = new Map<string, number>();

  const body = await request.json().catch(() => null);
  const parsed = importSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Geçersiz dosya formatı" }, { status: 400 });
  }

  let created = 0;
  let updated = 0;
  const errors: { name: string; error: string }[] = [];

  for (const item of parsed.data) {
    try {
      const categoryId = await resolveCategoryId(item.category, categoryCache);
      const tagIds = await resolveTagIds(item.tags);

      const existing = await prisma.system.findFirst({ where: { name: item.name, categoryId } });

      const data = {
        name: item.name,
        categoryId,
        type: item.type,
        host: item.host || null,
        url: item.url,
        description: item.description || null,
        isFavorite: item.isFavorite,
      };

      if (existing) {
        await prisma.system.update({
          where: { id: existing.id },
          data: { ...data, tags: { deleteMany: {}, create: tagIds.map((tagId) => ({ tagId })) } },
        });
        updated++;
      } else {
        const sortOrder = await nextSortOrder(categoryId, sortOrderCache);
        await prisma.system.create({
          data: { ...data, sortOrder, tags: { create: tagIds.map((tagId) => ({ tagId })) } },
        });
        created++;
      }
    } catch (err) {
      errors.push({ name: item.name, error: err instanceof Error ? err.message : "Bilinmeyen hata" });
    }
  }

  return NextResponse.json({ created, updated, errors });
}
