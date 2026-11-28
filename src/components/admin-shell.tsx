import { Link, Outlet, useRouter, useRouterState } from "@tanstack/react-router";
import { createContext, useContext, useEffect, useState, type FormEvent } from "react";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Home,
  Package,
  Tags,
  ShoppingCart,
  ExternalLink,
  LogOut,
  Menu,
  X,
  Loader2,
  Lock,
  Coins,
  Users,
  Settings,
  Ticket,
  BarChart3,
  LineChart,
  Activity,
  SearchCheck,
  ShieldCheck,
} from "lucide-react";
import { adminLogin, adminLogout, adminSession } from "../lib/admin";
import {
  hasAdminPermission,
  requiredPermissionForAdminPath,
  roleLabel,
  type AdminPermission,
  type AdminUserView,
} from "../lib/admin-roles";
import { Button, EmptyState, inputClass } from "./admin-ui";

export type AdminSessionInfo = {
  authed: boolean;
  user: AdminUserView | null;
  dbConnected: boolean;
  secretConfigured: boolean;
  masterPasswordConfigured: boolean;
};

const LockContext = createContext<() => void>(() => {});
const SessionContext = createContext<{
  user: AdminUserView | null;
  can: (perm: AdminPermission) => boolean;
}>({ user: null, can: () => false });

export function useAdminSession() {
  return useContext(SessionContext);
}

export function useAdminQuery<T>(key: unknown[], fn: () => Promise<T>) {
  const lockOut = useContext(LockContext);
  const query = useQuery({ queryKey: ["admin", ...key], queryFn: fn, retry: false });
  useEffect(() => {
    if (query.error instanceof Error && query.error.message === "Unauthorized") lockOut();
  }, [query.error, lockOut]);
  return query;
}

export function useAdminInfiniteQuery<T, C>(
  key: unknown[],
  fn: (cursor: C | undefined) => Promise<T>,
  nextCursor: (lastPage: T, pages: T[]) => C | undefined,
) {
  const lockOut = useContext(LockContext);
  const query = useInfiniteQuery({
    queryKey: ["admin", ...key],
    queryFn: ({ pageParam }) => fn(pageParam as C | undefined),
    initialPageParam: undefined as C | undefined,
    getNextPageParam: nextCursor,
    retry: false,
  });
  useEffect(() => {
    if (query.error instanceof Error && query.error.message === "Unauthorized") lockOut();
  }, [query.error, lockOut]);
  return query;
}

const NAV: { to: string; label: string; icon: any; exact?: boolean; permission: AdminPermission }[] = [
  { to: "/admin", label: "Home", icon: Home, exact: true, permission: "overview" },
  { to: "/admin/orders", label: "Orders", icon: ShoppingCart, permission: "orders" },
  { to: "/admin/rates", label: "Daily Rates", icon: Coins, permission: "rates" },
  { to: "/admin/products", label: "Products", icon: Package, permission: "catalog" },
  { to: "/admin/categories", label: "Categories", icon: Tags, permission: "catalog" },
  { to: "/admin/coupons", label: "Coupons", icon: Ticket, permission: "coupons" },
  { to: "/admin/customers", label: "Customers", icon: Users, permission: "customers" },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3, permission: "analytics" },
  { to: "/admin/google-analytics", label: "Google Analytics", icon: LineChart, permission: "google_analytics" },
  { to: "/admin/visitors", label: "Visitors & Funnel", icon: Activity, permission: "visitors" },
  { to: "/admin/search", label: "Google Search", icon: SearchCheck, permission: "search" },
  { to: "/admin/settings", label: "Store Settings", icon: Settings, permission: "settings" },
  { to: "/admin/team", label: "Team & Access", icon: ShieldCheck, permission: "team" },
];

