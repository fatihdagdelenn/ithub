"use client";

import Link from "next/link";
import { ArrowLeft, LayoutGrid, Tag, Users } from "lucide-react";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";

export function AdminHeader({ title }: { title: string }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
        <Link href="/" className="btn-ghost px-2">
          <ArrowLeft size={16} /> Panel
        </Link>
        <h1 className="flex-1 text-sm font-semibold">{title}</h1>
        <nav className="flex items-center gap-1">
          <Link
            href="/admin/categories"
            className={`btn-ghost px-3 ${pathname === "/admin/categories" ? "bg-slate-100 dark:bg-slate-800" : ""}`}
          >
            <LayoutGrid size={15} /> Kategoriler
          </Link>
          <Link
            href="/admin/tags"
            className={`btn-ghost px-3 ${pathname === "/admin/tags" ? "bg-slate-100 dark:bg-slate-800" : ""}`}
          >
            <Tag size={15} /> Etiketler
          </Link>
          <Link
            href="/admin/users"
            className={`btn-ghost px-3 ${pathname === "/admin/users" ? "bg-slate-100 dark:bg-slate-800" : ""}`}
          >
            <Users size={15} /> Kullanıcılar
          </Link>
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}
