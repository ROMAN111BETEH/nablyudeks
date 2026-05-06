import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

interface CaptchaPayload {
  answer: string;
  exp: number;
}

function encode(payload: CaptchaPayload): string {
  const raw = JSON.stringify(payload);
  const body = Buffer.from(raw).toString("base64url");
  const sig = createHmac("sha256", env.captchaSecret).update(body).digest("hex");
  return `${body}.${sig}`;
}

function decode(token: string): CaptchaPayload | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) {
    return null;
  }

  const expected = createHmac("sha256", env.captchaSecret).update(body).digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);

  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as CaptchaPayload;
  } catch {
    return null;
  }
}

export function createCaptchaChallenge() {
  const a = Math.floor(Math.random() * 7) + 2;
  const b = Math.floor(Math.random() * 7) + 2;
  const answer = String(a + b);
  const token = encode({
    answer,
    exp: Date.now() + 1000 * 60 * 10,
  });

  return {
    question: `${a} + ${b}`,
    token,
  };
}

export function verifyCaptcha(token: string, answer: string): boolean {
  const payload = decode(token);
  if (!payload) {
    return false;
  }

  if (Date.now() > payload.exp) {
    return false;
  }

  return payload.answer.trim() === answer.trim();
}
