import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

// The middleware only sees the (possibly stale) role stored in the session cookie. This layout
// re-checks the role against the database before any admin page is rendered.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/");
  return <>{children}</>;
}
