import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { deleteCategory, getSiteData, saveCategory } from "@/lib/repository";
import { Category } from "@/lib/types";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const data = await getSiteData();
  return NextResponse.json({ categories: data.categories });
}

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const category = (await request.json()) as Category;
    await saveCategory(category);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "CATEGORY_SAVE_FAILED";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = (await request.json()) as { id?: string };
    if (!body.id) {
      return NextResponse.json({ error: "ID_REQUIRED" }, { status: 400 });
    }
    await deleteCategory(body.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "CATEGORY_DELETE_FAILED";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
