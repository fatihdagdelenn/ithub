import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { DashboardClient } from "@/components/DashboardClient";
import { loadSystemsFor } from "@/lib/systems";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  // Account deleted while the session cookie was still valid: send them back to the login page.
  if (!user) redirect("/login");

  const [initialSystems, categories, tags] = await Promise.all([
    loadSystemsFor(user),
    prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { _count: { select: { systems: true } } },
    }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <DashboardClient
      user={user}
      initialSystems={initialSystems}
      categories={categories}
      initialTags={tags.map((t) => t.name)}
    />
  );
}
