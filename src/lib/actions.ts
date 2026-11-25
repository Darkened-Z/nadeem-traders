import { createServerFn } from "@tanstack/react-start";
import { sql } from "./db";
import { CATALOG_CATEGORIES, CATALOG_PRODUCTS, cleanProductTitle, type ProductOption } from "./catalog";
import { assertAdmin } from "./admin";
import { assertOrderStatus } from "./order-status";
import { Resend } from "resend";
import { OAuth2Client } from "google-auth-library";
import crypto from "crypto";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const oauthClient = new OAuth2Client(GOOGLE_CLIENT_ID);



// Helper to send order status emails
async function sendOrderStatusEmail(
  orderId: number,
  customerName: string,
  customerEmail: string,
  status: string,
  totalAmount: number,
  items: Array<{ name: string; quantity: number; price: number }>
) {
  const itemsHtml = items
    .map(
      (item) =>
        `<li>${item.name} x ${item.quantity} - Rs. ${(
          item.price * item.quantity
        ).toLocaleString()}</li>`
    )
    .join("");

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #fdfdfd;">
      <div style="background-color: #047857; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">Nadeem Traders</h1>
        <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Order Update</p>
      </div>
      <div style="padding: 20px; color: #333333; line-height: 1.6;">
        <p>Dear <strong>${customerName}</strong>,</p>
        <p>Your order <strong>#${orderId}</strong> status has been updated to: <span style="background-color: #d1fae5; color: #065f46; padding: 4px 8px; border-radius: 6px; font-weight: bold; font-size: 14px;">${status}</span></p>
        
        <h3 style="border-bottom: 2px solid #f3f4f6; padding-bottom: 8px; margin-top: 24px;">Order Summary</h3>
        <ul style="padding-left: 20px; margin-top: 10px;">
          ${itemsHtml}
        </ul>
        <p style="font-size: 16px; font-weight: bold; margin-top: 20px;">Total Amount: <span style="color: #047857;">Rs. ${totalAmount.toLocaleString()}</span></p>
        
        <div style="margin-top: 30px; padding: 15px; background-color: #f9fafb; border-radius: 8px; font-size: 12px; color: #6b7280; border-left: 4px solid #047857;">
          <strong>Order Tracking:</strong> You can track this order live on our website using Order ID: <strong>${orderId}</strong>.
          <br/><br/>
          <em style="font-size: 11px;">* Note: This email was sent to your registered address: ${customerEmail}</em>
        </div>
      </div>
      <div style="text-align: center; padding: 15px; font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6; margin-top: 30px;">
        &copy; ${new Date().getFullYear()} Nadeem Traders. Commercial Hub, Punjab, Pakistan.
      </div>
    </div>
  `;

  try {
    await resend?.emails.send({
      from: "Nadeem Traders <onboarding@resend.dev>",
      to: customerEmail,
      subject: `[Order #${orderId}] Status Update: ${status}`,
      html: emailHtml,
    });
    console.log(`Email successfully sent for Order #${orderId} to ${customerEmail} with status ${status}`);
  } catch (err) {
    console.error(`Failed to send order email to ${customerEmail} via Resend:`, err);
  }

  // Admin / Store Owner Notification
  try {
    const adminEmail = process.env.ADMIN_EMAIL || "technicalsubhan7801@gmail.com";
    await resend?.emails.send({
      from: "Nadeem Traders <onboarding@resend.dev>",
      to: adminEmail,
      subject: `[Admin Alert - Order #${orderId}] Status: ${status}`,
      html: `<div style="background: #fff3cd; color: #856404; padding: 12px; border: 1px solid #ffeeba; border-radius: 6px; margin-bottom: 20px;">
        <strong>Admin Notification:</strong> This is a copy of the customer notification sent to the store owner.
      </div>` + emailHtml,
    });
    console.log(`Admin copy successfully sent to ${adminEmail} for Order #${orderId}`);
  } catch (err) {
    console.error(`Failed to send admin order email copy via Resend:`, err);
  }
}

// Helper to verify Google ID Token
async function verifyGoogleIdToken(token: string) {
  try {
    const ticket = await oauthClient.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload) throw new Error("No payload returned from Google");
    return payload;
  } catch (err) {
    console.error("Google token verification failed:", err);
    throw new Error("Invalid Google sign-in credentials.");
  }
}

// Audit log helper
async function createAuditLog(userId: number | null, action: string, ip: string | null, details: string) {
  try {
    await sql`
      INSERT INTO audit_logs (user_id, action, ip_address, details)
      VALUES (${userId}, ${action}, ${ip}, ${details})
    `;
  } catch (e) {
    console.error("Failed to write audit log:", e);
  }
}

