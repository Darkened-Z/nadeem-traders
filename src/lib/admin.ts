import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { getCookie, setCookie, deleteCookie } from "@tanstack/react-start/server";
import crypto from "crypto";
import { sql } from "./db";
import { assertOrderStatus } from "./order-status";
import { DEFAULT_STORE_SETTINGS, type StoreSettings } from "./store-settings";
import {
  ADMIN_ROLES,
  assignableAdminRoles,
  canManageTeamRole,
  canRevokeAllAdminSessions,
  hasAdminPermission,
  isAdminRole,
  type AdminPermission,
  type AdminRole,
  type AdminUserView,
  type AuditLogEntry,
  type TeamMember,
} from "./admin-roles";

export { DEFAULT_STORE_SETTINGS, type StoreSettings };

const COOKIE = "nt_admin";
const SESSION_DAYS = 7;
const HASH_PREFIX = "scrypt$";
const DUMMY_HASH =
  "scrypt$00000000000000000000000000000000$" + "00".repeat(64);

function getSecretOrNull(): string | null {
  const s = process.env.ADMIN_SESSION_SECRET;
  return s && s.length >= 32 ? s : null;
}

function secret(): string {
  const s = getSecretOrNull();
  if (!s) throw new Error("ADMIN_SESSION_SECRET is not configured");
  return s;
}

function signWithKey(payload: string, secretKey: string): string {
  return crypto.createHmac("sha256", secretKey).update(payload).digest("hex");
}

