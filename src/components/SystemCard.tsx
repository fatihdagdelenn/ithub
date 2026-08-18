"use client";

import { ExternalLink, Star } from "lucide-react";
import { getSystemIcon } from "@/lib/icons";
import { CardMenu } from "@/components/CardMenu";
import { TAG_PILL_BASE, tagTone } from "@/lib/tagStyle";
import type { SystemDTO } from "@/lib/types";

export function SystemCard({
  system,
  isAdmin,
  onToggleFavorite,
  onEdit,
  onDelete,
  onClone,
  selectMode,
  selected,
  onSelectToggle,
  dragHandle,
}: {
  system: SystemDTO;
  isAdmin: boolean;
  onToggleFavorite: (id: string) => void;
  onEdit?: (system: SystemDTO) => void;
  onDelete?: (system: SystemDTO) => void;
  onClone?: (system: SystemDTO) => void;
  selectMode?: boolean;
  selected?: boolean;
  onSelectToggle?: (id: string) => void;
  dragHandle?: React.ReactNode;
}) {
  const Icon = getSystemIcon(system.type, system.category.icon);

  return (
    <div
      onClick={() => selectMode && onSelectToggle?.(system.id)}
      className={`card group flex h-full flex-col gap-3.5 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-500/25 dark:hover:bg-slate-900/90 ${
        selectMode ? "cursor-pointer" : ""
      } ${selected ? "border-brand-500/50 bg-brand-500/[0.03]" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          {selectMode && (
            <input
              type="checkbox"
              checked={!!selected}
              onChange={() => onSelectToggle?.(system.id)}
              onClick={(e) => e.stopPropagation()}
              className="h-4 w-4 shrink-0 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
          )}
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900/[0.04] text-slate-500 dark:bg-white/[0.06] dark:text-slate-300">
            <Icon size={17} strokeWidth={1.75} />
            <span
              className={`absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-slate-900 ${
                system.isOnline === true
                  ? "bg-emerald-500"
                  : system.isOnline === false
                    ? "bg-red-500"
                    : "bg-slate-300 dark:bg-slate-600"
              }`}
              title={
                system.isOnline === true
                  ? "Çevrimiçi"
                  : system.isOnline === false
                    ? "Çevrimdışı"
                    : "Henüz kontrol edilmedi"
              }
            />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-semibold leading-tight text-slate-900 dark:text-slate-100">{system.name}</h3>
            <p className="truncate text-xs text-slate-500 dark:text-slate-500">{system.category.name}</p>
          </div>
        </div>

        {!selectMode && (
          <div className="flex shrink-0 items-center gap-0.5">
            {dragHandle}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(system.id);
              }}
              className={`rounded-md p-1.5 transition-colors ${
                system.isFavorite
                  ? "text-amber-500"
                  : "text-slate-300 hover:text-amber-500 dark:text-slate-600 dark:hover:text-amber-400"
              }`}
              aria-label={system.isFavorite ? "Favorilerden çıkar" : "Favorilere ekle"}
              title={system.isFavorite ? "Favorilerden çıkar" : "Favorilere ekle"}
            >
              <Star size={16} fill={system.isFavorite ? "currentColor" : "none"} />
            </button>
            {isAdmin && (
              <CardMenu
                onClone={() => onClone?.(system)}
                onEdit={() => onEdit?.(system)}
                onDelete={() => onDelete?.(system)}
              />
            )}
          </div>
        )}
      </div>

      <div className="space-y-0.5 text-xs text-slate-500 dark:text-slate-400">
        <p className="truncate">{system.type}</p>
        {system.host && <p className="truncate font-mono text-slate-400 dark:text-slate-500">{system.host}</p>}
      </div>

      {system.description && (
        <p className="line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{system.description}</p>
      )}

      {system.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {system.tags.map((tag) => (
            <span key={tag} className={`${TAG_PILL_BASE} ${tagTone(tag)}`}>
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto pt-1" onClick={(e) => selectMode && e.stopPropagation()}>
        <a href={system.url} target="_blank" rel="noopener noreferrer" className="btn-soft w-full">
          <ExternalLink size={14} /> Aç
        </a>
      </div>
    </div>
  );
}
