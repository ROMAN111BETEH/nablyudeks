import { env } from "@/lib/env";
import { LeadPayload } from "@/lib/types";

export async function sendLeadToTelegram(payload: LeadPayload): Promise<void> {
  if (!env.telegramBotToken || !env.telegramChatId) {
    throw new Error("TELEGRAM_NOT_CONFIGURED");
  }

  const now = new Date().toLocaleString("ru-RU", { timeZone: "Europe/Moscow" });

  const productLines = payload.selectedProducts.length
    ? payload.selectedProducts
        .map((item, idx) => `${idx + 1}. ${item.title} (${item.price.toLocaleString("ru-RU")} ₽)`)
        .join("\n")
    : "Не выбрано";

  const text = [
    "<b>Новая заявка с лендинга</b>",
    "",
    `<b>Дата:</b> ${now}`,
    `<b>Имя:</b> ${payload.name || "Не указано"}`,
    `<b>Телефон:</b> ${payload.phone}`,
    `<b>Telegram:</b> ${payload.telegram || "Не указан"}`,
    `<b>Email:</b> ${payload.email || "Не указан"}`,
    `<b>Комментарий:</b> ${payload.comment || "Не указан"}`,
    "",
    "<b>Выбранные товары:</b>",
    productLines,
    "",
    `<b>Страница:</b> ${payload.pageUrl || "Неизвестно"}`,
    `<b>UTM source:</b> ${payload.utmSource || "-"}`,
    `<b>UTM medium:</b> ${payload.utmMedium || "-"}`,
    `<b>UTM campaign:</b> ${payload.utmCampaign || "-"}`,
  ].join("\n");

  const response = await fetch(`https://api.telegram.org/bot${env.telegramBotToken}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: env.telegramChatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`TELEGRAM_SEND_FAILED: ${message}`);
  }
}
