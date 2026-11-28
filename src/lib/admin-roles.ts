export type AdminRole = "owner" | "manager" | "staff";

export type AdminPermission =
  | "overview"
  | "orders"
  | "rates"
  | "catalog"
  | "coupons"
  | "customers"
  | "analytics"
  | "visitors"
  | "search"
  | "settings"
  | "team";

export interface AdminUserView {
  id: number | null;
  name: string;
  email: string;
  role: AdminRole;
}

export const ADMIN_ROLES: { role: AdminRole; label: string; summary: string }[] = [
  {
    role: "owner",
    label: "Owner",
    summary:
      "Full store control: team access, store settings, revenue analytics, Search Console, catalog, orders, and daily rates.",
  },
  {
    role: "manager",
    label: "Manager",
    summary: "Store operations: orders, daily rates, products, categories, coupons, and customer directory.",
  },
  {
    role: "staff",
    label: "Staff",
    summary: "Dispatch & pricing desk: home overview, order dispatch & slips, and daily rates.",
  },
];

const STAFF_PERMS: AdminPermission[] = ["overview", "orders", "rates"];
const MANAGER_PERMS: AdminPermission[] = [...STAFF_PERMS, "catalog", "coupons", "customers"];
const OWNER_PERMS: AdminPermission[] = [...MANAGER_PERMS, "analytics", "visitors", "search", "settings", "team"];

export const ROLE_PERMISSIONS: Record<AdminRole, ReadonlySet<AdminPermission>> = {
  staff: new Set(STAFF_PERMS),
  manager: new Set(MANAGER_PERMS),
  owner: new Set(OWNER_PERMS),
};

export function isAdminRole(val: unknown): val is AdminRole {
  return val === "owner" || val === "manager" || val === "staff";
}

export function roleLabel(role: AdminRole): string {
  return ADMIN_ROLES.find((r) => r.role === role)?.label ?? role;
}

export function hasAdminPermission(role: AdminRole | undefined | null, permission: AdminPermission): boolean {
  if (!role || !isAdminRole(role)) return false;
  return ROLE_PERMISSIONS[role].has(permission);
}

export function requiredPermissionForAdminPath(pathname: string): AdminPermission {
  if (pathname.startsWith("/admin/orders")) return "orders";
  if (pathname.startsWith("/admin/rates")) return "rates";
  if (pathname.startsWith("/admin/products") || pathname.startsWith("/admin/categories")) return "catalog";
  if (pathname.startsWith("/admin/coupons")) return "coupons";
  if (pathname.startsWith("/admin/customers")) return "customers";
  if (pathname.startsWith("/admin/analytics")) return "analytics";
  if (pathname.startsWith("/admin/visitors")) return "visitors";
  if (pathname.startsWith("/admin/search")) return "search";
  if (pathname.startsWith("/admin/settings")) return "settings";
  if (pathname.startsWith("/admin/team")) return "team";
  return "overview";
}
