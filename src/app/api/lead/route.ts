import { NextResponse } from "next/server";
import { verifyCaptcha } from "@/lib/captcha";
import { sendLeadToTelegram } from "@/lib/telegram";
import { leadSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = leadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "VALIDATION_ERROR",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    if (!verifyCaptcha(parsed.data.captchaToken, parsed.data.captchaAnswer)) {
      return NextResponse.json({ error: "CAPTCHA_FAILED" }, { status: 400 });
    }

    await sendLeadToTelegram(parsed.data);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
