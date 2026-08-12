import { prisma } from "@/lib/prisma";

export function normalizeTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of tags) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }
  return result;
}

export async function resolveTagIds(tagNames: string[]): Promise<string[]> {
  const names = normalizeTags(tagNames);
  const ids: string[] = [];
  for (const name of names) {
    const tag = await prisma.tag.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    ids.push(tag.id);
  }
  return ids;
}
