import { createSign } from "node:crypto";

type CachedToken = { value: string; expires: number };
const tokenCache = new Map<string, CachedToken>();

interface ServiceAccountKey {
  client_email: string;
  private_key: string;
}

function parseServiceAccount(rawJson: string): ServiceAccountKey {
  let parsed: Partial<ServiceAccountKey>;
  try {
    parsed = JSON.parse(rawJson) as Partial<ServiceAccountKey>;
  } catch {
    throw new Error("Invalid Google service account JSON key.");
  }
  if (!parsed.client_email || !parsed.private_key) {
    throw new Error("Google service account JSON is missing client_email or private_key.");
  }
  return {
    client_email: parsed.client_email,
    private_key: parsed.private_key.replace(/\\n/g, "\n"),
  };
}

/** Mint and cache an OAuth 2.0 bearer token for a Google service account JSON key and scope. */
export async function getGoogleAccessToken(rawAccountJson: string, scope: string): Promise<string> {
  const account = parseServiceAccount(rawAccountJson);
  const cacheKey = `${account.client_email}::${scope}`;
  const cached = tokenCache.get(cacheKey);
  if (cached && cached.expires > Date.now() + 60_000) {
    return cached.value;
  }

  const now = Math.floor(Date.now() / 1000);
  const b64 = (v: object) => Buffer.from(JSON.stringify(v)).toString("base64url");
  const unsigned = `${b64({ alg: "RS256", typ: "JWT" })}.${b64({
    iss: account.client_email,
    scope,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  })}`;

  const signature = createSign("RSA-SHA256").update(unsigned).sign(account.private_key, "base64url");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${signature}`,
    }),
  });
  if (!res.ok) {
    throw new Error(`Google sign-in failed (${res.status})`);
  }

  const body = (await res.json()) as { access_token: string; expires_in: number };
  tokenCache.set(cacheKey, {
    value: body.access_token,
    expires: Date.now() + body.expires_in * 1000,
  });
  return body.access_token;
}
