export type LocaleCode = "ru";

export type MapMode = "text" | "yandex";

export interface Category {
  id: string;
  slug: string;
  name: string;
  parentSlug: string | null;
  sortOrder: number;
}

export interface Product {
  id: string;
  categorySlug: string;
  title: string;
  price: number;
  description: string;
  specs: string;
  article: string;
  images: string[];
  sortOrder: number;
}

export interface AdvantageItem {
  id: string;
  title: string;
  text: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface ContactInfo {
  phone: string;
  email: string;
  telegram: string;
  address: string;
  workHours: string;
  mapMode: MapMode;
  yandexEmbedUrl: string;
  yandexAddressText: string;
}

export interface LegalDocument {
  title: string;
  contentHtml: string;
}

export interface SiteContent {
  locale: LocaleCode;
  companyName: string;
  companyTagline: string;
  heroTitle: string;
  heroSubtitle: string;
  heroBadge: string;
  heroPrimaryCta: string;
  heroSecondaryCta: string;
  productsTitle: string;
  productsSubtitle: string;
  requestTitle: string;
  requestSubtitle: string;
  advantagesTitle: string;
  faqTitle: string;
  footerText: string;
  seoTitle: string;
  seoDescription: string;
  callButtonText: string;
  menuTitle: string;
  legalPrivacy: LegalDocument;
  legalOffer: LegalDocument;
  legalConsent: LegalDocument;
  contacts: ContactInfo;
  advantages: AdvantageItem[];
  faq: FaqItem[];
}

export interface SiteData {
  content: SiteContent;
  categories: Category[];
  products: Product[];
}

export interface LeadPayload {
  name: string;
  phone: string;
  telegram: string;
  email: string;
  comment: string;
  selectedProductIds: string[];
  selectedProducts: Array<{ id: string; title: string; price: number; images: string[]; categorySlug: string }>;
  captchaToken: string;
  captchaAnswer: string;
  pageUrl: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
}
