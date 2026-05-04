import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

export const ADMIN_COOKIE_NAME = "nablyudeks_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;

function signValue(value: string): string {
  return createHmac("sha256", env.adminSessionSecret).update(value).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) {
    return false;
  }
  return timingSafeEqual(aBuf, bBuf);
}

export function buildAdminToken(): string {
  const payload = `${env.adminLogin}:${Date.now()}`;
  const sig = signValue(payload);
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

export function verifyAdminToken(token: string): boolean {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const [login, ts, sig] = decoded.split(":");
    if (!login || !ts || !sig) {
      return false;
    }
    if (login !== env.adminLogin) {
      return false;
    }

    const numericTs = Number(ts);
    if (!Number.isFinite(numericTs)) {
      return false;
    }
    if (Date.now() - numericTs > SESSION_TTL_SECONDS * 1000) {
      return false;
    }

    return safeEqual(signValue(`${login}:${ts}`), sig);
  } catch {
    return false;
  }
}

export function sessionTtlSeconds() {
  return SESSION_TTL_SECONDS;
}
