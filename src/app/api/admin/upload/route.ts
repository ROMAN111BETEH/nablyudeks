import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { env } from "@/lib/env";
import { getSupabaseAdminClient } from "@/lib/supabase";

const DEFAULT_SIGNED_URL_TTL = 60 * 60 * 24 * 30;

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "SUPABASE_NOT_CONFIGURED" }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "FILE_REQUIRED" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "ONLY_IMAGE_ALLOWED" }, { status: 400 });
    }

    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: "FILE_TOO_LARGE" }, { status: 400 });
    }

    const ext = file.name.split(".").pop() || "jpg";
    const path = `products/${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const bucketId = env.supabaseBucket || "products";
    const { data: bucketData } = await supabase.storage.getBucket(bucketId);
    const bucketIsPublic = Boolean(bucketData?.public);

    const { error } = await supabase.storage.from(bucketId).upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (bucketIsPublic) {
      const { data } = supabase.storage.from(bucketId).getPublicUrl(path);
      return NextResponse.json({ ok: true, url: data.publicUrl });
    }

    const { data: signed, error: signedError } = await supabase.storage
      .from(bucketId)
      .createSignedUrl(path, DEFAULT_SIGNED_URL_TTL);

    if (signedError || !signed?.signedUrl) {
      return NextResponse.json({ error: signedError?.message || "SIGNED_URL_FAILED" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, url: signed.signedUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UPLOAD_FAILED";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
