"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import { AdminHeader } from "@/components/AdminHeader";
import { Modal } from "@/components/Modal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ICON_OPTIONS, getIcon } from "@/lib/icons";
import type { CategoryDTO } from "@/lib/types";

function CategoryForm({
  initial,
  onClose,
  onSubmit,
}: {
  initial?: CategoryDTO;
  onClose: () => void;
  onSubmit: (name: string, icon: string) => Promise<string | void>;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [icon, setIcon] = useState(initial?.icon ?? ICON_OPTIONS[0]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  return (
    <Modal title={initial ? "Kategoriyi Düzenle" : "Yeni Kategori"} onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setSaving(true);
          setError(null);
          const err = await onSubmit(name, icon);
          setSaving(false);
          if (err) setError(err);
        }}
      >
        <div>
          <label className="label">Kategori adı</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="label">İkon</label>
          <div className="grid grid-cols-8 gap-2">
            {ICON_OPTIONS.map((opt) => {
              const Icon = getIcon(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setIcon(opt)}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg border ${
                    icon === opt
                      ? "border-brand-600 bg-brand-50 text-brand-600 dark:bg-brand-500/10"
                      : "border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                  }`}
                >
                  <Icon size={16} />
                </button>
              );
            })}
          </div>
        </div>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            İptal
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function CategoriesAdminPage() {
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<CategoryDTO | null>(null);
  const [deleting, setDeleting] = useState<CategoryDTO | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/categories");
    const data = await res.json();
    setCategories(data.categories ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(name: string, icon: string) {
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, icon }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return data.error ?? "Kategori eklenemedi";
    }
    setShowAdd(false);
    await load();
  }

  async function handleEdit(name: string, icon: string) {
    if (!editing) return;
    const res = await fetch(`/api/admin/categories/${editing.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, icon }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return data.error ?? "Kategori güncellenemedi";
    }
    setEditing(null);
    await load();
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteError(null);
    const res = await fetch(`/api/admin/categories/${deleting.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setDeleteError(data.error ?? "Kategori silinemedi");
      return;
    }
    setDeleting(null);
    await load();
  }

  return (
    <div className="min-h-screen">
      <AdminHeader title="Kategori Yönetimi" />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {categories.length} kategori
          </p>
          <button type="button" className="btn-primary" onClick={() => setShowAdd(true)}>
            <Plus size={16} /> Yeni Kategori
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-slate-400">Yükleniyor...</p>
        ) : (
          <div className="card divide-y divide-slate-100 dark:divide-slate-800">
            {categories.map((c) => {
              const Icon = getIcon(c.icon);
              return (
                <div key={c.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-500">
                    <Icon size={17} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {c._count?.systems ?? 0} sistem
                    </p>
                  </div>
                  <button type="button" className="btn-secondary px-2.5" onClick={() => setEditing(c)}>
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    className="btn-danger px-2.5"
                    onClick={() => {
                      setDeleteError(null);
                      setDeleting(c);
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {showAdd && <CategoryForm onClose={() => setShowAdd(false)} onSubmit={handleAdd} />}
      {editing && <CategoryForm initial={editing} onClose={() => setEditing(null)} onSubmit={handleEdit} />}
      {deleting && (
        <ConfirmDialog
          title="Kategoriyi sil"
          message={deleteError ?? `"${deleting.name}" kategorisini silmek istediğinize emin misiniz?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
