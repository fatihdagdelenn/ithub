import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { importFileSchema, type importGroupSchema } from "@/lib/validation";
import type { z } from "zod";
import { resolveTagIds } from "@/lib/tags";
import { slugify } from "@/lib/slug";
import { guardApi } from "@/lib/session";
import { setFavorite } from "@/lib/systems";

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

type ImportError = { name: string; error: string };

/**
 * Creates or updates one group from an import file. Categories are matched by name and members by
 * username; the group's category and member lists are replaced by the ones in the file (so
 * importing a backup restores the group exactly). Names that don't exist here are skipped and
 * reported, the rest of the group is still imported.
 */
async function importGroup(
  item: z.infer<typeof importGroupSchema>,
  errors: ImportError[]
): Promise<"created" | "updated"> {
  const label = `Grup: ${item.name}`;

  const categories = item.allCategories
    ? []
    : await prisma.category.findMany({ where: { name: { in: item.categories } }, select: { id: true, name: true } });
  const users = await prisma.user.findMany({
    where: { username: { in: item.members } },
    select: { id: true, username: true },
  });

  const missingCategories = item.allCategories
    ? []
    : item.categories.filter((n) => !categories.some((c) => c.name === n));
  const missingUsers = item.members.filter((n) => !users.some((u) => u.username === n));
  if (missingCategories.length > 0) {
    errors.push({ name: label, error: `Bulunamayan kategoriler atlandı: ${missingCategories.join(", ")}` });
  }
  if (missingUsers.length > 0) {
    errors.push({ name: label, error: `Bulunamayan kullanıcılar atlandı: ${missingUsers.join(", ")}` });
  }

  const data = {
    description: item.description || null,
    allCategories: item.allCategories,
    categories: { create: categories.map((c) => ({ categoryId: c.id })) },
    members: { create: users.map((u) => ({ userId: u.id })) },
  };

  const existing = await prisma.group.findUnique({ where: { name: item.name }, select: { id: true } });
  if (existing) {
    await prisma.group.update({
      where: { id: existing.id },
      data: {
        ...data,
        categories: { deleteMany: {}, ...data.categories },
        members: { deleteMany: {}, ...data.members },
      },
    });
    return "updated";
  }
  await prisma.group.create({ data: { name: item.name, ...data } });
  return "created";
}

export async function POST(request: NextRequest) {
  const auth = await guardApi("ADMIN");
  if (auth instanceof NextResponse) return auth;

  const categoryCache = new Map<string, string>();
  const sortOrderCache = new Map<string, number>();

  const body = await request.json().catch(() => null);
  const parsed = importFileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Geçersiz dosya formatı" }, { status: 400 });
  }

  let created = 0;
  let updated = 0;
  const errors: ImportError[] = [];
  const groupResult = { created: 0, updated: 0 };

  for (const item of parsed.data.systems) {
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
      };

      let systemId: string;

      if (existing) {
        systemId = existing.id;
        await prisma.system.update({
          where: { id: existing.id },
          data: { ...data, tags: { deleteMany: {}, create: tagIds.map((tagId) => ({ tagId })) } },
        });
        updated++;
      } else {
        const sortOrder = await nextSortOrder(categoryId, sortOrderCache);
        const system = await prisma.system.create({
          data: { ...data, sortOrder, tags: { create: tagIds.map((tagId) => ({ tagId })) } },
        });
        systemId = system.id;
        created++;
      }
      // Favorites are per user: an imported `isFavorite: true` stars the system for the importing
      // admin. Import is additive, so `false` never removes an existing favorite.
      if (item.isFavorite) await setFavorite(auth.id, systemId, true);
    } catch (err) {
      errors.push({ name: item.name, error: err instanceof Error ? err.message : "Bilinmeyen hata" });
    }
  }

  // Groups after systems, so categories created by the system import can be granted.
  for (const item of parsed.data.groups) {
    try {
      groupResult[await importGroup(item, errors)]++;
    } catch (err) {
      errors.push({ name: `Grup: ${item.name}`, error: err instanceof Error ? err.message : "Bilinmeyen hata" });
    }
  }

  return NextResponse.json({ created, updated, groups: groupResult, errors });
}
