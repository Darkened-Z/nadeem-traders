import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { getCookie, setCookie, deleteCookie } from "@tanstack/react-start/server";
import crypto from "crypto";
import { sql } from "./db";

const COOKIE = "nt_admin";
const SESSION_DAYS = 7;

function secret() {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("ADMIN_SESSION_SECRET is not configured");
  return s;
}

function sign(payload: string) {
  return crypto.createHmac("sha256", secret()).update(payload).digest("hex");
}

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

function isValidSession(token: string | undefined) {
  if (!token) return false;
  const [exp, mac] = token.split(".");
  if (!exp || !mac || Number(exp) < Date.now()) return false;
  return safeEqual(mac, sign(exp));
}

const hasAdminCookie = createServerOnlyFn(() => isValidSession(getCookie(COOKIE)));

export const assertAdmin = createServerOnlyFn(() => {
  if (!hasAdminCookie()) throw new Error("Unauthorized");
});

function db() {
  if (!sql) throw new Error("Database not connected");
  return sql;
}

async function bustStoreCache() {
  const { serverCache } = await import("./server-cache");
  serverCache.delete("products");
  serverCache.delete("categories");
}

export const adminSession = createServerFn({ method: "GET" }).handler(async () => ({
  authed: hasAdminCookie(),
  dbConnected: !!sql,
}));

