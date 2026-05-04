import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { getSiteData, saveSiteContent } from "@/lib/repository";
import { SiteContent } from "@/lib/types";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const data = await getSiteData();
  return NextResponse.json({ content: data.content });
}

export async function PUT(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = (await request.json()) as SiteContent;
    await saveSiteContent(body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "CONTENT_SAVE_FAILED";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
