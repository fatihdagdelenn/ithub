// Shape shared by the admin user endpoints (list, create, update).
export const userSelect = {
  id: true,
  username: true,
  name: true,
  role: true,
  createdAt: true,
  groups: { select: { groupId: true } },
} as const;

export function toUserDTO(u: {
  id: string;
  username: string;
  name: string;
  role: string;
  createdAt: Date;
  groups: { groupId: string }[];
}) {
  return {
    id: u.id,
    username: u.username,
    name: u.name,
    role: u.role,
    createdAt: u.createdAt,
    groupIds: u.groups.map((g) => g.groupId),
  };
}