export function AdminShell({ initialSession }: { initialSession?: AdminSessionInfo }) {
  const [session, setSession] = useState<AdminSessionInfo | null>(initialSession ?? null);
  const [navOpen, setNavOpen] = useState(false);
  const qc = useQueryClient();
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (initialSession) {
      setSession(initialSession);
      return;
    }
    adminSession()
      .then((s) => setSession(s))
      .catch(() =>
        setSession({
          authed: false,
          user: null,
          dbConnected: true,
          secretConfigured: true,
          masterPasswordConfigured: true,
        }),
      );
  }, [initialSession]);

  useEffect(() => setNavOpen(false), [pathname]);

  const lockOut = () => {
    qc.removeQueries({ queryKey: ["admin"] });
    setSession((prev) => ({
      authed: false,
      user: null,
      dbConnected: prev?.dbConnected ?? true,
      secretConfigured: prev?.secretConfigured ?? true,
      masterPasswordConfigured: prev?.masterPasswordConfigured ?? true,
    }));
  };

  if (!session) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#F1F1F1]">
        <Loader2 className="h-6 w-6 animate-spin text-[#616161]" />
      </div>
    );
  }

  if (!session.authed || !session.user) {
    return (
      <AdminLogin
        session={session}
        onSuccess={(user) => {
          setSession((prev) => ({ ...(prev ?? session), authed: true, user }));
          router.invalidate();
        }}
      />
    );
  }

  const currentUser = session.user;
  const can = (permission: AdminPermission) => hasAdminPermission(currentUser.role, permission);
  const visibleNav = NAV.filter((item) => can(item.permission));
  const neededPermission = requiredPermissionForAdminPath(pathname);
  const allowedOnRoute = can(neededPermission);

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to || pathname === `${to}/` : pathname.startsWith(to);

  const nav = (
    <nav className="space-y-0.5 p-3">
      {visibleNav.map(({ to, label, icon: Icon, exact }) => (
        <Link
          key={to}
          to={to as any}
          className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-semibold transition-colors ${
            isActive(to, exact) ? "bg-white text-[#303030] shadow-[0_1px_0_rgba(0,0,0,0.05)]" : "text-[#4A4A4A] hover:bg-white/60"
          }`}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}
      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-semibold text-[#4A4A4A] hover:bg-white/60"
      >
        <ExternalLink className="h-4 w-4" />
        View store
      </a>
    </nav>
  );

  return (
    <LockContext.Provider value={lockOut}>
      <SessionContext.Provider value={{ user: currentUser, can }}>
        <div className="min-h-screen bg-[#F1F1F1] font-[system-ui,-apple-system,'Segoe_UI',sans-serif] text-[#303030]">
          <header className="sticky top-0 z-40 flex h-14 items-center gap-3 bg-[#1A1A1A] px-3 text-white sm:px-4">
            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-lg hover:bg-white/10 lg:hidden"
              onClick={() => setNavOpen((o) => !o)}
              aria-label="Toggle navigation"
            >
              {navOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link to={"/admin" as any} className="flex items-center gap-2">
              <img src="/LOGO.png" alt="" className="h-7 w-7 rounded-md bg-white object-contain" />
              <span className="text-sm font-semibold">Nadeem Traders</span>
            </Link>
            <div className="ml-auto flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs sm:flex">
                <span className="font-medium text-white">{currentUser.name}</span>
                <span className="rounded bg-white/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#E8D29B]">
                  {roleLabel(currentUser.role)}
                </span>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await adminLogout();
                  lockOut();
                }}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-white/80 hover:bg-white/10"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Log out</span>
              </button>
            </div>
          </header>

          <div className="flex">
            <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 bg-[#EBEBEB] lg:block">{nav}</aside>
            {navOpen && (
              <div className="fixed inset-0 top-14 z-30 lg:hidden">
                <div className="absolute inset-0 bg-black/40" onClick={() => setNavOpen(false)} />
                <aside className="relative h-full w-64 bg-[#EBEBEB]">{nav}</aside>
              </div>
            )}

            <main className="min-w-0 flex-1 px-3 py-5 sm:px-6 sm:py-6">
              <div className="mx-auto max-w-[1000px]">
                {!session.dbConnected && (
                  <div className="mb-4 rounded-xl bg-[#FFEB78] px-4 py-3 text-[13px] text-[#4F4700]">
                    Database not connected — set DATABASE_URL to save changes.
                  </div>
                )}
                {allowedOnRoute ? (
                  <Outlet />
                ) : (
                  <div className="rounded-xl bg-white shadow-[0_1px_0_0_rgba(26,26,26,0.07)] ring-1 ring-black/[0.06]">
                    <EmptyState
                      title="Access restricted"
                      body={`Your role (${roleLabel(currentUser.role)}) does not have permission to view this section.`}
                      action={
                        <Link
                          to={"/admin" as any}
                          className="inline-flex items-center rounded-lg bg-[#303030] px-3 py-1.5 text-[13px] font-semibold text-white"
                        >
                          Return to Admin Home
                        </Link>
                      }
                    />
                  </div>
                )}
              </div>
            </main>
          </div>
        </div>
      </SessionContext.Provider>
    </LockContext.Provider>
  );
}

function AdminLogin({
  session,
  onSuccess,
}: {
  session: AdminSessionInfo;
  onSuccess: (user: AdminUserView) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await adminLogin({ data: { email: email.trim() || undefined, password } });
      if (res.ok) onSuccess(res.user);
      else setError("Invalid email or password");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-[#F1F1F1] px-4 font-[system-ui,-apple-system,'Segoe_UI',sans-serif]">
      <form onSubmit={submit} className="w-full max-w-sm rounded-xl bg-white p-6 shadow-[0_1px_0_0_rgba(26,26,26,0.07)] ring-1 ring-black/[0.06]">
        <div className="flex items-center gap-2.5">
          <img src="/LOGO.png" alt="" className="h-9 w-9 object-contain" />
          <div>
            <p className="text-sm font-semibold text-[#303030]">Nadeem Traders</p>
            <p className="text-xs text-[#616161]">Store admin</p>
          </div>
        </div>
        <h1 className="mt-6 text-lg font-bold text-[#303030]">Log in</h1>
        {!session.secretConfigured && (
          <div className="mt-3 rounded-lg bg-[#FEE8EB] px-3 py-2 text-xs text-[#8E0B21]">
            ADMIN_SESSION_SECRET (32+ chars) is not configured on the server.
          </div>
        )}
        <label className="mt-4 block">
          <span className="mb-1 block text-[13px] font-medium text-[#303030]">
            Email {session.masterPasswordConfigured && <span className="font-normal text-[#616161]">(optional for owner)</span>}
          </span>
          <input
            type="email"
            autoComplete="username"
            placeholder="staff@nadeemtraders.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required={!session.masterPasswordConfigured}
            className={inputClass}
          />
        </label>
        <label className="mt-3 block">
          <span className="mb-1 block text-[13px] font-medium text-[#303030]">Password</span>
          <input
            type="password"
            autoFocus
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </label>
        {error && <p className="mt-2 text-[13px] text-[#C70A24]">{error}</p>}
        <Button
          type="submit"
          variant="primary"
          loading={loading}
          disabled={!password || (!session.masterPasswordConfigured && !email.trim())}
          className="mt-4 w-full py-2"
        >
          <Lock className="h-3.5 w-3.5" /> Log in
        </Button>
      </form>
    </div>
  );
}
