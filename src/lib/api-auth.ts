import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export async function requireAdmin() {
  const allowed = await isAdminAuthenticated();
  if (!allowed) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  return null;
}
