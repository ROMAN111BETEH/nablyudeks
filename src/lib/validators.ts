import { z } from "zod";

export const leadSchema = z.object({
  name: z.string().trim().max(120).optional().default(""),
  phone: z
    .string()
    .trim()
    .min(1, "Телефон обязателен")
    .refine((value) => value.replace(/\D/g, "").length >= 11, "Телефон заполнен некорректно"),
  telegram: z.string().trim().max(120).optional().default(""),
  email: z.string().trim().max(120).optional().default(""),
  comment: z.string().trim().max(1000).optional().default(""),
  selectedProductIds: z.array(z.string()).optional().default([]),
  selectedProducts: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        price: z.number(),
        categorySlug: z.string(),
        images: z.array(z.string()).default([]),
      }),
    )
    .optional()
    .default([]),
  captchaToken: z.string().min(1),
  captchaAnswer: z.string().min(1),
  pageUrl: z.string().trim().max(300).optional().default(""),
  utmSource: z.string().trim().max(120).optional().default(""),
  utmMedium: z.string().trim().max(120).optional().default(""),
  utmCampaign: z.string().trim().max(120).optional().default(""),
  consentAccepted: z.boolean().refine((value) => value, "Подтвердите согласие"),
});

export const adminLoginSchema = z.object({
  login: z.string().trim().min(1),
  password: z.string().min(1),
});
