import { NextResponse } from "next/server";
import { createCaptchaChallenge } from "@/lib/captcha";

export async function GET() {
  return NextResponse.json(createCaptchaChallenge());
}