function sign(payload: string): string {
  return signWithKey(payload, secret());
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${HASH_PREFIX}${salt}$${hash}`;
}

function verifyPasswordHash(password: string, stored: string): boolean {
  if (!stored.startsWith(HASH_PREFIX)) return false;
  const parts = stored.slice(HASH_PREFIX.length).split("$");
  if (parts.length !== 2) return false;
  const [salt, expectedHex] = parts;
  if (!salt || !expectedHex) return false;
  try {
    const derived = crypto.scryptSync(password, salt, 64);
    const expected = Buffer.from(expectedHex, "hex");
    return derived.length === expected.length && crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

type ParsedAdminToken = { sub: number; ver: number; iat: number };

function parseSession(token: string | undefined): ParsedAdminToken | null {
  if (!token) return null;
  const secretKey = getSecretOrNull();
  if (!secretKey) return null;

  if (token.startsWith("v2.")) {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [, b64, mac] = parts;
    if (!b64 || !mac || !safeEqual(mac, signWithKey(`v2.${b64}`, secretKey))) return null;
    try {
      const data = JSON.parse(Buffer.from(b64, "base64url").toString("utf8")) as {
        s?: unknown;
        v?: unknown;
        i?: unknown;
        e?: unknown;
      };
      if (
        typeof data.s !== "number" ||
        typeof data.v !== "number" ||
        typeof data.i !== "number" ||
        typeof data.e !== "number" ||
        data.e < Date.now()
      ) {
        return null;
      }
      return { sub: data.s, ver: data.v, iat: data.i };
    } catch {
      return null;
    }
  }

  // Backward compatibility with legacy owner iat.exp.mac cookies
  const [iat, exp, mac] = token.split(".");
  if (!iat || !exp || !mac || Number(exp) < Date.now()) return null;
  return safeEqual(mac, signWithKey(`${iat}.${exp}`, secretKey))
    ? { sub: 0, ver: 0, iat: Number(iat) }
    : null;
}

function buildCookieToken(sub: number, ver: number): string {
  const now = Date.now();
  const exp = now + SESSION_DAYS * 86_400_000;
  const body = `v2.${Buffer.from(JSON.stringify({ s: sub, v: ver, i: now, e: exp })).toString("base64url")}`;
  return `${body}.${sign(body)}`;
}

let adminTablesReady: Promise<unknown> | null = null;
function ensureAdminTables() {
  if (!sql) return Promise.resolve();
  adminTablesReady ??= (async () => {
    await sql!`
      CREATE TABLE IF NOT EXISTS admin_auth (
        id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
        sessions_valid_after BIGINT NOT NULL DEFAULT 0
      )
    `;
    await sql!`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        token_version INTEGER NOT NULL DEFAULT 1,
        last_login_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    await sql!`
      CREATE TABLE IF NOT EXISTS admin_audit_logs (
        id SERIAL PRIMARY KEY,
        actor_id INTEGER,
        actor_email TEXT NOT NULL,
        actor_role TEXT NOT NULL,
        action TEXT NOT NULL,
        target TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
  })().catch((err) => {
    adminTablesReady = null;
    throw err;
  });
  return adminTablesReady;
}

// Logging out of master session or revoking all bumps sessions_valid_after.
async function sessionsValidAfter(): Promise<number> {
  if (!sql) return 0;
  await ensureAdminTables();
  const rows = await sql`SELECT sessions_valid_after FROM admin_auth WHERE id = 1`;
  return rows.length ? Number(rows[0].sessions_valid_after) : 0;
}

const getAdminActor = createServerOnlyFn(async (): Promise<(AdminUserView & { sub: number }) | null> => {
  const session = parseSession(getCookie(COOKIE));
  if (!session) return null;

  if (sql) {
    if (session.iat < (await sessionsValidAfter())) return null;
    if (session.sub > 0) {
      await ensureAdminTables();
      const rows = await sql`
        SELECT id, email, name, role, active, token_version
        FROM admin_users
        WHERE id = ${session.sub}
        LIMIT 1
      `;
      const row = rows[0];
      if (
        !row ||
        row.active !== true ||
        Number(row.token_version) !== session.ver ||
        !isAdminRole(row.role)
      ) {
        return null;
      }
      return {
        id: Number(row.id),
        name: String(row.name),
        email: String(row.email),
        role: row.role,
        sub: Number(row.id),
      };
    }
  } else if (session.sub !== 0) {
    return null;
  }

  return {
    id: null,
    name: "Store Owner",
    email: process.env.ADMIN_EMAIL || "owner",
    role: "owner",
    sub: 0,
  };
});

export const assertAdmin = createServerOnlyFn(
  async (required?: AdminPermission | AdminPermission[]): Promise<AdminUserView> => {
    const actor = await getAdminActor();
    if (!actor) throw new Error("Unauthorized");
    if (required) {
      const needed = Array.isArray(required) ? required : [required];
      if (!needed.some((p) => hasAdminPermission(actor.role, p))) {
        throw new Error("Forbidden");
      }
    }
    return { id: actor.id, name: actor.name, email: actor.email, role: actor.role };
  },
);

const logAdminAction = createServerOnlyFn(
  async (actor: AdminUserView, action: string, target?: string | null) => {
    if (!sql) return;
    try {
      await ensureAdminTables();
      await sql`
        INSERT INTO admin_audit_logs (actor_id, actor_email, actor_role, action, target)
        VALUES (${actor.id}, ${actor.email}, ${actor.role}, ${action}, ${target ?? null})
      `;
    } catch (err) {
      console.error("Failed to record admin audit log:", err);
    }
  },
);

function db() {
  if (!sql) throw new Error("Database not connected");
  return sql;
}

async function bustStoreCache() {
  const { serverCache } = await import("./server-cache");
  serverCache.delete("products");
  serverCache.delete("categories");
  serverCache.delete("store_settings");
}

export const adminSession = createServerFn({ method: "GET" }).handler(async () => {
  const actor = await getAdminActor().catch(() => null);
  return {
    authed: !!actor,
    user: actor ? { id: actor.id, name: actor.name, email: actor.email, role: actor.role } : null,
    dbConnected: !!sql,
    secretConfigured: !!getSecretOrNull(),
    masterPasswordConfigured: !!process.env.ADMIN_PASSWORD,
  };
});

export const adminLogin = createServerFn({ method: "POST" })
  .validator((data: { email?: string; password: string }) => data)
  .handler(async ({ data }) => {
    secret();
    const email = (data.email ?? "").trim().toLowerCase();
    const password = String(data.password ?? "");

    if (sql !== null) {
      const { getClientIp } = await import("./server-cookies");
      const { assertUnderLimit } = await import("./rate-limit");
      const ipKey = `admin-login:${getClientIp() ?? "unknown"}`;
      await assertUnderLimit(ipKey, 10, 15);
      await assertUnderLimit("admin-login:all", 50, 15);
      if (email) await assertUnderLimit(`admin-login:email:${email}`, 10, 15);
    }

    const recordFail = async () => {
      if (!sql) return;
      const { getClientIp } = await import("./server-cookies");
      const { recordAttempt } = await import("./rate-limit");
      const ipKey = `admin-login:${getClientIp() ?? "unknown"}`;
      await recordAttempt(ipKey);
      await recordAttempt("admin-login:all");
      if (email) await recordAttempt(`admin-login:email:${email}`);
    };

    const setSessionCookie = (token: string) => {
      setCookie(COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: SESSION_DAYS * 86_400,
      });
    };

    await new Promise((r) => setTimeout(r, 400));

    if (email) {
      const q = db();
      await ensureAdminTables();
      const rows = await q`
        SELECT id, email, name, role, password_hash, active, token_version
        FROM admin_users
        WHERE email = ${email}
        LIMIT 1
      `;
      const row = rows[0];
      const hashToCheck = row ? String(row.password_hash) : DUMMY_HASH;
      const matches = verifyPasswordHash(password, hashToCheck);
      if (!row || !matches || row.active !== true || !isAdminRole(row.role)) {
        await recordFail();
        return { ok: false as const };
      }

      await q`UPDATE admin_users SET last_login_at = NOW() WHERE id = ${row.id}`;
      const user: AdminUserView = {
        id: Number(row.id),
        name: String(row.name),
        email: String(row.email),
        role: row.role,
      };
      setSessionCookie(buildCookieToken(Number(row.id), Number(row.token_version)));
      await logAdminAction(user, "login", "member");
      return { ok: true as const, user };
    }

    const expected = process.env.ADMIN_PASSWORD;
    if (!expected) {
      throw new Error("Enter your team email and password (ADMIN_PASSWORD is not configured).");
    }
    if (!safeEqual(sign(password), sign(expected))) {
      await recordFail();
      return { ok: false as const };
    }

    const ownerUser: AdminUserView = {
      id: null,
      name: "Store Owner",
      email: process.env.ADMIN_EMAIL || "owner",
      role: "owner",
    };
    setSessionCookie(buildCookieToken(0, 0));
    await logAdminAction(ownerUser, "login", "master-password");
    return { ok: true as const, user: ownerUser };
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  const actor = await getAdminActor().catch(() => null);
  if (actor && sql) {
    await ensureAdminTables();
    if (actor.sub === 0) {
      await sql`
        INSERT INTO admin_auth (id, sessions_valid_after) VALUES (1, ${Date.now()})
        ON CONFLICT (id) DO UPDATE SET sessions_valid_after = EXCLUDED.sessions_valid_after
      `;
    } else {
      await sql`UPDATE admin_users SET token_version = token_version + 1, updated_at = NOW() WHERE id = ${actor.sub}`;
    }
    await logAdminAction(actor, "logout", actor.sub === 0 ? "master-password" : "member");
  }
  deleteCookie(COOKIE, { path: "/" });
  return { ok: true };
});

export const adminOverview = createServerFn({ method: "GET" }).handler(async () => {
  await assertAdmin("overview");
  const q = db();
  const [counts] = await q`
    SELECT
      (SELECT count(*) FROM products)::int AS products,
      (SELECT count(*) FROM products WHERE status = 'active')::int AS active,
      (SELECT count(*) FROM products WHERE status = 'draft')::int AS drafts,
      (SELECT count(*) FROM products WHERE price IS NULL)::int AS unpriced,
      (SELECT count(*) FROM categories)::int AS categories,
      (SELECT count(*) FROM orders)::int AS orders,
      (SELECT count(*) FROM orders WHERE status = 'Pending')::int AS pending
  `;
  const recentOrders = await q`
    SELECT id, customer_name, total_amount, status, created_at FROM orders ORDER BY id DESC LIMIT 5
  `;
  return { counts, recentOrders };
});

export const adminListProducts = createServerFn({ method: "GET" }).handler(async () => {
  await assertAdmin(["rates", "catalog"]);
  return db()`
    SELECT p.*, c.name AS category_name,
      COALESCE(
        (SELECT json_agg(json_build_object('id', v.id, 'name', v.name, 'price', v.price, 'weight', v.weight, 'image_url', v.image_url)
                ORDER BY v.position, v.id)
         FROM product_variants v WHERE v.product_id = p.id),
        '[]'::json
      ) AS variants
    FROM products p LEFT JOIN categories c ON c.id = p.category_id
    ORDER BY c.position NULLS LAST, c.id, p.id
  `;
});

export const adminGetProduct = createServerFn({ method: "POST" })
  .validator((data: { id: number }) => data)
  .handler(async ({ data }) => {
    await assertAdmin("catalog");
    const rows = await db()`SELECT * FROM products WHERE id = ${data.id}`;
    return rows[0] ?? null;
  });

export type ProductInput = {
  id?: number;
  name: string;
  name_ur: string | null;
  description: string | null;
  origin: string | null;
  weight: string | null;
  price: number | null;
  category_id: number;
  image_url: string | null;
  stock: boolean;
  status: "active" | "draft";
};

export const adminSaveProduct = createServerFn({ method: "POST" })
  .validator((data: ProductInput) => {
    if (!data.name?.trim()) throw new Error("Title is required");
    if (!Number.isInteger(data.category_id)) throw new Error("Category is required");
    if (data.price != null && (!Number.isFinite(data.price) || data.price < 0)) throw new Error("Invalid price");
    if (data.status !== "active" && data.status !== "draft") throw new Error("Invalid status");
    return data;
  })
  .handler(async ({ data }) => {
    const actor = await assertAdmin("catalog");
    const q = db();
    const v = {
      name: data.name.trim(),
      name_ur: data.name_ur?.trim() || null,
      description: data.description?.trim() || null,
      origin: data.origin?.trim() || null,
      weight: data.weight?.trim() || null,
      price: data.price == null ? null : Math.round(data.price),
      image_url: data.image_url?.trim() || null,
    };
    let row;
    if (data.id) {
      [row] = await q`
        UPDATE products SET
          name = ${v.name}, name_ur = ${v.name_ur}, description = ${v.description}, origin = ${v.origin},
          weight = ${v.weight}, price = ${v.price}, category_id = ${data.category_id},
          image_url = ${v.image_url}, stock = ${data.stock}, status = ${data.status}
        WHERE id = ${data.id}
        RETURNING *
      `;
    } else {
      [row] = await q`
        INSERT INTO products (name, name_ur, description, origin, weight, price, category_id, image_url, stock, status, brand, emoji)
        VALUES (${v.name}, ${v.name_ur}, ${v.description}, ${v.origin}, ${v.weight}, ${v.price}, ${data.category_id},
                ${v.image_url}, ${data.stock}, ${data.status}, 'Nadeem Traders', '')
        RETURNING *
      `;
    }
    await bustStoreCache();
    await logAdminAction(actor, data.id ? "product.updated" : "product.created", v.name);
    return row;
  });

export const adminSetProductStatus = createServerFn({ method: "POST" })
  .validator((data: { ids: number[]; status: "active" | "draft" }) => data)
  .handler(async ({ data }) => {
    const actor = await assertAdmin("catalog");
    if (data.status !== "active" && data.status !== "draft") throw new Error("Invalid status");
    await db()`UPDATE products SET status = ${data.status} WHERE id = ANY(${data.ids})`;
    await bustStoreCache();
    await logAdminAction(actor, "product.status", `${data.ids.length} -> ${data.status}`);
    return { ok: true };
  });

export const adminDeleteProducts = createServerFn({ method: "POST" })
  .validator((data: { ids: number[] }) => data)
  .handler(async ({ data }) => {
    const actor = await assertAdmin("catalog");
    await db()`DELETE FROM products WHERE id = ANY(${data.ids})`;
    await bustStoreCache();
    await logAdminAction(actor, "product.deleted", `${data.ids.length} products`);
    return { ok: true };
  });

export const adminListCategories = createServerFn({ method: "GET" }).handler(async () => {
  await assertAdmin("catalog");
  return db()`
    SELECT c.*, (SELECT count(*) FROM products p WHERE p.category_id = c.id)::int AS product_count
    FROM categories c ORDER BY c.position, c.id
  `;
});

export const adminSaveCategory = createServerFn({ method: "POST" })
  .validator((data: { id?: number; name: string; name_ur: string | null; image_url: string | null }) => {
    if (!data.name?.trim()) throw new Error("Name is required");
    return data;
  })
  .handler(async ({ data }) => {
    const actor = await assertAdmin("catalog");
    const q = db();
    const name = data.name.trim();
    const nameUr = data.name_ur?.trim() || null;
    const image = data.image_url?.trim() || null;
    const [row] = data.id
      ? await q`UPDATE categories SET name = ${name}, name_ur = ${nameUr}, image_url = ${image} WHERE id = ${data.id} RETURNING *`
      : await q`
          INSERT INTO categories (name, name_ur, image_url, icon, position)
          VALUES (${name}, ${nameUr}, ${image}, '', (SELECT coalesce(max(position), 0) + 1 FROM categories))
          RETURNING *
        `;
    await bustStoreCache();
    await logAdminAction(actor, data.id ? "category.updated" : "category.created", name);
    return row;
  });

export const adminMoveCategory = createServerFn({ method: "POST" })
  .validator((data: { id: number; direction: -1 | 1 }) => data)
  .handler(async ({ data }) => {
    await assertAdmin("catalog");
    const q = db();
    const cats = await q`SELECT id FROM categories ORDER BY position, id`;
    const ids = cats.map((c) => c.id as number);
    const i = ids.indexOf(data.id);
    const j = i + data.direction;
    if (i < 0 || j < 0 || j >= ids.length) return { ok: true };
    [ids[i], ids[j]] = [ids[j], ids[i]];
    await q.begin(async (tx) => {
      for (const [pos, id] of ids.entries()) {
        await tx`UPDATE categories SET position = ${pos} WHERE id = ${id}`;
      }
    });
    await bustStoreCache();
    return { ok: true };
  });

export const adminDeleteCategory = createServerFn({ method: "POST" })
  .validator((data: { id: number }) => data)
  .handler(async ({ data }) => {
    const actor = await assertAdmin("catalog");
    const q = db();
    const [{ n }] = await q`SELECT count(*)::int AS n FROM products WHERE category_id = ${data.id}`;
    if (n > 0) throw new Error("Move or delete this category's products first");
    await q`DELETE FROM categories WHERE id = ${data.id}`;
    await bustStoreCache();
    await logAdminAction(actor, "category.deleted", `#${data.id}`);
    return { ok: true };
  });

