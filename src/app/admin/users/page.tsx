"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2, Plus, ShieldCheck, User as UserIcon } from "lucide-react";
import { AdminHeader } from "@/components/AdminHeader";
import { Modal } from "@/components/Modal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import type { Role, UserDTO } from "@/lib/types";

function UserForm({
  initial,
  onClose,
  onSubmit,
}: {
  initial?: UserDTO;
  onClose: () => void;
  onSubmit: (values: { username: string; name: string; password: string; role: Role }) => Promise<string | void>;
}) {
  const [username, setUsername] = useState(initial?.username ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>(initial?.role ?? "USER");
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
          const err = await onSubmit({ username, name, password, role });
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
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<UserDTO | null>(null);
  const [deleting, setDeleting] = useState<UserDTO | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    setUsers(data.users ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(values: { username: string; name: string; password: string; role: Role }) {
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

  async function handleEdit(values: { username: string; name: string; password: string; role: Role }) {
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
            {users.map((u) => (
              <div key={u.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-500">
                  {u.role === "ADMIN" ? <ShieldCheck size={17} /> : <UserIcon size={17} />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{u.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {u.username} · {u.role === "ADMIN" ? "Admin" : "Kullanıcı"}
                  </p>
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
            ))}
          </div>
        )}
      </main>

      {showAdd && <UserForm onClose={() => setShowAdd(false)} onSubmit={handleAdd} />}
      {editing && <UserForm initial={editing} onClose={() => setEditing(null)} onSubmit={handleEdit} />}
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
