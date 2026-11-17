import { sql } from "./db";
import crypto from "crypto";
import { getCookie, setCookie, deleteCookie, getRequestIP } from "@tanstack/react-start/server";

export async function getSessionToken() {
  if (typeof window !== "undefined") return null;
  try {
    return getCookie("nadeem_session_token") || null;
  } catch (e) {
    console.error("Failed to read session cookie:", e);
    return null;
  }
}

export async function setSessionToken(token: string, expires: Date) {
  if (typeof window !== "undefined") return;
  try {
    setCookie("nadeem_session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expires,
      path: "/"
    });
  } catch (e) {
    console.error("Failed to set session cookie:", e);
  }
}

export async function clearSessionToken() {
  if (typeof window !== "undefined") return;
  try {
    deleteCookie("nadeem_session_token");
  } catch (e) {
    console.error("Failed to delete session cookie:", e);
  }
}

export async function getGuestToken() {
  if (typeof window !== "undefined") return null;
  try {
    return getCookie("nadeem_guest_token") || null;
  } catch (e) {
    console.error("Failed to read guest cookie:", e);
    return null;
  }
}

export async function setGuestToken(token: string) {
  if (typeof window !== "undefined") return;
  try {
    setCookie("nadeem_guest_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      path: "/"
    });
  } catch (e) {
    console.error("Failed to set guest cookie:", e);
  }
}

export async function clearGuestToken() {
  if (typeof window !== "undefined") return;
  try {
    deleteCookie("nadeem_guest_token");
  } catch (e) {
    console.error("Failed to delete guest cookie:", e);
  }
}

// Vercel overwrites X-Forwarded-For with the real client address, so it is trustworthy there.
export function getClientIp(): string | null {
  return getRequestIP({ xForwardedFor: true }) || null;
}

export async function getSessionUserId(): Promise<number | null> {
  const sessionToken = await getSessionToken();
  if (!sessionToken) return null;
  const session = await sql`
    SELECT s.user_id FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.id = ${sessionToken} AND s.active = TRUE AND s.expires_at > NOW()
      AND COALESCE(u.account_status, 'Active') <> 'Disabled'
  `;
  return session.length > 0 ? session[0].user_id : null;
}

export async function requireSessionUserId(): Promise<number> {
  const userId = await getSessionUserId();
  if (!userId) throw new Error("Please sign in to continue.");
  return userId;
}

export async function resolveUserOrGuest(): Promise<{ userId?: number; guestSessionId?: string }> {
  const userId = await getSessionUserId();
  if (userId) return { userId };

  let guestToken = await getGuestToken();
  if (!guestToken) {
    guestToken = crypto.randomUUID();
    await setGuestToken(guestToken);
  }
  return { guestSessionId: guestToken };
}
