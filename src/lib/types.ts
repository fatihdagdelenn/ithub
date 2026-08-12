export type Role = "ADMIN" | "USER";

export type CategoryDTO = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  sortOrder: number;
  _count?: { systems: number };
};

export type SystemDTO = {
  id: string;
  name: string;
  type: string;
  host: string | null;
  url: string;
  description: string | null;
  isFavorite: boolean;
  category: { id: string; name: string; icon: string };
  tags: string[];
};

export type TagDTO = {
  id: string;
  name: string;
  _count?: { systems: number };
};

export type UserDTO = {
  id: string;
  username: string;
  name: string;
  role: Role;
  createdAt: string;
};
