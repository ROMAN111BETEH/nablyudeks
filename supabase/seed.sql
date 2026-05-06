begin;

-- Очистка данных (без удаления структуры)
truncate table public.site_content restart identity cascade;
truncate table public.products restart identity cascade;
truncate table public.categories restart identity cascade;

-- Контент сайта (локаль ru)
insert into public.site_content (locale, content)
values (
  'ru',
  $$
  {
    "locale": "ru",
    "companyName": "НАБЛЮДЕКС",
    "companyTagline": "Системы видеонаблюдения",
    "heroTitle": "Безопасность под ключ для дома и бизнеса",
    "heroSubtitle": "Проектируем, подбираем и устанавливаем камеры, домофоны, регистраторы и кабельную продукцию с гарантией и поддержкой.",
    "heroBadge": "Выезд инженера в день обращения",
    "heroPrimaryCta": "Подобрать решение",
    "heroSecondaryCta": "Смотреть оборудование",
    "productsTitle": "Подберите оборудование по категории",
    "productsSubtitle": "Выберите нужный раздел, пролистайте карточки и отметьте понравившиеся товары. Мы учтем их в заявке.",
    "requestTitle": "Оставьте заявку на консультацию",
    "requestSubtitle": "Укажите телефон, а мы свяжемся с вами, уточним детали и предложим оптимальный комплект под ваш объект.",
    "advantagesTitle": "Почему выбирают НАБЛЮДЕКС",
    "faqTitle": "Частые вопросы",
    "footerText": "НАБЛЮДЕКС — установка и обслуживание систем видеонаблюдения под ключ.",
    "seoTitle": "НАБЛЮДЕКС — системы видеонаблюдения под ключ",
    "seoDescription": "Камеры, домофоны, регистраторы и кабельная продукция. Подбор, монтаж и обслуживание систем безопасности.",
    "callButtonText": "Заказать звонок",
    "menuTitle": "Виды техники",
    "legalPrivacy": {
      "title": "Политика конфиденциальности",
      "contentHtml": "<p>Мы обрабатываем персональные данные только для связи по заявке и оказания услуг. Передача третьим лицам без законного основания не осуществляется.</p>"
    },
    "legalOffer": {
      "title": "Публичная оферта",
      "contentHtml": "<p>Информация на сайте носит ознакомительный характер и не является окончательным предложением. Условия уточняются при подтверждении заказа.</p>"
    },
    "legalConsent": {
      "title": "Согласие на обработку персональных данных",
      "contentHtml": "<p>Отправляя форму, вы подтверждаете согласие на обработку персональных данных в целях обратной связи и подготовки коммерческого предложения.</p>"
    },
    "contacts": {
      "phone": "+7 (999) 000-00-00",
      "email": "info@nablyudeks.ru",
      "telegram": "@nablyudeks",
      "address": "г. Москва, ул. Примерная, 1",
      "workHours": "Пн–Сб: 09:00–20:00",
      "mapMode": "text",
      "yandexEmbedUrl": "",
      "yandexAddressText": "Схема проезда доступна по запросу менеджера."
    },
    "advantages": [
      {
        "id": "adv-1",
        "title": "Подбор под объект",
        "text": "Рассчитываем систему под площадь, задачи и бюджет клиента."
      },
      {
        "id": "adv-2",
        "title": "Монтаж под ключ",
        "text": "От кабеля до настройки удаленного доступа выполняем одной командой."
      },
      {
        "id": "adv-3",
        "title": "Прозрачная смета",
        "text": "Все цены фиксируем заранее: оборудование, монтаж, пусконаладка."
      },
      {
        "id": "adv-4",
        "title": "Сервис и гарантия",
        "text": "Остаемся на связи после установки и оперативно решаем вопросы."
      }
    ],
    "faq": [
      {
        "id": "faq-1",
        "question": "Сколько времени занимает установка?",
        "answer": "Обычно 1 день для квартиры и 1-3 дня для частного дома или коммерческого объекта."
      },
      {
        "id": "faq-2",
        "question": "Можно ли смотреть камеры с телефона?",
        "answer": "Да, мы настроим удаленный доступ и покажем как пользоваться приложением."
      },
      {
        "id": "faq-3",
        "question": "Работаете ли вы с уже купленным оборудованием?",
        "answer": "Да, проверяем совместимость, при необходимости доукомплектовываем систему."
      }
    ]
  }
  $$::jsonb
)
on conflict (locale) do update set
  content = excluded.content,
  updated_at = now();

-- Категории
insert into public.categories (slug, name, parent_slug, sort_order)
values
  ('cameras', 'Камеры', null, 1),
  ('registrars', 'Регистраторы', null, 2),
  ('domophones', 'Домофоны', null, 3),
  ('domophone-panels', 'Вызывная панель', 'domophones', 4),
  ('domophone-monitors', 'Мониторы', 'domophones', 5),
  ('cable', 'Кабельная продукция', null, 6)
on conflict (slug) do update set
  name = excluded.name,
  parent_slug = excluded.parent_slug,
  sort_order = excluded.sort_order,
  updated_at = now();

-- Товары (по 10 в каждой целевой категории)
with categories_seed as (
  select *
  from (
    values
      ('cameras'::text, 'IP-камера'::text, 7900::numeric, 'CAM'::text, '/placeholders/camera.svg'::text),
      ('registrars'::text, 'Видеорегистратор'::text, 12900::numeric, 'REC'::text, '/placeholders/registrar.svg'::text),
      ('domophone-panels'::text, 'Вызывная панель'::text, 9900::numeric, 'DOP'::text, '/placeholders/panel.svg'::text),
      ('domophone-monitors'::text, 'Домофонный монитор'::text, 10900::numeric, 'DOM'::text, '/placeholders/monitor.svg'::text),
      ('cable'::text, 'Кабельная бухта'::text, 2400::numeric, 'CBL'::text, '/placeholders/cable.svg'::text)
  ) as t(category_slug, base_title, base_price, article_prefix, image_url)
),
series as (
  select generate_series(1, 10) as n
)
insert into public.products (
  category_slug,
  title,
  price,
  description,
  specs,
  article,
  images,
  sort_order
)
select
  c.category_slug,
  c.base_title || ' ' || s.n as title,
  c.base_price + (s.n * 1200) as price,
  'Надежное оборудование для стабильной работы системы безопасности. Подходит для квартиры, дома и коммерческих объектов.' as description,
  'Гарантия 12 месяцев, монтаж под ключ, выезд инженера в день обращения.' as specs,
  c.article_prefix || '-' || lpad(s.n::text, 3, '0') as article,
  array[c.image_url]::text[] as images,
  s.n as sort_order
from categories_seed c
cross join series s
order by c.category_slug, s.n;

commit;
