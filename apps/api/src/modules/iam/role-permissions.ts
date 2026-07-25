const rolePermissions: Record<string, readonly string[]> = {
  admin: ["*"],
  manager: [
    "activities:read",
    "activities:write",
    "fleet:read",
    "fleet:write",
    "evidence:read",
    "evidence:write",
  ],
  operator: [
    "activities:read",
    "activities:write",
    "fleet:read",
    "evidence:read",
  ],
  driver: ["mobile:execute", "evidence:write"],
};

export function permissionsForRoles(
  direct: readonly string[],
  roles: readonly string[],
): string[] {
  return [
    ...new Set([
      ...direct,
      ...roles.flatMap((role) => rolePermissions[role] ?? []),
    ]),
  ];
}
