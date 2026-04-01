// Role-based access control configuration
// Maps each role to the paths they can access

export type AppRole = string;

// Full admin paths
const ADMIN_PATHS = [
  "/", "/tickets", "/sla-report", "/analytics",
  "/admin/users", "/admin/departments", "/admin/roles",
  "/admin/centers", "/admin/sla", "/admin/categories",
  "/admin/subcategories", "/admin/child-categories", "/admin/service-titles", "/admin/login-history", "/admin/designations",
];

// Which paths each role can access
const roleAccess: Record<string, string[]> = {
  "Super Admin": ADMIN_PATHS,
  "Global Admin": ADMIN_PATHS,
  "Super User": ADMIN_PATHS,
  "Help Desk Admin": ["/", "/tickets", "/sla-report", "/analytics", "/admin/users", "/admin/departments", "/admin/centers", "/admin/categories", "/admin/subcategories", "/admin/service-titles"],
  "Helpdesk In-charge": ["/", "/tickets", "/sla-report", "/analytics", "/admin/users", "/admin/departments", "/admin/centers"],
  "Area Operations Manager": ["/", "/tickets", "/approvals", "/sla-report", "/analytics"],
  "Area Operations Manager Head": ["/", "/tickets", "/approvals", "/sla-report", "/analytics"],
  "Manager": ["/", "/tickets", "/sla-report", "/analytics", "/approvals"],
  "L1 Manager": ["/", "/tickets", "/sla-report", "/analytics", "/approvals"],
  "L2 Manager": ["/", "/tickets", "/sla-report", "/analytics", "/approvals"],
  "Finance": ["/", "/tickets", "/finance-approvals", "/sla-report", "/analytics"],
  "Finance Head": ["/", "/tickets", "/finance-approvals", "/sla-report", "/analytics"],
  "Clinic Incharge": ["/", "/tickets", "/sla-report", "/analytics"],
  "Clinic Manager": ["/", "/tickets", "/sla-report", "/analytics"],
  "QA": ["/", "/tickets", "/sla-report", "/analytics"],
  "Sr. Manager Quality & Audit": ["/", "/tickets", "/sla-report", "/analytics", "/admin/users", "/admin/departments", "/admin/roles", "/admin/centers", "/admin/categories", "/admin/subcategories"],
  "Zenoti Team": ["/", "/tickets", "/zenoti-requests", "/finance-approvals", "/sla-report", "/analytics"],
  "Zenoti Team Manager": ["/", "/tickets", "/zenoti-requests", "/finance-approvals", "/sla-report", "/admin/users", "/admin/departments", "/admin/roles", "/admin/centers", "/admin/categories", "/admin/subcategories", "/admin/child-categories"],
  "CDD": ["/", "/tickets", "/sla-report", "/analytics"],
  "CDD Admin": ["/", "/tickets", "/sla-report", "/analytics", "/admin/users", "/admin/departments", "/admin/centers", "/admin/roles", "/admin/categories", "/admin/subcategories"],
  "Administration": ["/", "/tickets", "/sla-report", "/analytics"],
  "Admin Department": ["/", "/tickets", "/sla-report", "/analytics"],
  "Employee": ["/", "/tickets", "/sla-report", "/analytics"],
  "Others": ["/", "/tickets", "/sla-report", "/analytics"],
};

// Default access for unknown roles
const DEFAULT_ACCESS = ["/", "/tickets", "/sla-report", "/analytics"];

/**
 * Check if a user's role string (possibly comma-separated) includes any of the given roles.
 */
export function hasAnyRole(userRole: string, roles: string[]): boolean {
  const userRoles = userRole.split(",").map((r) => r.trim());
  return userRoles.some((r) => roles.includes(r));
}

const SUPER_ROLES = ["Super Admin", "Global Admin", "Super User"];
const ADMIN_LIKE_ROLES = [...SUPER_ROLES];

export function isSuperRole(userRole: string): boolean {
  return hasAnyRole(userRole, SUPER_ROLES);
}

export function isAdminLikeRole(userRole: string): boolean {
  return hasAnyRole(userRole, ADMIN_LIKE_ROLES);
}

export function getUserRole(): AppRole {
  try {
    const stored = localStorage.getItem("oliva_user");
    if (stored) {
      const user = JSON.parse(stored);
      if (user?.role) return user.role as AppRole;
    }
  } catch { /* ignore */ }
  return "Employee";
}

export function canAccess(path: string): boolean {
  const role = getUserRole();
  const roles = role.split(",").map((r) => r.trim());
  // If user has any super role, use ADMIN_PATHS only
  if (roles.some((r) => SUPER_ROLES.includes(r))) {
    return ADMIN_PATHS.includes(path);
  }
  for (const r of roles) {
    const allowed = roleAccess[r];
    if (allowed && allowed.includes(path)) return true;
  }
  const allowed = roleAccess[role] || DEFAULT_ACCESS;
  return allowed.includes(path);
}

export function getAllowedPaths(): string[] {
  const role = getUserRole();
  const roles = role.split(",").map((r) => r.trim());
  // If user has any super role, use ADMIN_PATHS only (no approvals)
  if (roles.some((r) => SUPER_ROLES.includes(r))) {
    return [...ADMIN_PATHS];
  }
  const paths = new Set<string>();
  for (const r of roles) {
    const allowed = roleAccess[r];
    if (allowed) allowed.forEach((p) => paths.add(p));
  }
  if (paths.size === 0) {
    const fallback = roleAccess[role] || DEFAULT_ACCESS;
    fallback.forEach((p) => paths.add(p));
  }
  return [...paths];
}
