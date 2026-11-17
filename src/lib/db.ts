import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;

export const sql = DATABASE_URL
  ? postgres(DATABASE_URL, { ssl: "require", max: 10, idle_timeout: 20, connect_timeout: 10, onnotice: () => {} })
  : (null as unknown as ReturnType<typeof postgres>);

export async function initDb() {
  if (!sql) return;
  console.log("Initializing database tables...");
  try {
    // 1. Users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        picture TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // 2. Categories table
    await sql`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        icon TEXT NOT NULL,
        image_url TEXT
      )
    `;

    // 3. Products table
    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        brand TEXT NOT NULL,
        weight TEXT NOT NULL,
        price INTEGER NOT NULL,
        old_price INTEGER,
        rating NUMERIC(3, 1) DEFAULT 5.0,
        reviews INTEGER DEFAULT 0,
        discount INTEGER DEFAULT 0,
        emoji TEXT NOT NULL DEFAULT '🌾',
        stock BOOLEAN DEFAULT TRUE,
        category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
        wholesale_price INTEGER,
        wholesale_min_qty INTEGER DEFAULT 1,
        image_url TEXT
      )
    `;

    // 4. Brands table
    await sql`
      CREATE TABLE IF NOT EXISTS brands (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        image_url TEXT
      )
    `;

    // 5. Orders table
    await sql`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        customer_email TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        customer_phone TEXT,
        shipping_address TEXT NOT NULL,
        total_amount INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'Pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // 6. Order Items table
    await sql`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
        product_name TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        price INTEGER NOT NULL
      )
    `;

    // 7. Verification Codes table (OTP login)
    await sql`
      CREATE TABLE IF NOT EXISTS verification_codes (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL,
        code TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL
      )
    `;

    // Alterations in case tables existed prior
    await sql`ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_url TEXT`;
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT`;
    await sql`ALTER TABLE brands ADD COLUMN IF NOT EXISTS image_url TEXT`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL`;


    // Alterations for Google authentication & Customer Profile customization
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number TEXT`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS shipping_address TEXT`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS billing_address TEXT`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Pakistan'`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS city TEXT`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS state TEXT`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS postal_code TEXT`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS reward_points INTEGER DEFAULT 0`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT FALSE`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS newsletter_subscription BOOLEAN DEFAULT FALSE`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'Active'`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS device_info TEXT`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS browser_info TEXT`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS operating_system TEXT`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_ip TEXT`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`;

    // 8. Sessions Table
    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        device_id TEXT,
        browser TEXT,
        ip_address TEXT,
        login_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        active BOOLEAN DEFAULT TRUE
      )
    `;

    // 9. User Addresses Table (Support multiple shipping/billing addresses)
    await sql`
      CREATE TABLE IF NOT EXISTS user_addresses (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL, -- 'shipping' or 'billing'
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        address_line1 TEXT NOT NULL,
        address_line2 TEXT,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        postal_code TEXT NOT NULL,
        country TEXT NOT NULL DEFAULT 'Pakistan',
        phone TEXT NOT NULL,
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // 10. Payment Methods Table
    await sql`
      CREATE TABLE IF NOT EXISTS payment_methods (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        provider TEXT NOT NULL,
        token TEXT NOT NULL,
        last_four TEXT NOT NULL,
        card_brand TEXT NOT NULL,
        expiry TEXT NOT NULL,
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // 11. Login History Table
    await sql`
      CREATE TABLE IF NOT EXISTS login_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        login_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        ip_address TEXT,
        device TEXT,
        browser TEXT,
        status TEXT NOT NULL
      )
    `;

    // 12. Notifications Table
    await sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // 13. Audit Logs Table
    await sql`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        action TEXT NOT NULL,
        ip_address TEXT,
        details TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // 14. Reviews Table
    await sql`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // 15. Support Tickets Table
    await sql`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Open',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // 16. Rewards History Table
    await sql`
      CREATE TABLE IF NOT EXISTS rewards_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        points INTEGER NOT NULL,
        action TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // 17. Coupons Table
    await sql`
      CREATE TABLE IF NOT EXISTS coupons (
        id SERIAL PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        discount_percent INTEGER NOT NULL,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // 18. Coupon Usages Table
    await sql`
      CREATE TABLE IF NOT EXISTS coupon_usages (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        coupon_id INTEGER NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // 19. Cart Items Table (Support guest checkout)
    await sql`
      CREATE TABLE IF NOT EXISTS cart_items (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        guest_session_id TEXT,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT user_or_guest CHECK (user_id IS NOT NULL OR guest_session_id IS NOT NULL),
        UNIQUE(user_id, product_id),
        UNIQUE(guest_session_id, product_id)
      )
    `;

    // One cart line per product option (e.g. Cashews Plain vs Roasted).
    await sql`ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS variant TEXT NOT NULL DEFAULT ''`;
    await sql`ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS cart_items_user_id_product_id_key`;
    await sql`ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS cart_items_guest_session_id_product_id_key`;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS cart_items_user_line ON cart_items (user_id, product_id, variant)`;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS cart_items_guest_line ON cart_items (guest_session_id, product_id, variant)`;
    // The roasted cashews used to be a separate product; it is now the "Roasted & Salted" option of Cashews (id 2).
    await sql`UPDATE products SET status = 'draft' WHERE id = 5 AND name = 'Cashews' AND image_url = '/products/kaju-roasted.jpg'`;

    // 20. Wishlist Items Table
    await sql`
      CREATE TABLE IF NOT EXISTS wishlist_items (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, product_id)
      )
    `;

    // 21. Recently Viewed Table (Support guest and user views)
    await sql`
      CREATE TABLE IF NOT EXISTS recently_viewed (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        guest_session_id TEXT,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT user_or_guest_rv CHECK (user_id IS NOT NULL OR guest_session_id IS NOT NULL),
        UNIQUE(user_id, product_id),
        UNIQUE(guest_session_id, product_id)
      )
    `;

    await sql`ALTER TABLE categories ADD COLUMN IF NOT EXISTS name_ur TEXT`;
    await sql`ALTER TABLE categories ADD COLUMN IF NOT EXISTS position INTEGER NOT NULL DEFAULT 0`;
    await sql`ALTER TABLE categories ALTER COLUMN icon SET DEFAULT ''`;
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS name_ur TEXT`;
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS origin TEXT`;
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT`;
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'`;
    await sql`ALTER TABLE products ALTER COLUMN price DROP NOT NULL`;
    await sql`ALTER TABLE products ALTER COLUMN weight DROP NOT NULL`;
    await sql`ALTER TABLE products ALTER COLUMN brand SET DEFAULT 'Nadeem Traders'`;

    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number TEXT`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier TEXT DEFAULT 'PostEx'`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_notes TEXT`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code TEXT`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount INTEGER DEFAULT 0`;

    await sql`ALTER TABLE coupons ADD COLUMN IF NOT EXISTS min_order_amount INTEGER DEFAULT 0`;
    await sql`ALTER TABLE coupons ADD COLUMN IF NOT EXISTS times_used INTEGER DEFAULT 0`;

    await sql`
      CREATE TABLE IF NOT EXISTS store_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // Normalize commodity names
    try {
      await sql`UPDATE products SET name = 'Walnuts', name_ur = 'اخروٹ' WHERE name ILIKE '%Without Cap%' OR name ILIKE '%walnut%' OR name ILIKE '%akhrot%'`;
      await sql`UPDATE products SET name = 'Black Pepper', name_ur = 'کالی مرچ' WHERE name ILIKE '%black pepper%' OR name ILIKE '%kaali mirch%'`;
      await sql`UPDATE products SET name = 'Garam Masala', name_ur = 'گرم مصالحہ' WHERE name ILIKE '%garam masala%'`;
      await sql`UPDATE products SET name = 'Pistachios', name_ur = 'پستہ' WHERE name ILIKE '%pista%' OR name ILIKE '%pistachio%'`;
      await sql`UPDATE products SET name = 'Cashews', name_ur = 'کاجو' WHERE name ILIKE '%kaju%' OR name ILIKE '%cashew%'`;
      await sql`UPDATE products SET name = 'Chilli Flakes', name_ur = 'دڑا مرچ' WHERE name ILIKE '%dara mirch%' OR name ILIKE '%chilli flakes%'`;
      await sql`UPDATE products SET name = 'Round Red Chilli', name_ur = 'گول مرچ' WHERE name ILIKE '%gol mirch%'`;
      await sql`UPDATE products SET name = 'Cumin Seeds', name_ur = 'زیرہ' WHERE name ILIKE '%zeera%' OR name ILIKE '%cumin%'`;
      await sql`UPDATE products SET name_ur = 'جئی' WHERE name ILIKE '%oats%'`;
    } catch {}

    await seedCatalogIfEmpty();

    console.log("Tables created/altered successfully.");

  } catch (error) {
    console.error("Failed to initialize database:", error);
    throw error;
  }
}

async function seedCatalogIfEmpty() {
  const [{ n }] = await sql`SELECT count(*)::int AS n FROM categories`;
  if (n > 0) return;
  const { CATALOG_CATEGORIES, CATALOG_PRODUCTS } = await import("./catalog");
  await sql.begin(async (tx) => {
    const idMap = new Map<number, number>();
    for (const [position, c] of CATALOG_CATEGORIES.entries()) {
      const [row] = await tx`
        INSERT INTO categories (name, name_ur, icon, image_url, position)
        VALUES (${c.name}, ${c.name_ur}, '', ${c.image_url}, ${position})
        RETURNING id
      `;
      idMap.set(c.id, row.id);
    }
    for (const p of CATALOG_PRODUCTS) {
      await tx`
        INSERT INTO products (name, name_ur, origin, brand, weight, price, emoji, stock, status, category_id, image_url)
        VALUES (${p.name}, ${p.name_ur}, ${p.origin}, ${p.brand}, ${p.weight}, ${p.price}, '', true, 'active',
                ${idMap.get(p.category_id)!}, ${p.image_url})
      `;
    }
  });
  console.log("Seeded catalog with", CATALOG_PRODUCTS.length, "products.");
}