// 0. Complete Google Authentication
export const loginWithGoogleCredential = createServerFn({ method: "POST" })
  .validator((data: { credential: string; deviceInfo?: string; browser?: string; os?: string }) => data)
  .handler(async ({ data: input }) => {
    const { setSessionToken, clearGuestToken, getGuestToken, getClientIp } = await import("./server-cookies");
    const data = { ...input, ip: getClientIp(), guestSessionId: await getGuestToken() };
    // 1. Verify token securely
    const payload = await verifyGoogleIdToken(data.credential);
    const email = payload.email!;
    const googleId = payload.sub;
    const name = payload.name!;
    const firstName = payload.given_name || "";
    const lastName = payload.family_name || "";
    const picture = payload.picture || "";
    const emailVerified = payload.email_verified || false;

    // 2. Check if user already exists
    let user;
    const existing = await sql`
      SELECT * FROM users WHERE google_id = ${googleId} OR email = ${email}
    `;

    if (existing.length > 0) {
      user = existing[0];
      // If user had email OTP before, update their google_id
      if (!user.google_id) {
        await sql`
          UPDATE users SET google_id = ${googleId}, updated_at = NOW() WHERE id = ${user.id}
        `;
        user.google_id = googleId;
      }
    } else {
      // 3. Register new user
      const result = await sql`
        INSERT INTO users (google_id, email, name, first_name, last_name, picture, email_verified, reward_points)
        VALUES (${googleId}, ${email}, ${name}, ${firstName}, ${lastName}, ${picture}, ${emailVerified}, 100) -- give 100 welcome reward points
        RETURNING *
      `;
      user = result[0];
      // Log account creation
      await createAuditLog(user.id, "Account Created", data.ip || null, `User registered using Google OAuth: ${email}`);
      
      // Seed first notification
      await sql`
        INSERT INTO notifications (user_id, title, message)
        VALUES (${user.id}, 'Welcome to Nadeem Traders!', 'Thank you for registering. You have been awarded 100 welcome reward points! Start shopping and explore our fresh catalog.')
      `;
      // Seed welcome rewards history
      await sql`
        INSERT INTO rewards_history (user_id, points, action, description)
        VALUES (${user.id}, 100, 'Earned', 'Welcome bonus reward points')
      `;
    }

    // 4. Check if account is Disabled
    if (user.account_status === "Disabled") {
      await createAuditLog(user.id, "Blocked Login Attempt", data.ip || null, `Attempted login on disabled account: ${email}`);
      throw new Error("Your account has been disabled by an administrator.");
    }

    // 5. Update user activity & login metadata
    await sql`
      UPDATE users SET 
        picture = ${picture},
        name = ${name},
        first_name = ${firstName},
        last_name = ${lastName},
        email_verified = ${emailVerified},
        device_info = ${data.deviceInfo || null},
        browser_info = ${data.browser || null},
        operating_system = ${data.os || null},
        last_ip = ${data.ip || null},
        last_login = NOW(),
        last_activity = NOW(),
        updated_at = NOW()
      WHERE id = ${user.id}
    `;

    // 6. Log login event
    await sql`
      INSERT INTO login_history (user_id, ip_address, device, browser, status)
      VALUES (${user.id}, ${data.ip || null}, ${data.os || null}, ${data.browser || null}, 'Success')
    `;
    await createAuditLog(user.id, "Login", data.ip || null, `Logged in successfully via Google OAuth from ${data.os || 'Unknown OS'}`);

    // 7. Session Rotation: delete any previous active session tokens on this device or just create new session token
    const sessionToken = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days session

    await sql`
      INSERT INTO sessions (id, user_id, device_id, browser, ip_address, expires_at)
      VALUES (${sessionToken}, ${user.id}, ${data.os || null}, ${data.browser || null}, ${data.ip || null}, ${expiresAt})
    `;

    // 8. Set HTTP-only, secure, SameSite=Lax cookie
    await setSessionToken(sessionToken, expiresAt);

    // 9. Preserving guest cart & guest recently viewed
    if (data.guestSessionId) {
      // Merge guest cart items into user cart
      const guestCart = await sql`SELECT * FROM cart_items WHERE guest_session_id = ${data.guestSessionId}`;
      for (const item of guestCart) {
        await sql`
          INSERT INTO cart_items (user_id, product_id, variant, quantity)
          VALUES (${user.id}, ${item.product_id}, ${item.variant}, ${item.quantity})
          ON CONFLICT (user_id, product_id, variant)
          DO UPDATE SET quantity = LEAST(cart_items.quantity + EXCLUDED.quantity, 999)
        `;
      }
      await sql`DELETE FROM cart_items WHERE guest_session_id = ${data.guestSessionId}`;

      // Merge recently viewed
      const guestRV = await sql`SELECT * FROM recently_viewed WHERE guest_session_id = ${data.guestSessionId}`;
      for (const item of guestRV) {
        await sql`
          INSERT INTO recently_viewed (user_id, product_id, viewed_at)
          VALUES (${user.id}, ${item.product_id}, ${item.viewed_at})
          ON CONFLICT (user_id, product_id)
          DO UPDATE SET viewed_at = GREATEST(recently_viewed.viewed_at, EXCLUDED.viewed_at)
        `;
      }
      await sql`DELETE FROM recently_viewed WHERE guest_session_id = ${data.guestSessionId}`;

      await clearGuestToken();
    }

    return { success: true, user };
  });

// Restore persistent user session
export const restoreSession = createServerFn({ method: "POST" }).handler(async () => {
  if (!sql) return null;
  const { getSessionToken, clearSessionToken } = await import("./server-cookies");
  const token = await getSessionToken();
  if (!token) return null;

  const sessionResult = await sql`
    SELECT * FROM sessions 
    WHERE id = ${token} AND active = TRUE AND expires_at > NOW()
  `;

  if (sessionResult.length === 0) {
    await clearSessionToken();
    return null;
  }

  const session = sessionResult[0];
  const userResult = await sql`
    SELECT * FROM users WHERE id = ${session.user_id}
  `;

  if (userResult.length === 0 || userResult[0].account_status === "Disabled") {
    // If account was disabled in database, force destroy session
    await sql`UPDATE sessions SET active = FALSE WHERE id = ${token}`;
    await clearSessionToken();
    return null;
  }

  const user = userResult[0];
  await sql`
    UPDATE users SET last_activity = NOW() WHERE id = ${user.id}
  `;

  return { success: true, user };
});

// Logout customer
export const logoutCustomer = createServerFn({ method: "POST" }).handler(async () => {
  const { getSessionToken, clearSessionToken } = await import("./server-cookies");
  const token = await getSessionToken();
  if (token) {
    const sessionResult = await sql`
      SELECT * FROM sessions WHERE id = ${token}
    `;
    if (sessionResult.length > 0) {
      const session = sessionResult[0];
      await sql`UPDATE sessions SET active = FALSE WHERE id = ${token}`;
      await createAuditLog(session.user_id, "Logout", session.ip_address, "Customer logged out explicitly");
    }
    await clearSessionToken();
  }
  return { success: true };
});

// Guest token initialization
export const getOrCreateGuestSession = createServerFn({ method: "POST" }).handler(async () => {
  const { getGuestToken, setGuestToken } = await import("./server-cookies");
  let guestToken = await getGuestToken();
  if (!guestToken) {
    guestToken = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
    await setGuestToken(guestToken);
  }
  return { guestSessionId: guestToken };
});

// Every user-scoped action derives its identity from the httpOnly session/guest cookies, never from client input.
async function cartOwner() {
  const { resolveUserOrGuest } = await import("./server-cookies");
  return resolveUserOrGuest();
}

async function sessionUserId() {
  const { requireSessionUserId } = await import("./server-cookies");
  return requireSessionUserId();
}

