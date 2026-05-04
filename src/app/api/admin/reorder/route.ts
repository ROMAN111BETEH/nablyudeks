import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { reorderCategories, reorderProducts } from "@/lib/repository";

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = (await request.json()) as { entity?: "categories" | "products"; ids?: string[] };

    if (!body.entity || !Array.isArray(body.ids)) {
      return NextResponse.json({ error: "INVALID_PAYLOAD" }, { status: 400 });
    }

    if (body.entity === "categories") {
      await reorderCategories(body.ids);
    } else {
      await reorderProducts(body.ids);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "REORDER_FAILED";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
