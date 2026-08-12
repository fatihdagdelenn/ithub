"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2, Plus, Tag as TagIcon } from "lucide-react";
import { AdminHeader } from "@/components/AdminHeader";
import { Modal } from "@/components/Modal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import type { TagDTO } from "@/lib/types";

function TagForm({
  initial,
  onClose,
  onSubmit,
}: {
  initial?: TagDTO;
  onClose: () => void;
  onSubmit: (name: string) => Promise<string | void>;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  return (
    <Modal title={initial ? "Etiketi Düzenle" : "Yeni Etiket"} onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setSaving(true);
          setError(null);
          const err = await onSubmit(name);
          setSaving(false);
          if (err) setError(err);
        }}
      >
        <div>
          <label className="label">Etiket adı</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus required />
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

export default function TagsAdminPage() {
  const [tags, setTags] = useState<TagDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<TagDTO | null>(null);
  const [deleting, setDeleting] = useState<TagDTO | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/tags");
    const data = await res.json();
    setTags(data.tags ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(name: string) {
    const res = await fetch("/api/admin/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return data.error ?? "Etiket eklenemedi";
    }
    setShowAdd(false);
    await load();
  }

  async function handleEdit(name: string) {
    if (!editing) return;
    const res = await fetch(`/api/admin/tags/${editing.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return data.error ?? "Etiket güncellenemedi";
    }
    setEditing(null);
    await load();
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteError(null);
    const res = await fetch(`/api/admin/tags/${deleting.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setDeleteError(data.error ?? "Etiket silinemedi");
      return;
    }
    setDeleting(null);
    await load();
  }

  return (
    <div className="min-h-screen">
      <AdminHeader title="Etiket Yönetimi" />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-slate-500 dark:text-slate-400">{tags.length} etiket</p>
          <button type="button" className="btn-primary" onClick={() => setShowAdd(true)}>
            <Plus size={16} /> Yeni Etiket
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-slate-400">Yükleniyor...</p>
        ) : tags.length === 0 ? (
          <p className="text-sm text-slate-400">Henüz etiket yok.</p>
        ) : (
          <div className="card divide-y divide-slate-100 dark:divide-slate-800">
            {tags.map((t) => (
              <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-500">
                  <TagIcon size={17} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t._count?.systems ?? 0} sistemde kullanılıyor
                  </p>
                </div>
                <button type="button" className="btn-secondary px-2.5" onClick={() => setEditing(t)}>
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  className="btn-danger px-2.5"
                  onClick={() => {
                    setDeleteError(null);
                    setDeleting(t);
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {showAdd && <TagForm onClose={() => setShowAdd(false)} onSubmit={handleAdd} />}
      {editing && <TagForm initial={editing} onClose={() => setEditing(null)} onSubmit={handleEdit} />}
      {deleting && (
        <ConfirmDialog
          title="Etiketi sil"
          message={
            deleteError ??
            `"${deleting.name}" etiketini silmek istediğinize emin misiniz? ${
              deleting._count?.systems ? `Bu etiket ${deleting._count.systems} sistemden de kaldırılacak.` : ""
            }`
          }
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