async function optionsByProduct(productIds: number[]): Promise<Map<number, ProductOption[]>> {
  const map = new Map<number, ProductOption[]>();
  if (productIds.length === 0) return map;
  const rows = await sql`
    SELECT product_id, name, short_name, name_ur, price, weight, image_url FROM product_variants
    WHERE product_id = ANY(${productIds})
    ORDER BY position, id
  `;
  for (const r of rows) {
    const list = map.get(r.product_id) ?? [];
    list.push({ name: r.name, short_name: r.short_name, name_ur: r.name_ur, price: r.price, weight: r.weight, image_url: r.image_url });
    map.set(r.product_id, list);
  }
  return map;
}

// A product with options always sells as one of them; unknown or missing choices fall back to the first.
function pickOption(options: ProductOption[] | undefined, variant?: string | null): ProductOption | null {
  if (!options || options.length === 0) return null;
  return options.find((o) => o.name === variant) ?? options[0];
}

function assertQuantity(quantity: number) {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 999) {
    throw new Error("Invalid quantity");
  }
}

// Shopping Cart Actions
export const getCartItems = createServerFn({ method: "POST" }).handler(async () => {
  if (!sql) return [];
  const { userId, guestSessionId } = await cartOwner();
  const rows = userId
    ? await sql`
        SELECT c.id as cart_item_id, c.quantity, c.variant, p.*, cat.name as category_name
        FROM cart_items c
        JOIN products p ON c.product_id = p.id
        LEFT JOIN categories cat ON p.category_id = cat.id
        WHERE c.user_id = ${userId}
      `
    : await sql`
        SELECT c.id as cart_item_id, c.quantity, c.variant, p.*, cat.name as category_name
        FROM cart_items c
        JOIN products p ON c.product_id = p.id
        LEFT JOIN categories cat ON p.category_id = cat.id
        WHERE c.guest_session_id = ${guestSessionId!}
      `;
  const options = await optionsByProduct([...new Set(rows.map((r) => r.id as number))]);
  return rows.map((r: Record<string, any>) => {
    const option = pickOption(options.get(r.id), r.variant);
    return {
      ...r,
      variant: option?.name ?? "",
      price: option ? option.price : r.price,
      weight: option?.weight ?? r.weight,
      image_url: option?.image_url ?? r.image_url,
    };
  });
});

export const addToCartDb = createServerFn({ method: "POST" })
  .validator((data: { productId: number; variant?: string; quantity: number }) => data)
  .handler(async ({ data }) => {
    if (!sql) return { success: true };
    assertQuantity(data.quantity);
    const [product] = await sql`SELECT id FROM products WHERE id = ${data.productId}`;
    if (!product) throw new Error("Product not found");
    const options = await optionsByProduct([product.id]);
    const variant = pickOption(options.get(product.id), data.variant)?.name ?? "";
    const { userId, guestSessionId } = await cartOwner();
    if (userId) {
      await sql`
        INSERT INTO cart_items (user_id, product_id, variant, quantity)
        VALUES (${userId}, ${data.productId}, ${variant}, ${data.quantity})
        ON CONFLICT (user_id, product_id, variant)
        DO UPDATE SET quantity = LEAST(cart_items.quantity + EXCLUDED.quantity, 999)
      `;
    } else {
      await sql`
        INSERT INTO cart_items (guest_session_id, product_id, variant, quantity)
        VALUES (${guestSessionId!}, ${data.productId}, ${variant}, ${data.quantity})
        ON CONFLICT (guest_session_id, product_id, variant)
        DO UPDATE SET quantity = LEAST(cart_items.quantity + EXCLUDED.quantity, 999)
      `;
    }
    return { success: true };
  });

export const updateCartItemQuantityDb = createServerFn({ method: "POST" })
  .validator((data: { productId: number; variant?: string; quantity: number }) => data)
  .handler(async ({ data }) => {
    if (!sql) return { success: true };
    assertQuantity(data.quantity);
    const variant = data.variant ?? "";
    const { userId, guestSessionId } = await cartOwner();
    if (userId) {
      await sql`
        UPDATE cart_items SET quantity = ${data.quantity}
        WHERE user_id = ${userId} AND product_id = ${data.productId} AND variant = ${variant}
      `;
    } else {
      await sql`
        UPDATE cart_items SET quantity = ${data.quantity}
        WHERE guest_session_id = ${guestSessionId!} AND product_id = ${data.productId} AND variant = ${variant}
      `;
    }
    return { success: true };
  });

export const removeFromCartDb = createServerFn({ method: "POST" })
  .validator((data: { productId: number; variant?: string }) => data)
  .handler(async ({ data }) => {
    if (!sql) return { success: true };
    const variant = data.variant ?? "";
    const { userId, guestSessionId } = await cartOwner();
    if (userId) {
      await sql`DELETE FROM cart_items WHERE user_id = ${userId} AND product_id = ${data.productId} AND variant = ${variant}`;
    } else {
      await sql`DELETE FROM cart_items WHERE guest_session_id = ${guestSessionId!} AND product_id = ${data.productId} AND variant = ${variant}`;
    }
    return { success: true };
  });

export const clearCartDb = createServerFn({ method: "POST" }).handler(async () => {
  if (!sql) return { success: true };
  const { userId, guestSessionId } = await cartOwner();
  if (userId) {
    await sql`DELETE FROM cart_items WHERE user_id = ${userId}`;
  } else {
    await sql`DELETE FROM cart_items WHERE guest_session_id = ${guestSessionId!}`;
  }
  return { success: true };
});

// Wishlist Actions
export const getWishlist = createServerFn({ method: "POST" }).handler(async () => {
  const userId = await sessionUserId();
  return await sql`
    SELECT w.id as wishlist_item_id, p.*, cat.name as category_name
    FROM wishlist_items w
    JOIN products p ON w.product_id = p.id
    LEFT JOIN categories cat ON p.category_id = cat.id
    WHERE w.user_id = ${userId}
  `;
});

export const toggleWishlistDb = createServerFn({ method: "POST" })
  .validator((data: { productId: number }) => data)
  .handler(async ({ data }) => {
    const userId = await sessionUserId();
    const removed = await sql`
      DELETE FROM wishlist_items WHERE user_id = ${userId} AND product_id = ${data.productId} RETURNING id
    `;
    if (removed.length > 0) return { success: true, wishlisted: false };
    await sql`INSERT INTO wishlist_items (user_id, product_id) VALUES (${userId}, ${data.productId})`;
    return { success: true, wishlisted: true };
  });

