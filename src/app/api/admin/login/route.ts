import { NextResponse } from "next/server";
import { createAdminSessionCookie, isValidAdminCredentials } from "@/lib/admin-auth";
import { adminLoginSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = adminLoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
    }

    if (!isValidAdminCredentials(parsed.data.login, parsed.data.password)) {
      return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });
    }

    await createAdminSessionCookie();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "LOGIN_FAILED" }, { status: 500 });
  }
}
