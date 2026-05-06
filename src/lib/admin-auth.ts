import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { ADMIN_COOKIE_NAME, buildAdminToken, sessionTtlSeconds, verifyAdminToken } from "@/lib/admin-token";

export async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) {
    return false;
  }
  return verifyAdminToken(token);
}

export async function createAdminSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(ADMIN_COOKIE_NAME, buildAdminToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: sessionTtlSeconds(),
  });
}

export async function clearAdminSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export function isValidAdminCredentials(login: string, password: string): boolean {
  return login === env.adminLogin && password === env.adminPassword;
}