const PAGE_SIZE = 100;

export const adminListOrders = createServerFn({ method: "GET" })
  .validator((data: { beforeId?: number } | undefined) => data ?? {})
  .handler(async ({ data }) => {
    await assertAdmin("orders");
    const q = db();
    const orders = data.beforeId
      ? await q`SELECT * FROM orders WHERE id < ${data.beforeId} ORDER BY id DESC LIMIT ${PAGE_SIZE + 1}`
      : await q`SELECT * FROM orders ORDER BY id DESC LIMIT ${PAGE_SIZE + 1}`;
    const hasMore = orders.length > PAGE_SIZE;
    const page = orders.slice(0, PAGE_SIZE);
    const ids = page.map((o) => o.id as number);
    const items = ids.length ? await q`SELECT * FROM order_items WHERE order_id = ANY(${ids})` : [];
    return {
      orders: page.map((o) => ({ ...o, items: items.filter((it) => it.order_id === o.id) })),
      nextBeforeId: hasMore ? (page[page.length - 1].id as number) : undefined,
    };
  });

export const adminBatchUpdateRates = createServerFn({ method: "POST" })
  .validator((data: { rates: { id: number; price: number | null }[]; optionRates?: { id: number; price: number | null }[] }) => data)
  .handler(async ({ data }) => {
    const actor = await assertAdmin("rates");
    const q = db();
    const optionRates = data.optionRates ?? [];
    await q.begin(async (tx) => {
      for (const r of data.rates) {
        const p = r.price == null ? null : Math.round(r.price);
        await tx`UPDATE products SET price = ${p} WHERE id = ${r.id}`;
      }
      for (const r of optionRates) {
        const p = r.price == null ? null : Math.round(r.price);
        await tx`UPDATE product_variants SET price = ${p} WHERE id = ${r.id}`;
      }
    });
    await bustStoreCache();
    const count = data.rates.length + optionRates.length;
    await logAdminAction(actor, "rates.updated", `${count} price rows`);
    return { ok: true, count };
  });

