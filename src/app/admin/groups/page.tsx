"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Pencil, Plus, Search, ShieldCheck, Trash2, UsersRound } from "lucide-react";
import { AdminHeader } from "@/components/AdminHeader";
import { Modal } from "@/components/Modal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { getIcon } from "@/lib/icons";
import type { CategoryDTO, GroupDTO, UserDTO } from "@/lib/types";

type GroupFormValues = {
  name: string;
  description: string;
  allCategories: boolean;
  categoryIds: string[];
  memberIds: string[];
};

const MAX_CHIPS = 5;

function toggleIn(set: Set<string>, id: string): Set<string> {
  const next = new Set(set);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

function GroupForm({
  initial,
  categories,
  users,
  onClose,
  onSubmit,
}: {
  initial?: GroupDTO;
  categories: CategoryDTO[];
  users: UserDTO[];
  onClose: () => void;
  onSubmit: (values: GroupFormValues) => Promise<string | void>;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [allCategories, setAllCategories] = useState(initial?.allCategories ?? false);
  const [categoryIds, setCategoryIds] = useState<Set<string>>(new Set(initial?.categoryIds ?? []));
  const [memberIds, setMemberIds] = useState<Set<string>>(new Set(initial?.memberIds ?? []));
  const [memberQuery, setMemberQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const visibleUsers = useMemo(() => {
    const q = memberQuery.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q));
  }, [users, memberQuery]);

  const grantsNothing = !allCategories && categoryIds.size === 0;

  return (
    <Modal title={initial ? "Grubu Düzenle" : "Yeni Grup"} onClose={onClose} wide>
      <form
        className="space-y-5"
        onSubmit={async (e) => {
          e.preventDefault();
          setSaving(true);
          setError(null);
          const err = await onSubmit({
            name,
            description,
            allCategories,
            categoryIds: Array.from(categoryIds),
            memberIds: Array.from(memberIds),
          });
          setSaving(false);
          if (err) setError(err);
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Grup adı</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ör. Network Ekibi"
              required
            />
          </div>
          <div>
            <label className="label">
              Açıklama <span className="text-slate-400">(isteğe bağlı)</span>
            </label>
            <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Görebileceği kategoriler</h3>
            {!allCategories && (
              <div className="flex items-center gap-3 text-xs">
                <span className="text-slate-400">
                  {categoryIds.size} / {categories.length} seçili
                </span>
                <button
                  type="button"
                  className="text-brand-600 hover:underline dark:text-brand-400"
                  onClick={() => setCategoryIds(new Set(categories.map((c) => c.id)))}
                >
                  Tümünü seç
                </button>
                <button
                  type="button"
                  className="text-slate-500 hover:underline"
                  onClick={() => setCategoryIds(new Set())}
                >
                  Temizle
                </button>
              </div>
            )}
          </div>

          <label className="mb-3 flex items-start gap-2 rounded-lg border border-slate-200 p-3 text-sm dark:border-white/10">
            <input
              type="checkbox"
              checked={allCategories}
              onChange={(e) => setAllCategories(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300"
            />
            <span>
              <span className="font-medium">Tüm kategoriler</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">
                Sonradan eklenecek kategoriler de otomatik olarak dahil olur.
              </span>
            </span>
          </label>

          {!allCategories && (
            <div className="grid max-h-56 gap-1 overflow-y-auto rounded-lg border border-slate-200 p-2 sm:grid-cols-2 dark:border-white/10">
              {categories.map((c) => {
                const Icon = getIcon(c.icon);
                return (
                  <label
                    key={c.id}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-slate-900/[0.03] dark:hover:bg-white/[0.04]"
                  >
                    <input
                      type="checkbox"
                      checked={categoryIds.has(c.id)}
                      onChange={() => setCategoryIds((prev) => toggleIn(prev, c.id))}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    <Icon size={14} className="text-slate-400" />
                    <span className="flex-1 truncate">{c.name}</span>
                    {c._count && <span className="text-xs text-slate-400">{c._count.systems}</span>}
                  </label>
                );
              })}
              {categories.length === 0 && <p className="px-2 py-1.5 text-sm text-slate-400">Henüz kategori yok.</p>}
            </div>
          )}

          {grantsNothing && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
              <AlertTriangle size={13} /> Kategori seçilmedi: bu grup üyelerine hiçbir sistem göstermez.
            </p>
          )}
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Üyeler</h3>
            <span className="text-xs text-slate-400">{memberIds.size} üye</span>
          </div>
          {users.length > 8 && (
            <div className="relative mb-2">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex w-9 items-center justify-center text-slate-400">
                <Search size={14} />
              </div>
              <input
                className="input pl-9"
                placeholder="Kullanıcı ara..."
                value={memberQuery}
                onChange={(e) => setMemberQuery(e.target.value)}
              />
            </div>
          )}
          <div className="max-h-56 space-y-0.5 overflow-y-auto rounded-lg border border-slate-200 p-2 dark:border-white/10">
            {visibleUsers.map((u) => (
              <label
                key={u.id}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-slate-900/[0.03] dark:hover:bg-white/[0.04]"
              >
                <input
                  type="checkbox"
                  checked={memberIds.has(u.id)}
                  onChange={() => setMemberIds((prev) => toggleIn(prev, u.id))}
                  className="h-4 w-4 rounded border-slate-300"
                />
                <span className="flex-1 truncate">
                  {u.name} <span className="text-xs text-slate-400">{u.username}</span>
                </span>
                {u.role === "ADMIN" && (
                  <span
                    className="text-[11px] text-slate-400"
                    title="Adminler gruplardan bağımsız olarak her şeyi görür"
                  >
                    Admin · her şeyi görür
                  </span>
                )}
              </label>
            ))}
            {visibleUsers.length === 0 && <p className="px-2 py-1.5 text-sm text-slate-400">Kullanıcı bulunamadı.</p>}
          </div>
        </section>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
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

export default function GroupsAdminPage() {
  const [groups, setGroups] = useState<GroupDTO[]>([]);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<GroupDTO | null>(null);
  const [deleting, setDeleting] = useState<GroupDTO | null>(null);

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  async function load() {
    setLoading(true);
    const [g, c, u] = await Promise.all([
      fetch("/api/admin/groups").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/admin/users").then((r) => r.json()),
    ]);
    setGroups(g.groups ?? []);
    setCategories(c.categories ?? []);
    setUsers(u.users ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function save(url: string, method: "POST" | "PUT", values: GroupFormValues) {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return data.error ?? "Grup kaydedilemedi";
    }
    setShowAdd(false);
    setEditing(null);
    await load();
  }

  async function handleDelete() {
    if (!deleting) return;
    await fetch(`/api/admin/groups/${deleting.id}`, { method: "DELETE" });
    setDeleting(null);
    await load();
  }

  return (
    <div className="min-h-screen">
      <AdminHeader title="Grup ve Erişim Yönetimi" />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{groups.length} grup</p>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              Kullanıcılar, üye oldukları grupların kategorilerini görür. Hiçbir grupta olmayan kullanıcı hiçbir şey
              görmez. Adminler her zaman her şeyi görür.
            </p>
          </div>
          <button type="button" className="btn-primary shrink-0" onClick={() => setShowAdd(true)}>
            <Plus size={16} /> Yeni Grup
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-slate-400">Yükleniyor...</p>
        ) : groups.length === 0 ? (
          <div className="card flex flex-col items-center gap-2 px-4 py-12 text-center text-slate-400">
            <UsersRound size={28} />
            <p className="text-sm">Henüz grup yok. Kullanıcılara erişim vermek için bir grup oluşturun.</p>
          </div>
        ) : (
          <div className="card divide-y divide-slate-100 dark:divide-slate-800">
            {groups.map((g) => {
              const cats = g.categoryIds.map((id) => categoryById.get(id)).filter((c): c is CategoryDTO => !!c);
              return (
                <div key={g.id} className="flex items-start gap-3 px-4 py-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-500">
                    <UsersRound size={17} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {g.name} <span className="text-xs font-normal text-slate-400">· {g.memberIds.length} üye</span>
                    </p>
                    {g.description && <p className="text-xs text-slate-500 dark:text-slate-400">{g.description}</p>}
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {g.allCategories ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand-500/10 px-2 py-0.5 text-[11px] font-medium text-brand-700 dark:text-brand-300">
                          <ShieldCheck size={11} /> Tüm kategoriler
                        </span>
                      ) : cats.length === 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-300">
                          <AlertTriangle size={11} /> Kategori yok
                        </span>
                      ) : (
                        <>
                          {cats.slice(0, MAX_CHIPS).map((c) => (
                            <span
                              key={c.id}
                              className="rounded-full bg-slate-900/[0.05] px-2 py-0.5 text-[11px] text-slate-600 dark:bg-white/[0.06] dark:text-slate-300"
                            >
                              {c.name}
                            </span>
                          ))}
                          {cats.length > MAX_CHIPS && (
                            <span
                              className="rounded-full px-2 py-0.5 text-[11px] text-slate-400"
                              title={cats
                                .slice(MAX_CHIPS)
                                .map((c) => c.name)
                                .join(", ")}
                            >
                              +{cats.length - MAX_CHIPS}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-secondary px-2.5"
                    onClick={() => setEditing(g)}
                    aria-label="Düzenle"
                  >
                    <Pencil size={14} />
                  </button>
                  <button type="button" className="btn-danger px-2.5" onClick={() => setDeleting(g)} aria-label="Sil">
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {showAdd && (
        <GroupForm
          categories={categories}
          users={users}
          onClose={() => setShowAdd(false)}
          onSubmit={(v) => save("/api/admin/groups", "POST", v)}
        />
      )}
      {editing && (
        <GroupForm
          initial={editing}
          categories={categories}
          users={users}
          onClose={() => setEditing(null)}
          onSubmit={(v) => save(`/api/admin/groups/${editing.id}`, "PUT", v)}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title="Grubu sil"
          message={`"${deleting.name}" grubunu silmek istediğinize emin misiniz?${
            deleting.memberIds.length > 0
              ? ` ${deleting.memberIds.length} üye bu grubun verdiği erişimi kaybedecek.`
              : ""
          }`}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
