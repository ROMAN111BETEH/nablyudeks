"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { formatPhoneInput, onlyPhoneDigits } from "@/lib/client-utils";
import { Category, Product, SiteData } from "@/lib/types";
import styles from "./landing-page.module.css";

interface LandingPageProps {
  initialData: SiteData;
}

type SortMode = "asc" | "desc";

function getLeafCategories(categories: Category[]): Category[] {
  return categories
    .filter((category) => !categories.some((inner) => inner.parentSlug === category.slug))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

function getTopCategories(categories: Category[]): Category[] {
  return categories
    .filter((category) => !category.parentSlug)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

function toPriceLabel(price: number): string {
  return `${price.toLocaleString("ru-RU")} ₽`;
}

function getCategoryNameMap(categories: Category[]): Record<string, string> {
  return categories.reduce<Record<string, string>>((acc, category) => {
    acc[category.slug] = category.name;
    return acc;
  }, {});
}

function getValidImages(product: Product): string[] {
  return product.images.map((url) => url.trim()).filter(Boolean);
}

function isPlaceholderImage(url: string): boolean {
  return url.includes("/placeholders/");
}

function getDisplayImages(product: Product): string[] {
  const images = getValidImages(product);
  const realImages = images.filter((url) => !isPlaceholderImage(url));
  if (realImages.length) {
    const placeholders = images.filter((url) => isPlaceholderImage(url));
    return [...realImages, ...placeholders];
  }
  return images;
}

export function LandingPage({ initialData }: LandingPageProps) {
  const { content, categories, products } = initialData;
  const [activeCategory, setActiveCategory] = useState<string>(() => getLeafCategories(categories)[0]?.slug ?? "");
  const [sortMode, setSortMode] = useState<SortMode>("asc");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDomophoneOpen, setIsDomophoneOpen] = useState(false);
  const [imageIndex, setImageIndex] = useState<Record<string, number>>({});
  const [captcha, setCaptcha] = useState<{ question: string; token: string } | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showThanksModal, setShowThanksModal] = useState(false);
  const [legalModal, setLegalModal] = useState<"privacy" | "offer" | "consent" | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    telegram: "",
    email: "",
    comment: "",
  });

  const topCategories = useMemo(() => getTopCategories(categories), [categories]);
  const leafCategories = useMemo(() => getLeafCategories(categories), [categories]);
  const categoryNameMap = useMemo(() => getCategoryNameMap(categories), [categories]);

  useEffect(() => {
    async function loadCaptcha() {
      const response = await fetch("/api/captcha");
      const payload = (await response.json()) as { question: string; token: string };
      setCaptcha(payload);
    }

    loadCaptcha();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.revealed);
          }
        });
      },
      { threshold: 0.12 },
    );

    const targets = document.querySelectorAll(`.${styles.reveal}`);
    targets.forEach((target) => observer.observe(target));

    return () => {
      targets.forEach((target) => observer.unobserve(target));
      observer.disconnect();
    };
  }, []);

  const activeProducts = useMemo(() => {
    const filtered = products.filter((item) => item.categorySlug === activeCategory);
    const sorted = [...filtered].sort((a, b) => (sortMode === "asc" ? a.price - b.price : b.price - a.price));
    return sorted;
  }, [products, activeCategory, sortMode]);

  const selectedProducts = useMemo(() => products.filter((item) => selectedIds.includes(item.id)), [products, selectedIds]);

  const scrollToId = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleMenuCategoryClick = (slug: string) => {
    const leaf = leafCategories.find((item) => item.slug === slug);
    if (!leaf) return;

    setActiveCategory(slug);
    setIsDomophoneOpen(false);
    scrollToId("products");

    setTimeout(() => {
      scrollToId(`category-${slug}`);
    }, 120);
  };

  const toggleFavorite = (productId: string) => {
    setSelectedIds((prev) =>
      prev.includes(productId) ? prev.filter((item) => item !== productId) : [...prev, productId],
    );
  };

  const cycleImage = (product: Product, direction: "next" | "prev") => {
    const total = getDisplayImages(product).length;
    if (total <= 1) return;

    setImageIndex((prev) => {
      const current = prev[product.id] ?? 0;
      const next = direction === "next" ? (current + 1) % total : (current - 1 + total) % total;
      return { ...prev, [product.id]: next };
    });
  };

  const currentImage = (product: Product): string => {
    const images = getDisplayImages(product);
    if (!images.length) return "/placeholders/camera.svg";
    const idx = imageIndex[product.id] ?? 0;
    return images[idx] || images[0];
  };

  const submitLead = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusMessage("");

    if (onlyPhoneDigits(form.phone).length < 11) {
      setStatusMessage("Введите корректный номер телефона");
      return;
    }

    if (!captcha) {
      setStatusMessage("Капча еще не загрузилась. Повторите через пару секунд.");
      return;
    }

    if (!consentAccepted) {
      setStatusMessage("Подтвердите согласие на обработку персональных данных");
      return;
    }

    setIsSubmitting(true);

    const params = new URLSearchParams(window.location.search);

    const response = await fetch("/api/lead", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...form,
        selectedProductIds: selectedProducts.map((item) => item.id),
        selectedProducts,
        captchaToken: captcha.token,
        captchaAnswer,
        consentAccepted,
        pageUrl: window.location.href,
        utmSource: params.get("utm_source") || "",
        utmMedium: params.get("utm_medium") || "",
        utmCampaign: params.get("utm_campaign") || "",
      }),
    });

    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setStatusMessage(payload.error || "Не удалось отправить заявку");
      const captchaResponse = await fetch("/api/captcha");
      const newCaptcha = (await captchaResponse.json()) as { question: string; token: string };
      setCaptcha(newCaptcha);
      setCaptchaAnswer("");
      setIsSubmitting(false);
      return;
    }

    setShowThanksModal(true);
    setForm({ name: "", phone: "", telegram: "", email: "", comment: "" });
    setSelectedIds([]);
    setCaptchaAnswer("");
    setConsentAccepted(false);

    const captchaResponse = await fetch("/api/captcha");
    const newCaptcha = (await captchaResponse.json()) as { question: string; token: string };
    setCaptcha(newCaptcha);

    setIsSubmitting(false);
  };

  const legalContent =
    legalModal === "privacy"
      ? content.legalPrivacy
      : legalModal === "offer"
        ? content.legalOffer
        : legalModal === "consent"
          ? content.legalConsent
          : null;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.container}>
          <a className={styles.brand} href="#top">
            <Image src="/logo.jpg" alt="Логотип НАБЛЮДЕКС" width={52} height={52} className={styles.brandLogo} />
            <div>
              <p className={styles.brandName}>{content.companyName}</p>
              <p className={styles.brandTagline}>{content.companyTagline}</p>
            </div>
          </a>

          <nav className={styles.nav}>
            {topCategories.map((category) => {
              if (category.slug === "domophones") {
                const children = categories
                  .filter((item) => item.parentSlug === "domophones")
                  .sort((a, b) => a.sortOrder - b.sortOrder);

                return (
                  <div
                    className={styles.dropdown}
                    key={category.id}
                    onMouseEnter={() => setIsDomophoneOpen(true)}
                    onMouseLeave={() => setIsDomophoneOpen(false)}
                  >
                    <button
                      type="button"
                      className={styles.navLink}
                      onClick={() => setIsDomophoneOpen((prev) => !prev)}
                    >
                      {category.name}
                    </button>
                    {isDomophoneOpen && (
                      <div className={styles.dropdownMenu}>
                        {children.map((child) => (
                          <button
                            key={child.id}
                            type="button"
                            className={styles.dropdownItem}
                            onClick={() => handleMenuCategoryClick(child.slug)}
                          >
                            {child.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <button
                  type="button"
                  className={styles.navLink}
                  key={category.id}
                  onClick={() => handleMenuCategoryClick(category.slug)}
                >
                  {category.name}
                </button>
              );
            })}

            <button type="button" className={styles.callButton} onClick={() => scrollToId("request")}> 
              {content.callButtonText}
            </button>
          </nav>
        </div>
      </header>

      <main id="top">
        <section className={`${styles.hero} ${styles.reveal}`}>
          <div className={styles.container}>
            <span className={styles.heroBadge}>{content.heroBadge}</span>
            <h1>{content.heroTitle}</h1>
            <p>{content.heroSubtitle}</p>
            <div className={styles.heroActions}>
              <button type="button" className={styles.primaryButton} onClick={() => scrollToId("products")}>
                {content.heroPrimaryCta}
              </button>
              <button type="button" className={styles.ghostButton} onClick={() => scrollToId("products")}>
                {content.heroSecondaryCta}
              </button>
            </div>
          </div>
        </section>

        <section className={`${styles.advantages} ${styles.reveal}`}>
          <div className={styles.container}>
            <h2>{content.advantagesTitle}</h2>
            <div className={styles.advGrid}>
              {content.advantages.map((item) => (
                <article key={item.id} className={styles.advCard}>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="products" className={`${styles.products} ${styles.reveal}`}>
          <div className={styles.container}>
            <h2>{content.productsTitle}</h2>
            <p className={styles.sectionLead}>{content.productsSubtitle}</p>

            <div className={styles.switcherWrap}>
              <div className={styles.categorySwitcher}>
                {leafCategories.map((category) => (
                  <button
                    key={category.id}
                    id={`category-${category.slug}`}
                    type="button"
                    className={`${styles.categoryButton} ${activeCategory === category.slug ? styles.categoryButtonActive : ""}`}
                    onClick={() => setActiveCategory(category.slug)}
                  >
                    {category.name}
                  </button>
                ))}
              </div>

              <div className={styles.sorter}>
                <span>Сортировка:</span>
                <button
                  type="button"
                  className={sortMode === "asc" ? styles.sortActive : ""}
                  onClick={() => setSortMode("asc")}
                >
                  По возрастанию цены
                </button>
                <button
                  type="button"
                  className={sortMode === "desc" ? styles.sortActive : ""}
                  onClick={() => setSortMode("desc")}
                >
                  По убыванию цены
                </button>
              </div>
            </div>

            <div className={styles.cardsRow}>
              {activeProducts.map((product) => {
                const selected = selectedIds.includes(product.id);
                const displayImages = getDisplayImages(product);
                const img = currentImage(product);

                return (
                  <article key={product.id} className={styles.productCard}>
                    <div className={styles.imageWrap}>
                      <img
                        src={img}
                        alt={product.title}
                        className={styles.productImage}
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.src = "/placeholders/camera.svg";
                        }}
                      />

                      {displayImages.length > 1 && (
                        <>
                          <button
                            type="button"
                            className={`${styles.imageNav} ${styles.imageNavLeft}`}
                            onClick={() => cycleImage(product, "prev")}
                          >
                            ‹
                          </button>
                          <button
                            type="button"
                            className={`${styles.imageNav} ${styles.imageNavRight}`}
                            onClick={() => cycleImage(product, "next")}
                          >
                            ›
                          </button>
                        </>
                      )}
                    </div>

                    <div className={styles.cardContent}>
                      <p className={styles.categoryLabel}>{categoryNameMap[product.categorySlug]}</p>
                      <h3>{product.title}</h3>
                      <p className={styles.price}>{toPriceLabel(product.price)}</p>
                      <p>{product.description}</p>
                      <p className={styles.specs}>{product.specs}</p>
                      <p className={styles.article}>Артикул: {product.article}</p>

                      <button
                        type="button"
                        className={`${styles.likeButton} ${selected ? styles.likeButtonActive : ""}`}
                        onClick={() => toggleFavorite(product.id)}
                      >
                        {selected ? "Убрать из избранного" : "Понравилось"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="request" className={`${styles.request} ${styles.reveal}`}>
          <div className={styles.container}>
            <h2>{content.requestTitle}</h2>
            <p className={styles.sectionLead}>{content.requestSubtitle}</p>

            <div className={styles.requestLayout}>
              <div className={styles.selectedPreview}>
                <h3>Выбранные товары</h3>
                {selectedProducts.length ? (
                  <div className={styles.selectedGrid}>
                    {selectedProducts.map((product) => (
                      <div key={product.id} className={styles.selectedItem}>
                        <Image
                          src={product.images[0] || "/placeholders/camera.svg"}
                          alt={product.title}
                          width={58}
                          height={58}
                          unoptimized
                        />
                        <div>
                          <p>{product.title}</p>
                          <span>{toPriceLabel(product.price)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.emptyState}>Вы пока ничего не выбрали. Отметьте товары в карточках выше.</p>
                )}
              </div>

              <form className={styles.form} onSubmit={submitLead}>
                <label>
                  Имя
                  <input
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Как к вам обращаться"
                  />
                </label>

                <label>
                  Телефон *
                  <input
                    value={form.phone}
                    onChange={(e) => setForm((prev) => ({ ...prev, phone: formatPhoneInput(e.target.value) }))}
                    placeholder="+7 (___) ___-__-__"
                    required
                  />
                </label>

                <label>
                  Telegram
                  <input
                    value={form.telegram}
                    onChange={(e) => setForm((prev) => ({ ...prev, telegram: e.target.value }))}
                    placeholder="@username"
                  />
                </label>

                <label>
                  Email
                  <input
                    value={form.email}
                    onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="name@example.com"
                    type="email"
                  />
                </label>

                <label>
                  Комментарий
                  <textarea
                    value={form.comment}
                    onChange={(e) => setForm((prev) => ({ ...prev, comment: e.target.value }))}
                    placeholder="Опишите задачу: квартира, дом, офис, число камер и т.д."
                  />
                </label>

                <label>
                  Простая капча: {captcha?.question || "..."} = ?
                  <input value={captchaAnswer} onChange={(e) => setCaptchaAnswer(e.target.value)} required />
                </label>

                <label className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={consentAccepted}
                    onChange={(e) => setConsentAccepted(e.target.checked)}
                    required
                  />
                  <span>
                    Согласен(а) с обработкой персональных данных и условиями оферты.
                  </span>
                </label>

                {statusMessage && <p className={styles.errorText}>{statusMessage}</p>}

                <button type="submit" className={styles.primaryButton} disabled={isSubmitting}>
                  {isSubmitting ? "Отправляем..." : "Отправить заявку"}
                </button>

                <div className={styles.legalLinks}>
                  <button type="button" onClick={() => setLegalModal("privacy")}>Политика конфиденциальности</button>
                  <button type="button" onClick={() => setLegalModal("offer")}>Публичная оферта</button>
                  <button type="button" onClick={() => setLegalModal("consent")}>Согласие на обработку ПДн</button>
                </div>
              </form>
            </div>
          </div>
        </section>

        <section className={`${styles.faq} ${styles.reveal}`}>
          <div className={styles.container}>
            <h2>{content.faqTitle}</h2>
            <div className={styles.faqList}>
              {content.faq.map((item) => (
                <details key={item.id} className={styles.faqItem}>
                  <summary>{item.question}</summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerGrid}>
            <div>
              <p className={styles.brandName}>{content.companyName}</p>
              <p>{content.footerText}</p>
            </div>
            <div>
              <h4>Контакты</h4>
              <p>Телефон: {content.contacts.phone}</p>
              <p>Email: {content.contacts.email}</p>
              <p>Telegram: {content.contacts.telegram}</p>
              <p>Адрес: {content.contacts.address}</p>
              <p>Режим работы: {content.contacts.workHours}</p>
            </div>
            <div>
              <h4>Локация</h4>
              {content.contacts.mapMode === "yandex" && content.contacts.yandexEmbedUrl ? (
                <iframe
                  src={content.contacts.yandexEmbedUrl}
                  className={styles.mapFrame}
                  loading="lazy"
                  title="Карта"
                />
              ) : (
                <p>{content.contacts.yandexAddressText}</p>
              )}
            </div>
          </div>
        </div>
      </footer>

      {showThanksModal && (
        <div className={styles.overlay} onClick={() => setShowThanksModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>Спасибо, заявка принята</h3>
            <p>Мы свяжемся с вами в ближайшее время и подготовим предложение под ваш объект.</p>
            <button type="button" className={styles.primaryButton} onClick={() => setShowThanksModal(false)}>
              Закрыть
            </button>
          </div>
        </div>
      )}

      {legalContent && (
        <div className={styles.overlay} onClick={() => setLegalModal(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>{legalContent.title}</h3>
            <div dangerouslySetInnerHTML={{ __html: legalContent.contentHtml }} />
            <button type="button" className={styles.primaryButton} onClick={() => setLegalModal(null)}>
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
