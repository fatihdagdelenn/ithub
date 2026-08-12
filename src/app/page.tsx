import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { DashboardClient } from "@/components/DashboardClient";
import type { SystemDTO } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [systems, categories, tags] = await Promise.all([
    prisma.system.findMany({
      include: { category: true, tags: { include: { tag: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { _count: { select: { systems: true } } },
    }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);

  const initialSystems: SystemDTO[] = systems.map((s) => ({
    id: s.id,
    name: s.name,
    type: s.type,
    host: s.host,
    url: s.url,
    description: s.description,
    isFavorite: s.isFavorite,
    category: { id: s.category.id, name: s.category.name, icon: s.category.icon },
    tags: s.tags.map((t) => t.tag.name),
  }));

  return (
    <DashboardClient
      user={user}
      initialSystems={initialSystems}
      categories={categories}
      initialTags={tags.map((t) => t.name)}
    />
  );
}
