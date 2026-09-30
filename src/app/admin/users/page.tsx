"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Trash2, Plus, ShieldCheck, User as UserIcon, AlertTriangle } from "lucide-react";
import { AdminHeader } from "@/components/AdminHeader";
import { Modal } from "@/components/Modal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import type { GroupDTO, Role, UserDTO } from "@/lib/types";

type UserFormValues = { username: string; name: string; password: string; role: Role; groupIds: string[] };

/** What the user can actually see, derived from their groups (mirrors lib/access.ts). */
function accessSummary(role: Role, groupIds: string[], groups: GroupDTO[]) {
  if (role === "ADMIN") return { kind: "all" as const, label: "Her şeyi görür (Admin)" };
  const mine = groups.filter((g) => groupIds.includes(g.id));
  if (mine.some((g) => g.allCategories)) return { kind: "all" as const, label: "Tüm kategoriler" };
  const count = new Set(mine.flatMap((g) => g.categoryIds)).size;
  if (count === 0) return { kind: "none" as const, label: "Erişimi yok, hiçbir sistem göremez" };
  return { kind: "some" as const, label: `${count} kategori` };
}

function UserForm({
  initial,
  groups,
  onClose,
  onSubmit,
}: {
  initial?: UserDTO;
  groups: GroupDTO[];
  onClose: () => void;
  onSubmit: (values: UserFormValues) => Promise<string | void>;
}) {
  const [username, setUsername] = useState(initial?.username ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>(initial?.role ?? "USER");
  const [groupIds, setGroupIds] = useState<string[]>(initial?.groupIds ?? []);
  const access = accessSummary(role, groupIds, groups);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  return (
    <Modal title={initial ? "Kullanıcıyı Düzenle" : "Yeni Kullanıcı"} onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setSaving(true);
          setError(null);
          const err = await onSubmit({ username, name, password, role, groupIds });
          setSaving(false);
          if (err) setError(err);
        }}
      >
        <div>
          <label className="label">Kullanıcı adı</label>
          <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>
        <div>
          <label className="label">Ad Soyad</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="label">
            Parola {initial && <span className="text-slate-400">(değiştirmek istemiyorsanız boş bırakın)</span>}
          </label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required={!initial}
          />
        </div>
        <div>
          <label className="label">Rol</label>
          <select className="input" value={role} onChange={(e) => setRole(e.target.value as Role)}>
            <option value="USER" className="bg-white text-slate-900">
              Kullanıcı
            </option>
            <option value="ADMIN" className="bg-white text-slate-900">
              Admin
            </option>
          </select>
        </div>
        <div>
          <label className="label">Gruplar</label>
          {groups.length === 0 ? (
            <p className="text-xs text-slate-400">Henüz grup yok. Gruplar sayfasından oluşturabilirsiniz.</p>
          ) : (
            <div className="max-h-44 space-y-0.5 overflow-y-auto rounded-lg border border-slate-200 p-2 dark:border-white/10">
              {groups.map((g) => (
                <label
                  key={g.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-slate-900/[0.03] dark:hover:bg-white/[0.04]"
                >
                  <input
                    type="checkbox"
                    checked={groupIds.includes(g.id)}
                    onChange={() =>
                      setGroupIds((prev) => (prev.includes(g.id) ? prev.filter((id) => id !== g.id) : [...prev, g.id]))
                    }
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  <span className="flex-1 truncate">{g.name}</span>
                  <span className="text-xs text-slate-400">
                    {g.allCategories ? "Tüm kategoriler" : `${g.categoryIds.length} kategori`}
                  </span>
                </label>
              ))}
            </div>
          )}
          <p
            className={`mt-1.5 flex items-center gap-1.5 text-xs ${
              access.kind === "none" ? "text-amber-600 dark:text-amber-400" : "text-slate-500 dark:text-slate-400"
            }`}
          >
            {access.kind === "none" && <AlertTriangle size={13} />}
            Erişim: {access.label}
          </p>
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

export default function UsersAdminPage() {
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [groups, setGroups] = useState<GroupDTO[]>([]);
  const groupById = useMemo(() => new Map(groups.map((g) => [g.id, g])), [groups]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<UserDTO | null>(null);
  const [deleting, setDeleting] = useState<UserDTO | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const [usersRes, groupsRes] = await Promise.all([
      fetch("/api/admin/users").then((r) => r.json()),
      fetch("/api/admin/groups").then((r) => r.json()),
    ]);
    setUsers(usersRes.users ?? []);
    setGroups(groupsRes.groups ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(values: UserFormValues) {
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return data.error ?? "Kullanıcı eklenemedi";
    }
    setShowAdd(false);
    await load();
  }

  async function handleEdit(values: UserFormValues) {
    if (!editing) return;
    const res = await fetch(`/api/admin/users/${editing.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return data.error ?? "Kullanıcı güncellenemedi";
    }
    setEditing(null);
    await load();
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteError(null);
    const res = await fetch(`/api/admin/users/${deleting.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setDeleteError(data.error ?? "Kullanıcı silinemedi");
      return;
    }
    setDeleting(null);
    await load();
  }

  return (
    <div className="min-h-screen">
      <AdminHeader title="Kullanıcı Yönetimi" />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-slate-500 dark:text-slate-400">{users.length} kullanıcı</p>
          <button type="button" className="btn-primary" onClick={() => setShowAdd(true)}>
            <Plus size={16} /> Yeni Kullanıcı
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-slate-400">Yükleniyor...</p>
        ) : (
          <div className="card divide-y divide-slate-100 dark:divide-slate-800">
            {users.map((u) => {
              const access = accessSummary(u.role, u.groupIds, groups);
              return (
                <div key={u.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-500">
                    {u.role === "ADMIN" ? <ShieldCheck size={17} /> : <UserIcon size={17} />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{u.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {u.username} · {u.role === "ADMIN" ? "Admin" : "Kullanıcı"}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      {u.groupIds
                        .map((id) => groupById.get(id))
                        .filter((g): g is GroupDTO => !!g)
                        .map((g) => (
                          <span
                            key={g.id}
                            className="rounded-full bg-slate-900/[0.05] px-2 py-0.5 text-[11px] text-slate-600 dark:bg-white/[0.06] dark:text-slate-300"
                          >
                            {g.name}
                          </span>
                        ))}
                      {u.role !== "ADMIN" && (
                        <span
                          className={`text-[11px] ${
                            access.kind === "none"
                              ? "inline-flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400"
                              : "text-slate-400"
                          }`}
                        >
                          {access.kind === "none" && <AlertTriangle size={11} />}
                          {access.label}
                        </span>
                      )}
                    </div>
                  </div>
                  <button type="button" className="btn-secondary px-2.5" onClick={() => setEditing(u)}>
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    className="btn-danger px-2.5"
                    onClick={() => {
                      setDeleteError(null);
                      setDeleting(u);
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

      {showAdd && <UserForm groups={groups} onClose={() => setShowAdd(false)} onSubmit={handleAdd} />}
      {editing && <UserForm initial={editing} groups={groups} onClose={() => setEditing(null)} onSubmit={handleEdit} />}
      {deleting && (
        <ConfirmDialog
          title="Kullanıcıyı sil"
          message={deleteError ?? `"${deleting.name}" kullanıcısını silmek istediğinize emin misiniz?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