export const adminLogin = createServerFn({ method: "POST" })
  .validator((data: { password: string }) => data)
  .handler(async ({ data }) => {
    const expected = process.env.ADMIN_PASSWORD;
    if (!expected) throw new Error("ADMIN_PASSWORD is not configured");
    await new Promise((r) => setTimeout(r, 400));
    if (!safeEqual(sign(data.password), sign(expected))) return { ok: false };
    const exp = String(Date.now() + SESSION_DAYS * 86_400_000);
    setCookie(COOKIE, `${exp}.${sign(exp)}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: SESSION_DAYS * 86_400,
    });
    return { ok: true };
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  deleteCookie(COOKIE, { path: "/" });
  return { ok: true };
});

export const adminOverview = createServerFn({ method: "GET" }).handler(async () => {
  assertAdmin();
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
  assertAdmin();
  return db()`
    SELECT p.*, c.name AS category_name
    FROM products p LEFT JOIN categories c ON c.id = p.category_id
    ORDER BY c.position NULLS LAST, c.id, p.id
  `;
});

export const adminGetProduct = createServerFn({ method: "POST" })
  .validator((data: { id: number }) => data)
  .handler(async ({ data }) => {
    assertAdmin();
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
    assertAdmin();
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
    return row;
  });

export const adminSetProductStatus = createServerFn({ method: "POST" })
  .validator((data: { ids: number[]; status: "active" | "draft" }) => data)
  .handler(async ({ data }) => {
    assertAdmin();
    if (data.status !== "active" && data.status !== "draft") throw new Error("Invalid status");
    await db()`UPDATE products SET status = ${data.status} WHERE id = ANY(${data.ids})`;
    await bustStoreCache();
    return { ok: true };
  });

export const adminDeleteProducts = createServerFn({ method: "POST" })
  .validator((data: { ids: number[] }) => data)
  .handler(async ({ data }) => {
    assertAdmin();
    await db()`DELETE FROM products WHERE id = ANY(${data.ids})`;
    await bustStoreCache();
    return { ok: true };
  });

export const adminListCategories = createServerFn({ method: "GET" }).handler(async () => {
  assertAdmin();
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
    assertAdmin();
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
    return row;
  });

export const adminMoveCategory = createServerFn({ method: "POST" })
  .validator((data: { id: number; direction: -1 | 1 }) => data)
  .handler(async ({ data }) => {
    assertAdmin();
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
    assertAdmin();
    const q = db();
    const [{ n }] = await q`SELECT count(*)::int AS n FROM products WHERE category_id = ${data.id}`;
    if (n > 0) throw new Error("Move or delete this category's products first");
    await q`DELETE FROM categories WHERE id = ${data.id}`;
    await bustStoreCache();
    return { ok: true };
  });

export const adminListOrders = createServerFn({ method: "GET" }).handler(async () => {
  assertAdmin();
  const q = db();
  const orders = await q`SELECT * FROM orders ORDER BY id DESC LIMIT 200`;
  const ids = orders.map((o) => o.id as number);
  const items = ids.length ? await q`SELECT * FROM order_items WHERE order_id = ANY(${ids})` : [];
  return orders.map((o) => ({ ...o, items: items.filter((it) => it.order_id === o.id) }));
});

export const adminBatchUpdateRates = createServerFn({ method: "POST" })
  .validator((data: { rates: { id: number; price: number | null }[] }) => data)
  .handler(async ({ data }) => {
    assertAdmin();
    const q = db();
    await q.begin(async (tx) => {
      for (const r of data.rates) {
        const p = r.price == null ? null : Math.round(r.price);
        await tx`UPDATE products SET price = ${p} WHERE id = ${r.id}`;
      }
    });
    await bustStoreCache();
    return { ok: true, count: data.rates.length };
  });

export const adminUpdateOrderTracking = createServerFn({ method: "POST" })
  .validator((data: { id: number; tracking_number: string; courier?: string; status?: string; admin_notes?: string }) => data)
  .handler(async ({ data }) => {
    assertAdmin();
    const q = db();
    const tracking = data.tracking_number?.trim() || null;
    const courier = data.courier?.trim() || "PostEx";
    const notes = data.admin_notes?.trim() || null;
    const status = data.status || (tracking ? "Shipped" : undefined);

    if (status) {
      await q`UPDATE orders SET tracking_number = ${tracking}, courier = ${courier}, admin_notes = ${notes}, status = ${status} WHERE id = ${data.id}`;
    } else {
      await q`UPDATE orders SET tracking_number = ${tracking}, courier = ${courier}, admin_notes = ${notes} WHERE id = ${data.id}`;
    }
    return { ok: true };
  });

export const adminListCustomers = createServerFn({ method: "GET" }).handler(async () => {
  assertAdmin();
  const q = db();
  return q`
    SELECT
      coalesce(nullif(customer_phone, ''), customer_email, customer_name) AS customer_key,
      max(customer_name) AS name,
      max(customer_phone) AS phone,
      max(customer_email) AS email,
      max(shipping_address) AS last_address,
      count(*)::int AS orders_count,
      sum(total_amount)::int AS total_spent,
      max(created_at) AS last_order_at
    FROM orders
    GROUP BY 1
    ORDER BY last_order_at DESC
    LIMIT 500
  `;
});

export const DEFAULT_STORE_SETTINGS: Record<string, string> = {
  whatsapp_number: "923000000000",
  announcement_text: "100% Purity Guaranteed · Apka Trusted Stop · Fast Doorstep Delivery via PostEx Courier",
  delivery_fee: "250",
  free_delivery_threshold: "3000",
  store_phone: "+92 300 0000000",
  store_email: "info@nadeemtraders.pk",
  store_address: "Gala Mandi, Pakistan",
};

export const adminGetSettings = createServerFn({ method: "GET" }).handler(async () => {
  assertAdmin();
  if (!sql) return DEFAULT_STORE_SETTINGS;
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS store_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    const rows = await sql`SELECT key, value FROM store_settings`;
    const map = { ...DEFAULT_STORE_SETTINGS };
    for (const r of rows) map[r.key] = r.value;
    return map;
  } catch (err) {
    console.error("adminGetSettings failed, falling back to defaults:", err);
    return DEFAULT_STORE_SETTINGS;
  }
});

export const adminSaveSettings = createServerFn({ method: "POST" })
  .validator((data: Record<string, string>) => data)
  .handler(async ({ data }) => {
    assertAdmin();
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
      return { ok: true };
    } catch (err) {
      console.error("adminSaveSettings failed:", err);
      throw new Error(err instanceof Error ? err.message : "Failed to save settings");
    }
  });

export const adminListCoupons = createServerFn({ method: "GET" }).handler(async () => {
  assertAdmin();
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
    assertAdmin();
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
      return row;
    } else {
      const [row] = await q`
        INSERT INTO coupons (code, discount_percent, min_order_amount, active)
        VALUES (${code}, ${percent}, ${minOrder}, ${active})
        RETURNING *
      `;
      return row;
    }
  });

export const adminDeleteCoupon = createServerFn({ method: "POST" })
  .validator((data: { id: number }) => data)
  .handler(async ({ data }) => {
    assertAdmin();
    const q = db();
    await q`DELETE FROM coupons WHERE id = ${data.id}`;
    return { ok: true };
  });

export const adminToggleCoupon = createServerFn({ method: "POST" })
  .validator((data: { id: number; active: boolean }) => data)
  .handler(async ({ data }) => {
    assertAdmin();
    const q = db();
    await q`UPDATE coupons SET active = ${data.active} WHERE id = ${data.id}`;
    return { ok: true };
  });

export const adminGetAnalytics = createServerFn({ method: "GET" }).handler(async () => {
  assertAdmin();
  const q = db();
  try {
    const [rev] = await q`
      SELECT
        coalesce(sum(total_amount), 0)::int AS total_revenue,
        count(*)::int AS total_orders,
        coalesce(count(*) FILTER (WHERE status = 'Delivered'), 0)::int AS delivered_orders,
        coalesce(count(*) FILTER (WHERE status = 'Pending'), 0)::int AS pending_orders,
        coalesce(avg(total_amount), 0)::int AS avg_order_value
      FROM orders
    `;

    const topProducts = await q`
      SELECT
        product_name,
        sum(quantity)::int AS total_qty,
        sum(quantity * price)::int AS total_sales
      FROM order_items
      GROUP BY product_name
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
        sum(total_amount)::int AS revenue
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