export const adminUpdateOrderTracking = createServerFn({ method: "POST" })
  .validator((data: { id: number; tracking_number: string; courier?: string; status?: string; admin_notes?: string }) => data)
  .handler(async ({ data }) => {
    const actor = await assertAdmin("orders");
    const q = db();
    const tracking = data.tracking_number?.trim() || null;
    const courier = data.courier?.trim() || "PostEx";
    const notes = data.admin_notes?.trim() || null;
    const status = data.status || (tracking ? "Shipped" : undefined);
    if (status) assertOrderStatus(status);

    if (status) {
      await q`UPDATE orders SET tracking_number = ${tracking}, courier = ${courier}, admin_notes = ${notes}, status = ${status} WHERE id = ${data.id}`;
    } else {
      await q`UPDATE orders SET tracking_number = ${tracking}, courier = ${courier}, admin_notes = ${notes} WHERE id = ${data.id}`;
    }
    await logAdminAction(actor, "order.updated", `#${data.id}${status ? ` -> ${status}` : ""}`);
    return { ok: true };
  });

export const adminListCustomers = createServerFn({ method: "GET" })
  .validator((data: { offset?: number; search?: string } | undefined) => data ?? {})
  .handler(async ({ data }) => {
    await assertAdmin("customers");
    const q = db();
    const offset = Math.max(0, Math.floor(data.offset || 0));
    const like = `%${(data.search || "").trim()}%`;
    const customers = q`
      SELECT
        coalesce(nullif(customer_phone, ''), customer_email, customer_name) AS customer_key,
        max(customer_name) AS name,
        max(customer_phone) AS phone,
        max(customer_email) AS email,
        max(shipping_address) AS last_address,
        count(*)::int AS orders_count,
        coalesce(sum(total_amount) FILTER (WHERE status <> 'Cancelled'), 0)::int AS total_spent,
        max(created_at) AS last_order_at
      FROM orders
      GROUP BY 1
    `;
    const rows = await q`
      SELECT * FROM (${customers}) c
      WHERE c.name ILIKE ${like} OR c.phone ILIKE ${like} OR c.email ILIKE ${like} OR c.last_address ILIKE ${like}
      ORDER BY c.last_order_at DESC, c.customer_key
      LIMIT ${PAGE_SIZE + 1} OFFSET ${offset}
    `;
    const [totals] = await q`
      SELECT
        count(*)::int AS total,
        (count(*) FILTER (WHERE orders_count > 1))::int AS repeat,
        coalesce(sum(total_spent), 0)::int AS revenue
      FROM (${customers}) c
    `;
    return { customers: rows.slice(0, PAGE_SIZE), hasMore: rows.length > PAGE_SIZE, totals };
  });

