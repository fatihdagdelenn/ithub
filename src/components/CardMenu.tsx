"use client";

import { useRef, useState } from "react";
import { MoreVertical, Copy, Pencil, Trash2 } from "lucide-react";
import { useClickOutside } from "@/lib/useClickOutside";

export function CardMenu({
  onClone,
  onEdit,
  onDelete,
}: {
  onClone: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useClickOutside(ref, () => setOpen(false));

  function run(action: () => void) {
    setOpen(false);
    action();
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="rounded-md p-1.5 text-slate-400 opacity-0 transition-all hover:bg-slate-900/5 hover:text-slate-700 focus-visible:opacity-100 group-hover:opacity-100 dark:hover:bg-white/[0.06] dark:hover:text-slate-200"
        aria-label="Sistem işlemleri"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreVertical size={16} />
      </button>

      {open && (
        <div
          role="menu"
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 z-30 mt-1 w-40 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-white/10 dark:bg-slate-800"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => run(onClone)}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/5"
          >
            <Copy size={14} /> Kopyala
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => run(onEdit)}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/5"
          >
            <Pencil size={14} /> Düzenle
          </button>
          <div className="my-1 border-t border-slate-100 dark:border-white/10" />
          <button
            type="button"
            role="menuitem"
            onClick={() => run(onDelete)}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
          >
            <Trash2 size={14} /> Sil
          </button>
        </div>
      )}
    </div>
  );
}