// Recently Viewed Actions
export const recordRecentlyViewedDb = createServerFn({ method: "POST" })
  .validator((data: { productId: number }) => data)
  .handler(async ({ data }) => {
    const { userId, guestSessionId } = await cartOwner();
    if (userId) {
      await sql`
        INSERT INTO recently_viewed (user_id, product_id, viewed_at)
        VALUES (${userId}, ${data.productId}, NOW())
        ON CONFLICT (user_id, product_id)
        DO UPDATE SET viewed_at = NOW()
      `;
    } else {
      await sql`
        INSERT INTO recently_viewed (guest_session_id, product_id, viewed_at)
        VALUES (${guestSessionId!}, ${data.productId}, NOW())
        ON CONFLICT (guest_session_id, product_id)
        DO UPDATE SET viewed_at = NOW()
      `;
    }
    return { success: true };
  });

export const getRecentlyViewed = createServerFn({ method: "POST" }).handler(async () => {
  const { userId, guestSessionId } = await cartOwner();
  if (userId) {
    return await sql`
      SELECT rv.viewed_at, p.*, cat.name as category_name
      FROM recently_viewed rv
      JOIN products p ON rv.product_id = p.id
      LEFT JOIN categories cat ON p.category_id = cat.id
      WHERE rv.user_id = ${userId}
      ORDER BY rv.viewed_at DESC
      LIMIT 12
    `;
  }
  return await sql`
    SELECT rv.viewed_at, p.*, cat.name as category_name
    FROM recently_viewed rv
    JOIN products p ON rv.product_id = p.id
    LEFT JOIN categories cat ON p.category_id = cat.id
    WHERE rv.guest_session_id = ${guestSessionId!}
    ORDER BY rv.viewed_at DESC
    LIMIT 12
  `;
});

// Address Book Actions
export const getUserAddresses = createServerFn({ method: "POST" }).handler(async () => {
  const userId = await sessionUserId();
  return await sql`
    SELECT * FROM user_addresses WHERE user_id = ${userId} ORDER BY is_default DESC, id DESC
  `;
});

export const addUserAddressDb = createServerFn({ method: "POST" })
  .validator((data: {
    type: string;
    firstName: string;
    lastName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
    isDefault: boolean;
  }) => data)
  .handler(async ({ data }) => {
    const userId = await sessionUserId();
    if (data.isDefault) {
      await sql`
        UPDATE user_addresses SET is_default = FALSE WHERE user_id = ${userId} AND type = ${data.type}
      `;
    }
    await sql`
      INSERT INTO user_addresses (user_id, type, first_name, last_name, address_line1, address_line2, city, state, postal_code, country, phone, is_default)
      VALUES (${userId}, ${data.type}, ${data.firstName}, ${data.lastName}, ${data.addressLine1}, ${data.addressLine2 || null}, ${data.city}, ${data.state}, ${data.postalCode}, ${data.country}, ${data.phone}, ${data.isDefault})
    `;
    return { success: true };
  });

export const deleteUserAddressDb = createServerFn({ method: "POST" })
  .validator((data: { addressId: number }) => data)
  .handler(async ({ data }) => {
    const userId = await sessionUserId();
    await sql`DELETE FROM user_addresses WHERE id = ${data.addressId} AND user_id = ${userId}`;
    return { success: true };
  });

// Preference Actions
export const updateUserPreferences = createServerFn({ method: "POST" })
  .validator((data: { marketingConsent: boolean; newsletterSubscription: boolean; phone?: string }) => data)
  .handler(async ({ data }) => {
    const userId = await sessionUserId();
    await sql`
      UPDATE users SET
        marketing_consent = ${data.marketingConsent},
        newsletter_subscription = ${data.newsletterSubscription},
        phone_number = ${data.phone || null},
        updated_at = NOW()
      WHERE id = ${userId}
    `;
    return { success: true };
  });

// Reviews Actions
export const submitReview = createServerFn({ method: "POST" })
  .validator((data: { productId: number; rating: number; comment: string }) => data)
  .handler(async ({ data }) => {
    const userId = await sessionUserId();
    if (!Number.isInteger(data.rating) || data.rating < 1 || data.rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }
    const result = await sql`
      INSERT INTO reviews (user_id, product_id, rating, comment)
      VALUES (${userId}, ${data.productId}, ${data.rating}, ${data.comment})
      RETURNING *
    `;

    const reviewsResult = await sql`
      SELECT count(*), avg(rating) FROM reviews WHERE product_id = ${data.productId}
    `;
    const count = parseInt(reviewsResult[0].count);
    const avgRating = parseFloat(reviewsResult[0].avg || "5.0");

    await sql`
      UPDATE products SET
        reviews = ${count},
        rating = ${parseFloat(avgRating.toFixed(1))}
      WHERE id = ${data.productId}
    `;

    return result[0];
  });

export const getProductReviews = createServerFn({ method: "POST" })
  .validator((data: { productId: number }) => data)
  .handler(async ({ data }) => {
    return await sql`
      SELECT r.*, u.name as user_name, u.picture as user_picture
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ${data.productId}
      ORDER BY r.created_at DESC
    `;
  });

// Support Ticket Actions
export const getSupportTickets = createServerFn({ method: "POST" }).handler(async () => {
  const userId = await sessionUserId();
  return await sql`SELECT * FROM support_tickets WHERE user_id = ${userId} ORDER BY id DESC`;
});

export const createSupportTicket = createServerFn({ method: "POST" })
  .validator((data: { subject: string; message: string }) => data)
  .handler(async ({ data }) => {
    const userId = await sessionUserId();
    await sql`
      INSERT INTO support_tickets (user_id, subject, message)
      VALUES (${userId}, ${data.subject}, ${data.message})
    `;
    return { success: true };
  });

// Notifications Actions
export const getUserNotifications = createServerFn({ method: "POST" }).handler(async () => {
  const userId = await sessionUserId();
  return await sql`SELECT * FROM notifications WHERE user_id = ${userId} ORDER BY id DESC`;
});