export const readStoreSettings = createServerOnlyFn(async (): Promise<StoreSettings> => {
  if (!sql) return { ...DEFAULT_STORE_SETTINGS };
  try {
    const rows = await sql`SELECT key, value FROM store_settings`;
    const map: StoreSettings = { ...DEFAULT_STORE_SETTINGS };
    for (const r of rows) {
      const k = String(r.key);
      if (k in map) (map as Record<string, string>)[k] = String(r.value);
    }
    return map;
  } catch (err) {
    console.error("readStoreSettings failed, falling back to defaults:", err);
    return { ...DEFAULT_STORE_SETTINGS };
  }
});

export const adminGetSettings = createServerFn({ method: "GET" }).handler(async () => {
  await assertAdmin(["orders", "settings"]);
  return readStoreSettings();
});

export const adminSaveSettings = createServerFn({ method: "POST" })
  .validator((data: Record<string, string>) => data)
  .handler(async ({ data }) => {
    const actor = await assertAdmin("settings");
    const q = db();
    try {
      await q`
        CREATE TABLE IF NOT EXISTS store_settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `;
      await q.begin(async (tx) => {
        for (const [k, v] of Object.entries(data)) {
          await tx`
            INSERT INTO store_settings (key, value, updated_at)
            VALUES (${k}, ${String(v)}, NOW())
            ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
          `;
        }
      });
      await bustStoreCache();
      await logAdminAction(actor, "settings.updated", Object.keys(data).join(", "));
      return { ok: true };
    } catch (err) {
      console.error("adminSaveSettings failed:", err);
      throw new Error(err instanceof Error ? err.message : "Failed to save settings");
    }
  });

