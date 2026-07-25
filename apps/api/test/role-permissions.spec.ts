import { permissionsForRoles } from "../src/modules/iam/role-permissions";

describe("role permission matrix", () => {
  it("grants operational permissions without trusting the role name itself", () => {
    expect(permissionsForRoles([], ["manager"])).toEqual(
      expect.arrayContaining([
        "activities:read",
        "activities:write",
        "fleet:write",
        "evidence:read",
      ]),
    );
    expect(permissionsForRoles([], ["operator"])).not.toContain("fleet:write");
    expect(permissionsForRoles([], ["driver"])).toEqual([
      "mobile:execute",
      "evidence:write",
    ]);
  });

  it("keeps direct permissions and maps admin to wildcard", () => {
    expect(permissionsForRoles(["custom:read"], ["admin", "unknown"])).toEqual([
      "custom:read",
      "*",
    ]);
  });
});