export const markNotificationRead = createServerFn({ method: "POST" })
  .validator((data: { notificationId: number }) => data)
  .handler(async ({ data }) => {
    const userId = await sessionUserId();
    await sql`
      UPDATE notifications SET is_read = TRUE
      WHERE id = ${data.notificationId} AND user_id = ${userId}
    `;
    return { success: true };
  });

// Coupons & Rewards Actions
export const getCoupons = createServerFn({ method: "GET" }).handler(async () => {
  await sessionUserId();
  return await sql`
    SELECT code, discount_percent, min_order_amount FROM coupons WHERE active = TRUE ORDER BY discount_percent DESC
  `;
});

export const getCustomerDashboardStats = createServerFn({ method: "POST" }).handler(async () => {
  const userId = await sessionUserId();
  const userResult = await sql`
    SELECT created_at, reward_points, last_login FROM users WHERE id = ${userId}
  `;

  const ordersResult = await sql`
    SELECT status, count(*), sum(total_amount) as total_spent FROM orders 
    WHERE user_id = ${userId} 
    GROUP BY status
  `;

  const wishlistCountResult = await sql`
    SELECT count(*) FROM wishlist_items WHERE user_id = ${userId}
  `;

  const stats = {
    memberSince: userResult[0]?.created_at || new Date(),
    rewardPoints: userResult[0]?.reward_points || 0,
    lastLogin: userResult[0]?.last_login || new Date(),
    wishlistCount: parseInt(wishlistCountResult[0]?.count || "0"),
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    returnedOrders: 0,
    totalSpending: 0
  };

  ordersResult.forEach(row => {
    const count = parseInt(row.count);
    stats.totalOrders += count;
    if (row.status !== "Cancelled") stats.totalSpending += parseFloat(row.total_spent || "0");
    if (row.status === "Pending") stats.pendingOrders = count;
    else if (row.status === "Completed" || row.status === "Delivered") stats.completedOrders = count;
    else if (row.status === "Cancelled") stats.cancelledOrders = count;
    else if (row.status === "Returned") stats.returnedOrders = count;
  });

  return stats;
});

export const getCustomerLoginHistory = createServerFn({ method: "POST" }).handler(async () => {
  const userId = await sessionUserId();
  return await sql`
    SELECT * FROM login_history WHERE user_id = ${userId} ORDER BY id DESC LIMIT 20
  `;
});

export const getCustomerAuditLogs = createServerFn({ method: "POST" }).handler(async () => {
  const userId = await sessionUserId();
  return await sql`
    SELECT * FROM audit_logs WHERE user_id = ${userId} ORDER BY id DESC LIMIT 20
  `;
});

const PRODUCT_IMAGE_FALLBACKS: Record<string, string> = {
  "Almonds": "/products/almonds.jpg",
  "Premium Almonds": "/products/almonds.jpg",
  "Cashews": "/products/cashews.jpg",
  "Cashew Nuts": "/products/cashews.jpg",
  "Roasted Cashews": "/products/cashews.jpg",
  "Cashews Premium": "/products/cashews.jpg",
  "Cashews (Kaju)": "/products/cashews.jpg",
  "Kaju (Roasted, Plain)": "/products/cashews.jpg",
  "Walnuts": "/products/walnuts.jpg",
  "Walnuts (Akhrot)": "/products/walnuts.jpg",
  "Walnuts (Akhrot, Without Cap)": "/products/walnut-kernels.jpg",
  "Walnut Kernels": "/products/walnut-kernels.jpg",
  "Pistachios": "/products/pista.jpg",
  "Pistachios (Pista)": "/products/pista.jpg",
  "Pista (Shell)": "/products/pista.jpg",
  "Pistachio Kernels": "/products/pista-kernels.jpg",
  "Cloves": "/products/cloves.jpg",
  "Cloves (Capped)": "/products/cloves-capped.jpg",
  "Cloves (Uncapped)": "/products/cloves-uncapped.jpg",
  "Pumpkin Seeds": "/products/pumpkin-seeds.jpg",
  "Red Chilli": "/products/red-chilli.jpg",
  "Kashmiri Red Chilli": "/products/red-chilli.jpg",
  "Red Chilli Powder": "/products/red-chilli-powder.jpg",
  "Chilli Flakes": "/products/chilli-flakes.jpg",
  "Round Red Chilli": "/products/gol-mirch.jpg",
  "Turmeric": "/products/haldi-powder.jpg",
  "Haldi Powder": "/products/haldi-powder.jpg",
  "Black Pepper": "/products/black-pepper.jpg",
  "Black Pepper (Kaali Mirch)": "/products/black-pepper.jpg",
  "Black Pepper Powder": "/products/black-pepper.jpg",
  "Garam Masala": "/products/garam-masala.jpg",
  "Garam Masala (Sabat, Powder)": "/products/garam-masala.jpg",
  "Garam Masala Powder": "/products/garam-masala-powder.jpg",
  "Cumin Seeds": "/products/zeera.jpg",
  "Zeera (Cumin)": "/products/zeera.jpg",
  "Zeera Sabit": "/products/zeera.jpg",
  "Masoor Dal": "/products/masoor-dal.jpg",
  "Chana Dal": "/products/chana-dal.jpg",
  "Super Kainat Rice": "/products/kainat-rice.jpg",
  "Sunflower Oil": "/products/sunflower-oil.jpg",
  "Pink Salt": "/products/pink-salt.jpg",
  "White Sugar": "/products/white-sugar.jpg",
  "Kishmish": "/products/kishmish.jpg",
  "Sunflower Seeds": "/products/sunflower-seeds.jpg",
  "Chia Seeds": "/products/chia-seeds.jpg",
  "Sonf": "/products/sonf.jpg",
  "Fennel Seeds": "/products/sonf.jpg",
  "Flax Seeds": "/products/flax-seeds.jpg",
  "Kalonji": "/products/kalonji.jpg",
  "Green Cardamom": "/products/green-cardamom.jpg",
  "Black Cardamom": "/products/black-cardamom.jpg",
  "Oats": "/products/oats.jpg",
  "Ispaghol Chilka": "/products/ispaghol.jpg",
  "Ispaghol": "/products/ispaghol.jpg",
};

