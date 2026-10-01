import { z } from "zod";
import { ICON_OPTIONS } from "@/lib/icons";

export const systemSchema = z.object({
  name: z.string().min(1, "Sistem adı gerekli").max(120),
  categoryId: z.string().min(1, "Kategori seçin"),
  type: z.string().min(1, "Sistem tipi gerekli").max(80),
  host: z.string().max(255).optional().or(z.literal("")),
  url: z.string().url("Geçerli bir URL girin").max(500),
  description: z.string().max(1000).optional().or(z.literal("")),
  tags: z.array(z.string().min(1).max(40)).max(20).default([]),
  isFavorite: z.boolean().default(false),
});

export const categorySchema = z.object({
  name: z.string().min(1, "Kategori adı gerekli").max(60),
  icon: z.enum(ICON_OPTIONS as [string, ...string[]]).default("folder"),
});

export const importItemSchema = z.object({
  name: z.string().min(1, "Sistem adı gerekli").max(120),
  category: z.string().min(1, "Kategori gerekli").max(60),
  type: z.string().min(1, "Sistem tipi gerekli").max(80),
  host: z.string().max(255).nullable().optional(),
  url: z.string().url("Geçerli bir URL girin").max(500),
  description: z.string().max(1000).nullable().optional(),
  tags: z.array(z.string().min(1).max(40)).max(20).default([]),
  isFavorite: z.boolean().default(false),
});

export const importSchema = z.array(importItemSchema).min(1, "En az bir sistem gerekli").max(1000);

export const importGroupSchema = z.object({
  name: z.string().trim().min(1, "Grup adı gerekli").max(60),
  description: z.string().trim().max(300).nullable().optional(),
  allCategories: z.boolean().default(false),
  categories: z.array(z.string().min(1).max(60)).max(1000).default([]), // category names
  members: z.array(z.string().min(1).max(60)).max(10000).default([]), // usernames
});

// Accepts both export formats: v1 (a plain array of systems) and v2 ({ systems, groups }).
export const importFileSchema = z.union([
  importSchema.transform((systems) => ({ systems, groups: [] as z.infer<typeof importGroupSchema>[] })),
  z
    .object({
      systems: z.array(importItemSchema).max(1000).default([]),
      groups: z.array(importGroupSchema).max(500).default([]),
    })
    .refine((d) => d.systems.length > 0 || d.groups.length > 0, "Dosyada sistem veya grup yok"),
]);

export const tagSchema = z.object({
  name: z.string().trim().min(1, "Etiket adı gerekli").max(40),
});

export const userSchema = z.object({
  username: z.string().min(3, "En az 3 karakter").max(60),
  name: z.string().min(1, "Ad Soyad gerekli").max(120),
  password: z.string().min(6, "En az 6 karakter").optional().or(z.literal("")),
  role: z.enum(["ADMIN", "USER"]),
  // Omitted = leave the user's group memberships untouched.
  groupIds: z.array(z.string().min(1)).max(500).optional(),
});

export const groupSchema = z.object({
  name: z.string().trim().min(1, "Grup adı gerekli").max(60),
  description: z.string().trim().max(300).optional().or(z.literal("")),
  allCategories: z.boolean().default(false),
  categoryIds: z.array(z.string().min(1)).max(1000).default([]),
  memberIds: z.array(z.string().min(1)).max(10000).default([]),
});
