"use client";

import { useState, type FormEvent } from "react";
import { Modal } from "@/components/Modal";
import { TagPicker } from "@/components/TagPicker";
import type { CategoryDTO } from "@/lib/types";

export type SystemFormValues = {
  name: string;
  categoryId: string;
  type: string;
  host: string;
  url: string;
  description: string;
  tags: string[];
  isFavorite: boolean;
};

export function SystemFormModal({
  categories,
  availableTags,
  initial,
  title,
  onClose,
  onSubmit,
}: {
  categories: CategoryDTO[];
  availableTags: string[];
  initial?: Partial<SystemFormValues>;
  title?: string;
  onClose: () => void;
  onSubmit: (values: SystemFormValues) => Promise<string | void>;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? categories[0]?.id ?? "");
  const [type, setType] = useState(initial?.type ?? "");
  const [host, setHost] = useState(initial?.host ?? "");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [isFavorite, setIsFavorite] = useState(initial?.isFavorite ?? false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const err = await onSubmit({ name, categoryId, type, host, url, description, tags, isFavorite });
      if (err) setError(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={title ?? (initial ? "Sistemi Düzenle" : "Yeni Sistem Ekle")} onClose={onClose} wide>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Sistem adı</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="label">Kategori</label>
            <select
              className="input"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id} className="bg-white text-slate-900">
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Sistem tipi</label>
            <input
              className="input"
              placeholder="örn. VMware vCenter"
              value={type}
              onChange={(e) => setType(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">IP / Hostname</label>
            <input className="input" value={host} onChange={(e) => setHost(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="label">Web URL</label>
          <input
            className="input"
            type="url"
            placeholder="https://..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="label">Açıklama</label>
          <textarea
            className="input"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <label className="label">Etiketler</label>
          <TagPicker value={tags} onChange={setTags} suggestions={availableTags} />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isFavorite}
            onChange={(e) => setIsFavorite(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          Favorilere ekle
        </label>

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
