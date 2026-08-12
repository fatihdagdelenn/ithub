"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import Link from "next/link";
import { LogOut, LayoutGrid, Tag as TagIcon, Users, ServerCog, ChevronDown } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useClickOutside } from "@/lib/useClickOutside";
import type { SessionUser } from "@/lib/session";

export function Navbar({ user }: { user: SessionUser }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useClickOutside(menuRef, () => setMenuOpen(false));

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur dark:border-white/[0.06] dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold text-slate-900 dark:text-slate-100">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-white">
            <ServerCog size={15} />
          </span>
          <span className="hidden sm:inline">IT System Hub</span>
        </Link>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <ThemeToggle />

          <div ref={menuRef} className="relative">
            <button type="button" onClick={() => setMenuOpen((v) => !v)} className="btn-secondary">
              {user.name} <ChevronDown size={14} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-white/10 dark:bg-slate-900">
                <div className="border-b border-slate-100 px-3 py-2 text-xs text-slate-500 dark:border-white/10 dark:text-slate-400">
                  {user.username} · {user.role === "ADMIN" ? "Admin" : "Kullanıcı"}
                </div>
                {user.role === "ADMIN" && (
                  <>
                    <Link
                      href="/admin/categories"
                      className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/5"
                      onClick={() => setMenuOpen(false)}
                    >
                      <LayoutGrid size={14} /> Kategori Yönetimi
                    </Link>
                    <Link
                      href="/admin/tags"
                      className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/5"
                      onClick={() => setMenuOpen(false)}
                    >
                      <TagIcon size={14} /> Etiket Yönetimi
                    </Link>
                    <Link
                      href="/admin/users"
                      className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/5"
                      onClick={() => setMenuOpen(false)}
                    >
                      <Users size={14} /> Kullanıcı Yönetimi
                    </Link>
                  </>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-slate-50 dark:text-red-400 dark:hover:bg-white/5"
                >
                  <LogOut size={14} /> Çıkış yap
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
