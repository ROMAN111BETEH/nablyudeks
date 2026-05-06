import { Category, Product, SiteContent, SiteData } from "@/lib/types";

const categories: Category[] = [
  { id: "cat-cameras", slug: "cameras", name: "Камеры", parentSlug: null, sortOrder: 1 },
  { id: "cat-registrars", slug: "registrars", name: "Регистраторы", parentSlug: null, sortOrder: 2 },
  { id: "cat-domophones", slug: "domophones", name: "Домофоны", parentSlug: null, sortOrder: 3 },
  {
    id: "cat-domophones-panel",
    slug: "domophone-panels",
    name: "Вызывная панель",
    parentSlug: "domophones",
    sortOrder: 4,
  },
  {
    id: "cat-domophones-monitor",
    slug: "domophone-monitors",
    name: "Мониторы",
    parentSlug: "domophones",
    sortOrder: 5,
  },
  {
    id: "cat-cable",
    slug: "cable",
    name: "Кабельная продукция",
    parentSlug: null,
    sortOrder: 6,
  },
];

const imageByCategory: Record<string, string> = {
  cameras: "/placeholders/camera.svg",
  registrars: "/placeholders/registrar.svg",
  "domophone-panels": "/placeholders/panel.svg",
  "domophone-monitors": "/placeholders/monitor.svg",
  cable: "/placeholders/cable.svg",
};

function generateCategoryProducts(
  categorySlug: string,
  baseTitle: string,
  basePrice: number,
  prefix: string,
): Product[] {
  return Array.from({ length: 10 }, (_, index) => {
    const n = index + 1;
    return {
      id: `product-${categorySlug}-${n}`,
      categorySlug,
      title: `${baseTitle} ${n}`,
      price: basePrice + n * 1200,
      description:
        "Надежное оборудование для стабильной работы системы безопасности. Подходит для квартиры, дома и коммерческих объектов.",
      specs: "Гарантия 12 месяцев, монтаж под ключ, выезд инженера в день обращения.",
      article: `${prefix}-${String(n).padStart(3, "0")}`,
      images: [imageByCategory[categorySlug]],
      sortOrder: n,
    };
  });
}

const products: Product[] = [
  ...generateCategoryProducts("cameras", "IP-камера", 7900, "CAM"),
  ...generateCategoryProducts("registrars", "Видеорегистратор", 12900, "REC"),
  ...generateCategoryProducts("domophone-panels", "Вызывная панель", 9900, "DOP"),
  ...generateCategoryProducts("domophone-monitors", "Домофонный монитор", 10900, "DOM"),
  ...generateCategoryProducts("cable", "Кабельная бухта", 2400, "CBL"),
];

const content: SiteContent = {
  locale: "ru",
  companyName: "НАБЛЮДЕКС",
  companyTagline: "Системы видеонаблюдения",
  heroTitle: "Безопасность под ключ для дома и бизнеса",
  heroSubtitle:
    "Проектируем, подбираем и устанавливаем камеры, домофоны, регистраторы и кабельную продукцию с гарантией и поддержкой.",
  heroBadge: "Выезд инженера в день обращения",
  heroPrimaryCta: "Подобрать решение",
  heroSecondaryCta: "Смотреть оборудование",
  productsTitle: "Подберите оборудование по категории",
  productsSubtitle:
    "Выберите нужный раздел, пролистайте карточки и отметьте понравившиеся товары. Мы учтем их в заявке.",
  requestTitle: "Оставьте заявку на консультацию",
  requestSubtitle:
    "Укажите телефон, а мы свяжемся с вами, уточним детали и предложим оптимальный комплект под ваш объект.",
  advantagesTitle: "Почему выбирают НАБЛЮДЕКС",
  faqTitle: "Частые вопросы",
  footerText: "НАБЛЮДЕКС — установка и обслуживание систем видеонаблюдения под ключ.",
  seoTitle: "НАБЛЮДЕКС — системы видеонаблюдения под ключ",
  seoDescription:
    "Камеры, домофоны, регистраторы и кабельная продукция. Подбор, монтаж и обслуживание систем безопасности.",
  callButtonText: "Заказать звонок",
  menuTitle: "Виды техники",
  legalPrivacy: {
    title: "Политика конфиденциальности",
    contentHtml:
      "<p>Мы обрабатываем персональные данные только для связи по заявке и оказания услуг. Передача третьим лицам без законного основания не осуществляется.</p>",
  },
  legalOffer: {
    title: "Публичная оферта",
    contentHtml:
      "<p>Информация на сайте носит ознакомительный характер и не является окончательным предложением. Условия уточняются при подтверждении заказа.</p>",
  },
  legalConsent: {
    title: "Согласие на обработку персональных данных",
    contentHtml:
      "<p>Отправляя форму, вы подтверждаете согласие на обработку персональных данных в целях обратной связи и подготовки коммерческого предложения.</p>",
  },
  contacts: {
    phone: "+7 (999) 000-00-00",
    email: "info@nablyudeks.ru",
    telegram: "@nablyudeks",
    address: "г. Москва, ул. Примерная, 1",
    workHours: "Пн–Сб: 09:00–20:00",
    mapMode: "text",
    yandexEmbedUrl: "",
    yandexAddressText: "Схема проезда доступна по запросу менеджера.",
  },
  advantages: [
    { id: "adv-1", title: "Подбор под объект", text: "Рассчитываем систему под площадь, задачи и бюджет клиента." },
    { id: "adv-2", title: "Монтаж под ключ", text: "От кабеля до настройки удаленного доступа выполняем одной командой." },
    { id: "adv-3", title: "Прозрачная смета", text: "Все цены фиксируем заранее: оборудование, монтаж, пусконаладка." },
    { id: "adv-4", title: "Сервис и гарантия", text: "Остаемся на связи после установки и оперативно решаем вопросы." },
  ],
  faq: [
    {
      id: "faq-1",
      question: "Сколько времени занимает установка?",
      answer: "Обычно 1 день для квартиры и 1-3 дня для частного дома или коммерческого объекта.",
    },
    {
      id: "faq-2",
      question: "Можно ли смотреть камеры с телефона?",
      answer: "Да, мы настроим удаленный доступ и покажем как пользоваться приложением.",
    },
    {
      id: "faq-3",
      question: "Работаете ли вы с уже купленным оборудованием?",
      answer: "Да, проверяем совместимость, при необходимости доукомплектовываем систему.",
    },
  ],
};

export const defaultSiteData: SiteData = {
  content,
  categories,
  products,
};

export function cloneDefaultSiteData(): SiteData {
  return JSON.parse(JSON.stringify(defaultSiteData)) as SiteData;
}
