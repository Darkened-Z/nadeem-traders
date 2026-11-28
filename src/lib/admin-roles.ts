export type AdminRole = "owner" | "manager" | "staff";

export type AdminPermission =
  | "overview"
  | "orders"
  | "rates"
  | "catalog"
  | "coupons"
  | "customers"
  | "analytics"
  | "google_analytics"
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

export interface TeamMember {
  id: number;
  email: string;
  name: string;
  role: AdminRole;
  active: boolean;
  last_login_at: string | Date | null;
  created_at: string | Date;
}

export interface AuditLogEntry {
  id: number;
  actor_email: string;
  actor_role: string;
  action: string;
  target: string | null;
  created_at: string | Date;
}

export const ADMIN_ROLES: { role: AdminRole; label: string; summary: string }[] = [
  {
    role: "owner",
    label: "Owner",
    summary:
      "Full store and team control, including managing and deleting Owner accounts and signing out all admin sessions.",
  },
  {
    role: "manager",
    label: "Manager",
    summary:
      "Full store management: analytics, Search Console, settings, catalog, orders, daily rates, and staff/manager team accounts (cannot modify or delete Owner accounts).",
  },
  {
    role: "staff",
    label: "Staff",
    summary: "Dispatch & pricing desk: home overview, order dispatch & slips, and daily rates.",
  },
];

const STAFF_PERMS: AdminPermission[] = ["overview", "orders", "rates"];
const MANAGER_PERMS: AdminPermission[] = [
  ...STAFF_PERMS,
  "catalog",
  "coupons",
  "customers",
  "analytics",
  "google_analytics",
  "visitors",
  "search",
  "settings",
  "team",
];
const OWNER_PERMS: AdminPermission[] = [...MANAGER_PERMS];

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

/** Whether `actorRole` may edit, suspend, reset, sign out, or delete a member with `targetRole`. */
export function canManageTeamRole(actorRole: AdminRole | undefined | null, targetRole: AdminRole): boolean {
  if (!actorRole || !isAdminRole(actorRole)) return false;
  if (actorRole === "owner") return true;
  return actorRole === "manager" && targetRole !== "owner";
}

/** Roles an actor with `actorRole` may assign when creating or updating team members. */
export function assignableAdminRoles(actorRole: AdminRole | undefined | null): AdminRole[] {
  if (actorRole === "owner") return ["owner", "manager", "staff"];
  if (actorRole === "manager") return ["manager", "staff"];
  return [];
}

/** Only Owners may revoke every admin session globally (including master and Owner sessions). */
export function canRevokeAllAdminSessions(actorRole: AdminRole | undefined | null): boolean {
  return actorRole === "owner";
}

export function requiredPermissionForAdminPath(pathname: string): AdminPermission {
  if (pathname.startsWith("/admin/orders")) return "orders";
  if (pathname.startsWith("/admin/rates")) return "rates";
  if (pathname.startsWith("/admin/products") || pathname.startsWith("/admin/categories")) return "catalog";
  if (pathname.startsWith("/admin/coupons")) return "coupons";
  if (pathname.startsWith("/admin/customers")) return "customers";
  if (pathname.startsWith("/admin/analytics")) return "analytics";
  if (pathname.startsWith("/admin/google-analytics")) return "google_analytics";
  if (pathname.startsWith("/admin/visitors")) return "visitors";
  if (pathname.startsWith("/admin/search")) return "search";
  if (pathname.startsWith("/admin/settings")) return "settings";
  if (pathname.startsWith("/admin/team")) return "team";
  return "overview";
}
