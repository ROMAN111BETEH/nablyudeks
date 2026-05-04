function readEnv(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}

export const env = {
  supabaseUrl: readEnv("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseServiceRoleKey: readEnv("SUPABASE_SERVICE_ROLE_KEY"),
  supabaseBucket: readEnv("SUPABASE_STORAGE_BUCKET", "products"),
  telegramBotToken: readEnv("TELEGRAM_BOT_TOKEN"),
  telegramChatId: readEnv("TELEGRAM_CHAT_ID"),
  adminLogin: readEnv("ADMIN_LOGIN", "admin23"),
  adminPassword: readEnv("ADMIN_PASSWORD", "admin23"),
  adminSessionSecret: readEnv("ADMIN_SESSION_SECRET", "change-this-secret"),
  captchaSecret: readEnv("CAPTCHA_SECRET", "change-this-captcha-secret"),
};

export function hasSupabasePublicConfig(): boolean {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}

export function hasSupabaseServiceConfig(): boolean {
  return Boolean(env.supabaseUrl && env.supabaseServiceRoleKey);
}
