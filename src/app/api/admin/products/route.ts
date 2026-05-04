import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { deleteProduct, getSiteData, saveProduct } from "@/lib/repository";
import { Product } from "@/lib/types";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const data = await getSiteData();
  return NextResponse.json({ products: data.products });
}

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const product = (await request.json()) as Product;
    await saveProduct(product);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "PRODUCT_SAVE_FAILED";
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
    await deleteProduct(body.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "PRODUCT_DELETE_FAILED";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