const CATEGORY_IMAGE_FALLBACKS: Record<string, string> = {
  "Dry Fruits": "/categories/dry-fruits.jpg",
  "Seeds": "/categories/seeds.jpg",
  "Spices": "/categories/spices.jpg",
  "Whole Spices": "/categories/whole-spices.jpg",
  "Special Items": "/categories/special-items.jpg",
  "Pulses & Lentils": "/categories/pulses-lentils.jpg",
  "Rice & Grains": "/categories/rice-grains.jpg",
  "Cooking Oils": "/categories/cooking-oils.jpg",
  "Sugar & Salt": "/categories/sugar-salt.jpg",
};

// 1. Categories
const MOCK_CATEGORIES = CATALOG_CATEGORIES;
const MOCK_PRODUCTS = CATALOG_PRODUCTS;

const MOCK_BRANDS = [
  { id: 1, name: "Nadeem Traders", image_url: null },
  { id: 2, name: "Punjab Fresh", image_url: null },
  { id: 3, name: "Farm Direct", image_url: null },
];

export const getCategories = createServerFn({ method: "GET" }).handler(
  async () => {
    if (!sql) return MOCK_CATEGORIES;
    const { serverCache } = await import("./server-cache");
    const cached = serverCache.get("categories");
    if (cached) return cached;
    const res = await sql`SELECT * FROM categories ORDER BY position, id`;
    const mapped = (res as any[]).map((c) => {
      if (!c.image_url || c.image_url.includes("wikimedia")) {
        const fb = CATEGORY_IMAGE_FALLBACKS[c.name];
        if (fb) return { ...c, image_url: fb };
      }
      return c;
    });
    serverCache.set("categories", mapped, 30_000);
    return mapped;
  }
);

export const getProducts = createServerFn({ method: "GET" }).handler(
  async () => {
    if (!sql) return MOCK_PRODUCTS;
    const { serverCache } = await import("./server-cache");
    const cached = serverCache.get("products");
    if (cached) return cached;
    const res = await sql`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'active'
      ORDER BY c.position NULLS LAST, c.id, p.id
    `;
    const mapped = (res as any[]).map((p) => {
      let name = cleanProductTitle(p.name);
      let name_ur = p.name_ur;
      if (name === "Walnuts") {
        name_ur = "اخروٹ";
      } else if (name === "Black Pepper") {
        name_ur = "کالی مرچ";
      } else if (name === "Garam Masala") {
        name_ur = "گرم مصالحہ";
      } else if (name === "Pistachios") {
        name_ur = "پستہ";
      } else if (name === "Cashews" || name === "Cashew Nuts" || name === "Roasted Cashews") {
        name_ur = "کاجو";
      } else if (name === "Cumin Seeds") {
        name_ur = "زیرہ";
      } else if (name === "Chilli Flakes") {
        name_ur = "دڑا مرچ";
      } else if (name === "Round Red Chilli") {
        name_ur = "گول مرچ";
      } else if (name === "Oats") {
        name_ur = "جئی";
      }
      let img = p.image_url;
      if (!img || img.includes("wikimedia")) {
        const fb = PRODUCT_IMAGE_FALLBACKS[name] || PRODUCT_IMAGE_FALLBACKS[p.name];
        if (fb) img = fb;
      }
      return { ...p, name, name_ur, image_url: img };
    });
    const options = await optionsByProduct(mapped.map((p) => p.id as number));
    for (const p of mapped) p.variants = options.get(p.id) ?? [];
    serverCache.set("products", mapped, 30_000);
    return mapped;
  }
);

export const getBrands = createServerFn({ method: "GET" }).handler(async () => {
  if (!sql) return MOCK_BRANDS;
  const { serverCache } = await import("./server-cache");
  const cached = serverCache.get("brands");
  if (cached) return cached;
  const res = await sql`SELECT * FROM brands ORDER BY name ASC`;
  serverCache.set("brands", res);
  return res;
});

type CartLineInput = { product_id: number; variant?: string; quantity: number };
type PricedLine = { product_id: number; product_name: string; quantity: number; price: number };

async function priceCart(items: CartLineInput[]): Promise<{ lines: PricedLine[]; subtotal: number }> {
  if (!Array.isArray(items) || items.length === 0) throw new Error("Cart is empty");
  for (const item of items) assertQuantity(item.quantity);
  const ids = [...new Set(items.map((i) => i.product_id))];
  const rows = await sql`
    SELECT id, name, price, stock, status
    FROM products WHERE id = ANY(${ids})
  `;
  const byId = new Map(rows.map((r) => [r.id as number, r]));
  const options = await optionsByProduct(ids);
  const merged = new Map<string, PricedLine>();
  for (const item of items) {
    const p = byId.get(item.product_id);
    const option = p ? pickOption(options.get(p.id), item.variant) : null;
    const price = option ? option.price : p?.price;
    if (!p || p.status !== "active" || p.stock === false || price == null) {
      throw new Error(`${p?.name ?? "A product in your cart"} is not available for online order right now.`);
    }
    const variant = option?.name ?? "";
    const key = `${p.id}|${variant}`;
    const existing = merged.get(key);
    if (existing) {
      existing.quantity += item.quantity;
      assertQuantity(existing.quantity);
      continue;
    }
    const baseName = cleanProductTitle(p.name) || p.name;
    merged.set(key, {
      product_id: p.id,
      product_name: variant ? `${baseName} (${variant})` : baseName,
      quantity: item.quantity,
      price: Number(price),
    });
  }
  const lines = [...merged.values()];
  const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
  return { lines, subtotal };
}

async function resolveCoupon(code: string | undefined, subtotal: number) {
  const rawCode = (code || "").trim().toUpperCase();
  if (!rawCode) return { ok: false as const, message: "Kupon code darj karein" };
  const rows = await sql`SELECT * FROM coupons WHERE UPPER(code) = ${rawCode} LIMIT 1`;
  if (rows.length === 0) return { ok: false as const, message: "Kupon code mojood nahi hai" };
  const coupon = rows[0];
  if (!coupon.active) return { ok: false as const, message: "Yeh kupon expire ya inactive hai" };
  const minOrder = Number(coupon.min_order_amount) || 0;
  if (subtotal < minOrder) {
    return { ok: false as const, message: `Kam az kam Rs. ${minOrder.toLocaleString()} ke order par lag sakta hai` };
  }
  const percent = Math.min(100, Math.max(0, Number(coupon.discount_percent) || 0));
  return {
    ok: true as const,
    code: coupon.code as string,
    percent,
    discount: Math.round((subtotal * percent) / 100),
  };
}

