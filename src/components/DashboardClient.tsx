"use client";

import { useMemo, useRef, useState } from "react";
import { Star, SearchX, Search, Plus, Download, Upload, ListChecks, X } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { SystemCard } from "@/components/SystemCard";
import { SystemFormModal, type SystemFormValues } from "@/components/SystemFormModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { getIcon } from "@/lib/icons";
import { TAG_PILL_BASE, tagTone } from "@/lib/tagStyle";
import type { SessionUser } from "@/lib/session";
import type { CategoryDTO, SystemDTO } from "@/lib/types";

type ImportResult = { created: number; updated: number; errors: { name: string; error: string }[] };

async function fetchSystems(): Promise<SystemDTO[]> {
  const res = await fetch("/api/systems");
  const data = await res.json();
  return data.systems ?? [];
}

function toFormValues(s: SystemDTO): SystemFormValues {
  return {
    name: s.name,
    categoryId: s.category.id,
    type: s.type,
    host: s.host ?? "",
    url: s.url,
    description: s.description ?? "",
    tags: s.tags,
    isFavorite: s.isFavorite,
  };
}

export function DashboardClient({
  user,
  initialSystems,
  categories,
  initialTags,
}: {
  user: SessionUser;
  initialSystems: SystemDTO[];
  categories: CategoryDTO[];
  initialTags: string[];
}) {
  const isAdmin = user.role === "ADMIN";
  const [systems, setSystems] = useState(initialSystems);
  const [allTags, setAllTags] = useState(initialTags);
  const [query, setQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSystem, setEditingSystem] = useState<SystemDTO | null>(null);
  const [cloningSystem, setCloningSystem] = useState<SystemDTO | null>(null);
  const [deletingSystem, setDeletingSystem] = useState<SystemDTO | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function refresh() {
    const [sys, tagsRes] = await Promise.all([
      fetchSystems(),
      fetch("/api/tags").then((r) => r.json()),
    ]);
    setSystems(sys);
    setAllTags(tagsRes.tags ?? []);
  }

  async function toggleFavorite(id: string) {
    setSystems((prev) => prev.map((s) => (s.id === id ? { ...s, isFavorite: !s.isFavorite } : s)));
    await fetch(`/api/systems/${id}/favorite`, { method: "PATCH" });
  }

  async function handleAdd(values: SystemFormValues) {
    const res = await fetch("/api/admin/systems", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return data.error ?? "Sistem eklenemedi";
    }
    await refresh();
    setShowAddModal(false);
    setCloningSystem(null);
  }

  async function handleEdit(values: SystemFormValues) {
    if (!editingSystem) return;
    const res = await fetch(`/api/admin/systems/${editingSystem.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return data.error ?? "Sistem güncellenemedi";
    }
    await refresh();
    setEditingSystem(null);
  }

  async function handleDelete() {
    if (!deletingSystem) return;
    await fetch(`/api/admin/systems/${deletingSystem.id}`, { method: "DELETE" });
    setDeletingSystem(null);
    await refresh();
  }

  function toggleSelectMode() {
    setSelectMode((prev) => !prev);
    setSelectedIds(new Set());
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleBulkDelete() {
    await fetch("/api/admin/systems/bulk", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selectedIds) }),
    });
    setConfirmBulkDelete(false);
    setSelectMode(false);
    setSelectedIds(new Set());
    await refresh();
  }

  async function handleExport() {
    const res = await fetch("/api/admin/export");
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ithub-systems-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setImporting(true);
    setImportResult(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const res = await fetch("/api/admin/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      const data = await res.json();
      if (!res.ok) {
        setImportResult({ created: 0, updated: 0, errors: [{ name: file.name, error: data.error ?? "İçe aktarma başarısız" }] });
      } else {
        setImportResult(data);
        await refresh();
      }
    } catch {
      setImportResult({ created: 0, updated: 0, errors: [{ name: file.name, error: "Geçersiz JSON dosyası" }] });
    } finally {
      setImporting(false);
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return systems.filter((s) => {
      const matchesQuery =
        !q ||
        s.name.toLowerCase().includes(q) ||
        (s.host ?? "").toLowerCase().includes(q) ||
        s.category.name.toLowerCase().includes(q) ||
        s.type.toLowerCase().includes(q) ||
        s.tags.some((t) => t.toLowerCase().includes(q));
      const matchesTags = selectedTags.length === 0 || selectedTags.some((t) => s.tags.includes(t));
      return matchesQuery && matchesTags;
    });
  }, [systems, query, selectedTags]);

  const favorites = filtered.filter((s) => s.isFavorite);
  const categoriesWithSystems = categories.filter((c) => systems.some((s) => s.category.id === c.id));
  const groupedByCategory = categoriesWithSystems
    .map((cat) => ({ category: cat, items: filtered.filter((s) => s.category.id === cat.id) }))
    .filter((g) => g.items.length > 0);
  const singleCategoryItems = filtered.filter((s) => s.category.id === categoryFilter);

  function toggleTag(tag: string) {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  return (
    <div className="min-h-screen">
      <Navbar user={user} />

      <main className="mx-auto max-w-7xl px-4 py-8 pb-24">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">System Management</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Infrastructure yönetim arayüzlerine hızlı erişim</p>
        </div>

        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex w-9 items-center justify-center text-slate-400">
              <Search size={16} />
            </div>
            <input
              className="input pl-10"
              placeholder="Sistem, IP, kategori veya etiket ara..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {isAdmin && (
            <div className="flex shrink-0 items-center gap-1.5">
              <button type="button" className="btn-ghost h-9 w-9 p-0" onClick={handleExport} title="Dışa Aktar" aria-label="Dışa Aktar">
                <Download size={16} />
              </button>
              <button
                type="button"
                className="btn-ghost h-9 w-9 p-0"
                onClick={handleImportClick}
                disabled={importing}
                title="İçe Aktar"
                aria-label="İçe Aktar"
              >
                <Upload size={16} />
              </button>
              <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleImportFile} />
              <button
                type="button"
                onClick={toggleSelectMode}
                title="Toplu Seç"
                aria-label="Toplu Seç"
                className={`btn-ghost h-9 w-9 p-0 ${selectMode ? "bg-brand-500/10 text-brand-600 dark:text-brand-400" : ""}`}
              >
                <ListChecks size={16} />
              </button>
              <button type="button" className="btn-primary" onClick={() => setShowAddModal(true)}>
                <Plus size={16} /> <span className="hidden sm:inline">Sistem Ekle</span>
              </button>
            </div>
          )}
        </div>

        {categoriesWithSystems.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setCategoryFilter("all")}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                categoryFilter === "all"
                  ? "bg-brand-600 text-white"
                  : "bg-slate-900/[0.04] text-slate-600 hover:bg-slate-900/[0.08] dark:bg-white/[0.05] dark:text-slate-300 dark:hover:bg-white/[0.09]"
              }`}
            >
              Tümü
            </button>
            {categoriesWithSystems.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryFilter(c.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  categoryFilter === c.id
                    ? "bg-brand-600 text-white"
                    : "bg-slate-900/[0.04] text-slate-600 hover:bg-slate-900/[0.08] dark:bg-white/[0.05] dark:text-slate-300 dark:hover:bg-white/[0.09]"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}

        {allTags.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-1.5">
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`${TAG_PILL_BASE} ${tagTone(tag)} ${
                  selectedTags.includes(tag)
                    ? "ring-1 ring-inset ring-current"
                    : "opacity-50 hover:opacity-100"
                }`}
              >
                #{tag}
              </button>
            ))}
            {selectedTags.length > 0 && (
              <button type="button" className="text-[11px] text-slate-400 underline" onClick={() => setSelectedTags([])}>
                Temizle
              </button>
            )}
          </div>
        )}

        {importResult && (
          <div className="mb-6 rounded-xl border border-slate-200/70 bg-white p-4 dark:border-white/[0.06] dark:bg-slate-900/60">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm text-slate-700 dark:text-slate-300">
                İçe aktarma tamamlandı: <span className="font-semibold text-brand-600 dark:text-brand-400">{importResult.created}</span>{" "}
                yeni, <span className="font-semibold text-brand-600 dark:text-brand-400">{importResult.updated}</span> güncellendi
                {importResult.errors.length > 0 && (
                  <span className="text-red-600 dark:text-red-400"> · {importResult.errors.length} hata</span>
                )}
              </p>
              <button type="button" className="btn-ghost h-7 w-7 p-0" onClick={() => setImportResult(null)} aria-label="Kapat">
                <X size={15} />
              </button>
            </div>
            {importResult.errors.length > 0 && (
              <ul className="mt-2 space-y-0.5 text-xs text-red-600 dark:text-red-400">
                {importResult.errors.map((e, i) => (
                  <li key={i}>
                    {e.name}: {e.error}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {favorites.length > 0 && categoryFilter === "all" && (
          <div className="mb-8">
            <h2 className="mb-3 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
              <Star size={12} className="fill-amber-500 text-amber-500" /> Favoriler
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {favorites.map((s) => (
                <SystemCard
                  key={s.id}
                  system={s}
                  isAdmin={isAdmin}
                  onToggleFavorite={toggleFavorite}
                  onEdit={setEditingSystem}
                  onDelete={setDeletingSystem}
                  onClone={setCloningSystem}
                  selectMode={selectMode}
                  selected={selectedIds.has(s.id)}
                  onSelectToggle={toggleSelect}
                />
              ))}
            </div>
          </div>
        )}

        {categoryFilter === "all" ? (
          groupedByCategory.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-24 text-slate-400 dark:text-slate-600">
              <SearchX size={28} />
              <p className="text-sm">Sonuç bulunamadı</p>
            </div>
          ) : (
            groupedByCategory.map(({ category, items }) => {
              const Icon = getIcon(category.icon);
              return (
                <div key={category.id} className="mb-8">
                  <h2 className="mb-3 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    <Icon size={12} /> {category.name}
                    <span className="normal-case text-slate-300 dark:text-slate-600">· {items.length}</span>
                  </h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {items.map((s) => (
                      <SystemCard
                        key={s.id}
                        system={s}
                        isAdmin={isAdmin}
                        onToggleFavorite={toggleFavorite}
                        onEdit={setEditingSystem}
                        onDelete={setDeletingSystem}
                        onClone={setCloningSystem}
                        selectMode={selectMode}
                        selected={selectedIds.has(s.id)}
                        onSelectToggle={toggleSelect}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          )
        ) : singleCategoryItems.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-24 text-slate-400 dark:text-slate-600">
            <SearchX size={28} />
            <p className="text-sm">Sonuç bulunamadı</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {singleCategoryItems.map((s) => (
              <SystemCard
                key={s.id}
                system={s}
                isAdmin={isAdmin}
                onToggleFavorite={toggleFavorite}
                onEdit={setEditingSystem}
                onDelete={setDeletingSystem}
                onClone={setCloningSystem}
                selectMode={selectMode}
                selected={selectedIds.has(s.id)}
                onSelectToggle={toggleSelect}
              />
            ))}
          </div>
        )}
      </main>

      {showAddModal && (
        <SystemFormModal
          categories={categories}
          availableTags={allTags}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAdd}
        />
      )}
      {editingSystem && (
        <SystemFormModal
          categories={categories}
          availableTags={allTags}
          initial={toFormValues(editingSystem)}
          title="Sistemi Düzenle"
          onClose={() => setEditingSystem(null)}
          onSubmit={handleEdit}
        />
      )}
      {cloningSystem && (
        <SystemFormModal
          categories={categories}
          availableTags={allTags}
          initial={{ ...toFormValues(cloningSystem), name: `${cloningSystem.name} (Kopya)`, isFavorite: false }}
          title="Sistemi Kopyala"
          onClose={() => setCloningSystem(null)}
          onSubmit={handleAdd}
        />
      )}
      {deletingSystem && (
        <ConfirmDialog
          title="Sistemi sil"
          message={`"${deletingSystem.name}" sistemini silmek istediğinize emin misiniz?`}
          onConfirm={handleDelete}
          onCancel={() => setDeletingSystem(null)}
        />
      )}
      {confirmBulkDelete && (
        <ConfirmDialog
          title="Seçilen sistemleri sil"
          message={`${selectedIds.size} sistemi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
          onConfirm={handleBulkDelete}
          onCancel={() => setConfirmBulkDelete(false)}
        />
      )}

      {selectMode && selectedIds.size > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/70 bg-white/95 backdrop-blur dark:border-white/[0.06] dark:bg-slate-950/95">
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{selectedIds.size} sistem seçildi</span>
            <div className="ml-auto flex items-center gap-2">
              <button type="button" className="btn-secondary" onClick={() => setSelectedIds(new Set())}>
                Seçimi Temizle
              </button>
              <button type="button" className="btn-danger" onClick={() => setConfirmBulkDelete(true)}>
                Seçilenleri Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