export const adminListCoupons = createServerFn({ method: "GET" }).handler(async () => {
  await assertAdmin("coupons");
  const q = db();
  try {
    await q`
      CREATE TABLE IF NOT EXISTS coupons (
        id SERIAL PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        discount_percent INTEGER NOT NULL,
        active BOOLEAN DEFAULT TRUE,
        min_order_amount INTEGER DEFAULT 0,
        times_used INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    return await q`SELECT * FROM coupons ORDER BY id DESC`;
  } catch (err) {
    console.error("adminListCoupons error:", err);
    return [];
  }
});

export const adminSaveCoupon = createServerFn({ method: "POST" })
  .validator((data: { id?: number; code: string; discount_percent: number; min_order_amount?: number; active?: boolean }) => data)
  .handler(async ({ data }) => {
    const actor = await assertAdmin("coupons");
    const q = db();
    const code = data.code.trim().toUpperCase();
    if (!code) throw new Error("Coupon code is required");
    const percent = Math.min(100, Math.max(1, Math.round(data.discount_percent)));
    const minOrder = Math.max(0, Math.round(data.min_order_amount || 0));
    const active = data.active !== false;

    if (data.id) {
      const [row] = await q`
        UPDATE coupons SET code = ${code}, discount_percent = ${percent}, min_order_amount = ${minOrder}, active = ${active}
        WHERE id = ${data.id} RETURNING *
      `;
      await logAdminAction(actor, "coupon.updated", code);
      return row;
    } else {
      const [row] = await q`
        INSERT INTO coupons (code, discount_percent, min_order_amount, active)
        VALUES (${code}, ${percent}, ${minOrder}, ${active})
        RETURNING *
      `;
      await logAdminAction(actor, "coupon.created", code);
      return row;
    }
  });

export const adminDeleteCoupon = createServerFn({ method: "POST" })
  .validator((data: { id: number }) => data)
  .handler(async ({ data }) => {
    const actor = await assertAdmin("coupons");
    const q = db();
    await q`DELETE FROM coupons WHERE id = ${data.id}`;
    await logAdminAction(actor, "coupon.deleted", `#${data.id}`);
    return { ok: true };
  });

export const adminToggleCoupon = createServerFn({ method: "POST" })
  .validator((data: { id: number; active: boolean }) => data)
  .handler(async ({ data }) => {
    const actor = await assertAdmin("coupons");
    const q = db();
    await q`UPDATE coupons SET active = ${data.active} WHERE id = ${data.id}`;
    await logAdminAction(actor, "coupon.toggled", `#${data.id} -> ${data.active ? "active" : "inactive"}`);
    return { ok: true };
  });

export const adminGetAnalytics = createServerFn({ method: "GET" }).handler(async () => {
  await assertAdmin("analytics");
  const q = db();
  try {
    const [rev] = await q`
      SELECT
        coalesce(sum(total_amount) FILTER (WHERE status <> 'Cancelled'), 0)::int AS total_revenue,
        count(*)::int AS total_orders,
        coalesce(count(*) FILTER (WHERE status = 'Delivered'), 0)::int AS delivered_orders,
        coalesce(count(*) FILTER (WHERE status = 'Pending'), 0)::int AS pending_orders,
        coalesce(avg(total_amount) FILTER (WHERE status <> 'Cancelled'), 0)::int AS avg_order_value
      FROM orders
    `;

    const topProducts = await q`
      SELECT
        oi.product_name,
        sum(oi.quantity)::int AS total_qty,
        sum(oi.quantity * oi.price)::int AS total_sales
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.status <> 'Cancelled'
      GROUP BY oi.product_name
      ORDER BY total_sales DESC
      LIMIT 8
    `;

    const statusCounts = await q`
      SELECT status, count(*)::int AS count
      FROM orders
      GROUP BY status
    `;

    const recentDaily = await q`
      SELECT
        to_char(created_at, 'YYYY-MM-DD') AS day,
        count(*)::int AS orders,
        coalesce(sum(total_amount) FILTER (WHERE status <> 'Cancelled'), 0)::int AS revenue
      FROM orders
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY 1
      ORDER BY 1 ASC
    `;

    return { rev, topProducts, statusCounts, recentDaily };
  } catch (err) {
    console.error("adminGetAnalytics error:", err);
    return {
      rev: { total_revenue: 0, total_orders: 0, delivered_orders: 0, pending_orders: 0, avg_order_value: 0 },
      topProducts: [],
      statusCounts: [],
      recentDaily: [],
    };
  }
});

async function assertAnotherOwnerRemains(targetId: number) {
  if (process.env.ADMIN_PASSWORD) return;
  const q = db();
  const [{ n }] = await q`
    SELECT count(*)::int AS n FROM admin_users
    WHERE role = 'owner' AND active = TRUE AND id <> ${targetId}
  `;
  if (n < 1) {
    throw new Error("At least one active Owner account (or ADMIN_PASSWORD) must remain enabled.");
  }
}

async function loadTeamTarget(
  q: ReturnType<typeof db>,
  id: number,
): Promise<{ id: number; email: string; role: string; active: boolean }> {
  const rows = await q`SELECT id, email, role, active FROM admin_users WHERE id = ${id} LIMIT 1`;
  const target = rows[0];
  if (!target) throw new Error("Team member not found");
  return {
    id: Number(target.id),
    email: String(target.email),
    role: String(target.role),
    active: target.active === true,
  };
}

function assertCanManageTarget(actorRole: AdminRole, targetRole: string, actionLabel: string) {
  const effectiveRole: AdminRole = isAdminRole(targetRole) ? targetRole : "owner";
  if (!canManageTeamRole(actorRole, effectiveRole)) {
    throw new Error(`Only an Owner can ${actionLabel} an Owner account.`);
  }
}

export const adminListTeam = createServerFn({ method: "GET" }).handler(async () => {
  const actor = await assertAdmin("team");
  const q = db();
  await ensureAdminTables();
  const [members, logs] = await Promise.all([
    q<TeamMember[]>`
      SELECT id, email, name, role, active, last_login_at, created_at
      FROM admin_users
      ORDER BY CASE role WHEN 'owner' THEN 0 WHEN 'manager' THEN 1 ELSE 2 END, id ASC
    `,
    q<AuditLogEntry[]>`
      SELECT id, actor_email, actor_role, action, target, created_at
      FROM admin_audit_logs
      ORDER BY id DESC
      LIMIT 50
    `,
  ]);
  return {
    members,
    logs,
    currentActorId: actor.id,
    currentActorRole: actor.role,
    masterPasswordEnabled: !!process.env.ADMIN_PASSWORD,
    roles: ADMIN_ROLES,
  };
});

export const adminCreateMember = createServerFn({ method: "POST" })
  .validator((data: { name: string; email: string; role: AdminRole; password: string }) => {
    const name = data.name?.trim();
    const email = data.email?.trim().toLowerCase();
    if (!name) throw new Error("Name is required");
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Valid email is required");
    if (!isAdminRole(data.role)) throw new Error("Invalid role");
    if (!data.password || data.password.length < 8) throw new Error("Password must be at least 8 characters");
    return { name, email, role: data.role, password: data.password };
  })
  .handler(async ({ data }) => {
    const actor = await assertAdmin("team");
    if (!assignableAdminRoles(actor.role).includes(data.role)) {
      throw new Error("Only an Owner can create an Owner account.");
    }
    const q = db();
    await ensureAdminTables();
    const existing = await q`SELECT id FROM admin_users WHERE email = ${data.email} LIMIT 1`;
    if (existing.length > 0) throw new Error("A team member with this email already exists.");
    const passwordHash = hashPassword(data.password);
    const [row] = await q`
      INSERT INTO admin_users (name, email, role, password_hash, active, token_version)
      VALUES (${data.name}, ${data.email}, ${data.role}, ${passwordHash}, TRUE, 1)
      RETURNING id, email, name, role, active, last_login_at, created_at
    `;
    await logAdminAction(actor, "member.created", `${data.email} (${data.role})`);
    return row;
  });

export const adminUpdateMember = createServerFn({ method: "POST" })
  .validator((data: { id: number; role: AdminRole; active: boolean; name: string }) => {
    if (!Number.isInteger(data.id)) throw new Error("Invalid member id");
    const name = data.name?.trim();
    if (!name) throw new Error("Name is required");
    if (!isAdminRole(data.role)) throw new Error("Invalid role");
    return { id: data.id, role: data.role, active: !!data.active, name };
  })
  .handler(async ({ data }) => {
    const actor = await assertAdmin("team");
    const q = db();
    await ensureAdminTables();
    const target = await loadTeamTarget(q, data.id);
    assertCanManageTarget(actor.role, target.role, "modify");
    if (!assignableAdminRoles(actor.role).includes(data.role)) {
      throw new Error("Only an Owner can assign the Owner role.");
    }
    if (actor.id === data.id && (data.role !== target.role || !data.active)) {
      throw new Error("You cannot change your own role or deactivate your own account.");
    }
    if (target.role === "owner" && target.active && (data.role !== "owner" || !data.active)) {
      await assertAnotherOwnerRemains(data.id);
    }
    const revokeTokens = data.role !== target.role || !data.active;
    const [updated] = await q`
      UPDATE admin_users
      SET
        name = ${data.name},
        role = ${data.role},
        active = ${data.active},
        token_version = token_version + ${revokeTokens ? 1 : 0},
        updated_at = NOW()
      WHERE id = ${data.id}
      RETURNING id, email, name, role, active, last_login_at, created_at
    `;
    await logAdminAction(
      actor,
      "member.updated",
      `${target.email} -> ${data.role}${data.active ? "" : " (disabled)"}`,
    );
    return updated;
  });

export const adminResetMemberPassword = createServerFn({ method: "POST" })
  .validator((data: { id: number; password: string }) => {
    if (!Number.isInteger(data.id)) throw new Error("Invalid member id");
    if (!data.password || data.password.length < 8) throw new Error("Password must be at least 8 characters");
    return { id: data.id, password: data.password };
  })
  .handler(async ({ data }) => {
    const actor = await assertAdmin("team");
    const q = db();
    await ensureAdminTables();
    const target = await loadTeamTarget(q, data.id);
    assertCanManageTarget(actor.role, target.role, "reset the password for");
    await q`
      UPDATE admin_users
      SET password_hash = ${hashPassword(data.password)}, token_version = token_version + 1, updated_at = NOW()
      WHERE id = ${data.id}
    `;
    await logAdminAction(actor, "member.password_reset", target.email);
    return { ok: true };
  });

export const adminRevokeMemberSessions = createServerFn({ method: "POST" })
  .validator((data: { id: number }) => data)
  .handler(async ({ data }) => {
    const actor = await assertAdmin("team");
    const q = db();
    await ensureAdminTables();
    const target = await loadTeamTarget(q, data.id);
    assertCanManageTarget(actor.role, target.role, "sign out");
    await q`
      UPDATE admin_users SET token_version = token_version + 1, updated_at = NOW()
      WHERE id = ${data.id}
    `;
    await logAdminAction(actor, "member.sessions_revoked", target.email);
    return { ok: true };
  });

export const adminDeleteMember = createServerFn({ method: "POST" })
  .validator((data: { id: number }) => data)
  .handler(async ({ data }) => {
    const actor = await assertAdmin("team");
    if (actor.id === data.id) throw new Error("You cannot delete your own account.");
    const q = db();
    await ensureAdminTables();
    const target = await loadTeamTarget(q, data.id);
    assertCanManageTarget(actor.role, target.role, "delete");
    if (target.role === "owner" && target.active) {
      await assertAnotherOwnerRemains(data.id);
    }
    await q`DELETE FROM admin_users WHERE id = ${data.id}`;
    await logAdminAction(actor, "member.deleted", target.email);
    return { ok: true };
  });

export const adminRevokeAllSessions = createServerFn({ method: "POST" }).handler(async () => {
  const actor = await assertAdmin("team");
  if (!canRevokeAllAdminSessions(actor.role)) {
    throw new Error("Only an Owner can sign out all admin sessions.");
  }
  const q = db();
  await ensureAdminTables();
  await q`
    INSERT INTO admin_auth (id, sessions_valid_after) VALUES (1, ${Date.now()})
    ON CONFLICT (id) DO UPDATE SET sessions_valid_after = EXCLUDED.sessions_valid_after
  `;
  await q`UPDATE admin_users SET token_version = token_version + 1, updated_at = NOW()`;
  await logAdminAction(actor, "sessions.revoked_all", "all admins");
  deleteCookie(COOKIE, { path: "/" });
  return { ok: true };
});