export const createOrder = createServerFn({ method: "POST" })
  .validator(
    (data: {
      customer_name: string;
      customer_email: string;
      customer_phone?: string;
      shipping_address: string;
      coupon_code?: string;
      items: CartLineInput[];
    }) => data
  )
  .handler(async ({ data }) => {
    if (!sql) throw new Error("Database not connected");
    const customerName = data.customer_name?.trim();
    const customerEmail = data.customer_email?.trim();
    const shippingAddress = data.shipping_address?.trim();
    if (!customerName || !customerEmail || !shippingAddress) {
      throw new Error("Please complete all required fields.");
    }

    const { getSessionUserId } = await import("./server-cookies");
    const userId = await getSessionUserId();
    const { lines, subtotal } = await priceCart(data.items);

    let couponCode: string | null = null;
    let discount = 0;
    if (data.coupon_code?.trim()) {
      const coupon = await resolveCoupon(data.coupon_code, subtotal);
      if (!coupon.ok) throw new Error(coupon.message);
      couponCode = coupon.code;
      discount = coupon.discount;
    }
    const total = Math.max(0, subtotal - discount);

    const { serverCache } = await import("./server-cache");
    serverCache.delete("orders_list");
    const result = await sql.begin(async (tx) => {
      const order = await tx`
        INSERT INTO orders (
          user_id, customer_name, customer_email, customer_phone, shipping_address, total_amount, status, coupon_code, discount_amount
        ) VALUES (
          ${userId}, ${customerName}, ${customerEmail}, ${data.customer_phone?.trim() || null}, ${shippingAddress}, ${total}, 'Pending', ${couponCode}, ${discount}
        ) RETURNING *
      `;
      const orderId = order[0].id;

      for (const line of lines) {
        await tx`
          INSERT INTO order_items (order_id, product_id, product_name, quantity, price)
          VALUES (${orderId}, ${line.product_id}, ${line.product_name}, ${line.quantity}, ${line.price})
        `;
      }

      if (couponCode) {
        await tx`UPDATE coupons SET times_used = COALESCE(times_used, 0) + 1 WHERE code = ${couponCode}`;
      }

      return order[0];
    });

    sendOrderStatusEmail(
      result.id,
      customerName,
      customerEmail,
      "Pending (COD Received)",
      total,
      lines.map((l) => ({ name: l.product_name, quantity: l.quantity, price: l.price }))
    ).catch(console.error);

    return result;
  });

export const validateCoupon = createServerFn({ method: "POST" })
  .validator((data: { code: string; items: CartLineInput[] }) => data)
  .handler(async ({ data }) => {
    if (!(data.code || "").trim()) return { valid: false, message: "Kupon code darj karein" };
    try {
      const { subtotal } = await priceCart(data.items);
      const coupon = await resolveCoupon(data.code, subtotal);
      if (!coupon.ok) return { valid: false, message: coupon.message };
      return {
        valid: true,
        code: coupon.code,
        discount_percent: coupon.percent,
        discount_amount: coupon.discount,
        message: `${coupon.percent}% discount apply ho gaya! (-Rs. ${coupon.discount.toLocaleString()})`,
      };
    } catch (err) {
      console.error("validateCoupon error:", err);
      return { valid: false, message: err instanceof Error ? err.message : "Coupon check karne mein masla aya" };
    }
  });

export const getMyOrders = createServerFn({ method: "GET" }).handler(async () => {
  const userId = await sessionUserId();
  const orders = await sql`
    SELECT o.* FROM orders o
    JOIN users u ON u.id = ${userId}
    WHERE o.user_id = u.id OR lower(o.customer_email) = lower(u.email)
    ORDER BY o.id DESC
  `;
  const ids = orders.map((o) => o.id as number);
  const items = ids.length ? await sql`SELECT * FROM order_items WHERE order_id = ANY(${ids})` : [];
  return orders.map((o) => ({ ...o, items: items.filter((it) => it.order_id === o.id) }));
});

export const updateOrderStatus = createServerFn({ method: "POST" })
  .validator((data: { id: number; status: string }) => data)
  .handler(async ({ data }) => {
    await assertAdmin();
    assertOrderStatus(data.status);
    const { serverCache } = await import("./server-cache");
    serverCache.delete("orders_list");
    const order = await sql`
      UPDATE orders
      SET status = ${data.status}
      WHERE id = ${data.id}
      RETURNING *
    `;

    if (order.length === 0) {
      throw new Error("Order not found");
    }

    const items = await sql`
      SELECT product_name as name, quantity, price
      FROM order_items
      WHERE order_id = ${data.id}
    `;

    sendOrderStatusEmail(
      order[0].id,
      order[0].customer_name,
      order[0].customer_email,
      data.status,
      order[0].total_amount,
      items as any
    ).catch(console.error);

    return order[0];
  });

export const sendVerificationEmail = createServerFn({ method: "POST" })
  .validator((data: { email: string }) => data)
  .handler(async ({ data: input }) => {
    const email = input.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Please enter a valid email address.");
    const { getClientIp } = await import("./server-cookies");
    const { assertUnderLimit, recordAttempt } = await import("./rate-limit");
    const ipKey = `otp-send-ip:${getClientIp() ?? "unknown"}`;
    await assertUnderLimit(`otp-send:${email}`, 5, 15);
    await assertUnderLimit(ipKey, 20, 60);
    await recordAttempt(`otp-send:${email}`);
    await recordAttempt(ipKey);
    const data = { email };

    const code = crypto.randomInt(100000, 1000000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Save to database
    await sql`
      INSERT INTO verification_codes (email, code, expires_at)
      VALUES (${data.email}, ${code}, ${expiresAt})
    `;

    // Resend v6 reports failures in the return value instead of throwing.
    const sent = resend
      ? await resend.emails.send({
        from: "Nadeem Traders <onboarding@resend.dev>",
        to: data.email,
        subject: "Verify Your Email Address — Nadeem Traders",
        html: `
          <div style="font-family: sans-serif; padding: 20px; max-width: 500px; border: 1px solid #e2e8f0; border-radius: 12px; background: #fff;">
            <h2 style="color: #2E7D32; margin-top: 0;">Nadeem Traders</h2>
            <p style="font-size: 14px; color: #334155;">Thank you for registering at Nadeem Traders. Please use the verification code below to verify your email address:</p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; padding: 16px; background: #e8f5e9; text-align: center; color: #1b5e20; border-radius: 8px; margin: 20px 0; border: 1px solid #c8e6c9;">
              ${code}
            </div>
            <p style="font-size: 12px; color: #64748b; line-height: 1.5;">This code will expire in 15 minutes. If you did not make this request, please disregard this email.</p>
            <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
            <p style="font-size: 10px; color: #94a3b8; text-align: center;">&copy; ${new Date().getFullYear()} Nadeem Traders. All rights reserved.</p>
          </div>
        `
      })
      : { error: new Error("RESEND_API_KEY is not configured") };

    if (sent.error) {
      console.error(`Failed to send verification email to ${data.email}:`, sent.error);
      if (process.env.NODE_ENV === "production") throw new Error("Could not send the verification email. Please try again.");
      return { success: true, mockCode: code };
    }
    return { success: true };
  });

export const verifyEmailCodeAndLogin = createServerFn({ method: "POST" })
  .validator((data: { email: string; code: string; username?: string; deviceInfo?: string; browser?: string; os?: string }) => data)
  .handler(async ({ data: input }) => {
    const { setSessionToken, clearGuestToken, getGuestToken, getClientIp } = await import("./server-cookies");
    const data = { ...input, email: input.email.trim().toLowerCase(), ip: getClientIp(), guestSessionId: await getGuestToken() };

    const { assertUnderLimit, recordAttempt, clearAttempts } = await import("./rate-limit");
    const attemptKey = `otp-verify:${data.email}`;
    await assertUnderLimit(attemptKey, 5, 15);

    const match = await sql`
      SELECT * FROM verification_codes 
      WHERE email = ${data.email} AND code = ${String(data.code).trim()} AND expires_at > NOW()
      ORDER BY created_at DESC LIMIT 1
    `;

    if (match.length === 0) {
      await recordAttempt(attemptKey);
      throw new Error("Invalid or expired verification code. Please try again.");
    }
    await clearAttempts(attemptKey);

    // Delete verification codes for this email
    await sql`DELETE FROM verification_codes WHERE email = ${data.email}`;

    // 2. Check if user already exists
    let user;
    const existing = await sql`SELECT * FROM users WHERE email = ${data.email}`;

    if (existing.length > 0) {
      user = existing[0];
      // Update verified status if not set
      if (!user.email_verified) {
        await sql`UPDATE users SET email_verified = true, updated_at = NOW() WHERE id = ${user.id}`;
        user.email_verified = true;
      }
    } else {
      // 3. Register new user
      const name = data.username || data.email.split("@")[0];
      const result = await sql`
        INSERT INTO users (email, name, email_verified, reward_points)
        VALUES (${data.email}, ${name}, true, 100) -- welcome 100 reward points
        RETURNING *
      `;
      user = result[0];
      
      // Seed first notification & welcome rewards
      await sql`
        INSERT INTO notifications (user_id, title, message)
        VALUES (${user.id}, 'Welcome to Nadeem Traders!', 'Thank you for verifying your email. You have been awarded 100 welcome reward points! Start shopping and explore our fresh catalog.')
      `;
      await sql`
        INSERT INTO rewards_history (user_id, points, action, description)
        VALUES (${user.id}, 100, 'Earned', 'Welcome bonus reward points')
      `;
    }

    // 4. Update activity metadata
    await sql`
      UPDATE users SET 
        device_info = ${data.deviceInfo || null},
        browser_info = ${data.browser || null},
        operating_system = ${data.os || null},
        last_ip = ${data.ip || null},
        last_login = NOW(),
        last_activity = NOW(),
        updated_at = NOW()
      WHERE id = ${user.id}
    `;

    // 5. Audit logs
    await sql`
      INSERT INTO login_history (user_id, ip_address, device, browser, status)
      VALUES (${user.id}, ${data.ip || null}, ${data.os || null}, ${data.browser || null}, 'Success')
    `;

    // 6. Create session
    const sessionToken = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days session

    await sql`
      INSERT INTO sessions (id, user_id, device_id, browser, ip_address, expires_at)
      VALUES (${sessionToken}, ${user.id}, ${data.os || null}, ${data.browser || null}, ${data.ip || null}, ${expiresAt})
    `;

    // Set cookie
    await setSessionToken(sessionToken, expiresAt);

    // 7. Preserving guest cart & guest recently viewed
    if (data.guestSessionId) {
      // Merge guest cart items into user cart
      const guestCart = await sql`SELECT * FROM cart_items WHERE guest_session_id = ${data.guestSessionId}`;
      for (const item of guestCart) {
        await sql`
          INSERT INTO cart_items (user_id, product_id, variant, quantity)
          VALUES (${user.id}, ${item.product_id}, ${item.variant}, ${item.quantity})
          ON CONFLICT (user_id, product_id, variant)
          DO UPDATE SET quantity = LEAST(cart_items.quantity + EXCLUDED.quantity, 999)
        `;
      }
      await sql`DELETE FROM cart_items WHERE guest_session_id = ${data.guestSessionId}`;

      // Merge recently viewed
      const guestRV = await sql`SELECT * FROM recently_viewed WHERE guest_session_id = ${data.guestSessionId}`;
      for (const item of guestRV) {
        await sql`
          INSERT INTO recently_viewed (user_id, product_id, viewed_at)
          VALUES (${user.id}, ${item.product_id}, ${item.viewed_at})
          ON CONFLICT (user_id, product_id)
          DO UPDATE SET viewed_at = GREATEST(recently_viewed.viewed_at, EXCLUDED.viewed_at)
        `;
      }
      await sql`DELETE FROM recently_viewed WHERE guest_session_id = ${data.guestSessionId}`;
      await clearGuestToken();
    }

    return { success: true, user };
  });
