"use client";

import { ChangeEvent, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/client-utils";
import { Category, Product, SiteContent, SiteData } from "@/lib/types";
import styles from "./admin.module.css";

interface AdminPanelProps {
  initialData: SiteData;
}

type AdminTab = "content" | "categories" | "products";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function createNewCategory(order: number): Category {
  return {
    id: crypto.randomUUID(),
    slug: `new-category-${Date.now()}`,
    name: "Новая категория",
    parentSlug: null,
    sortOrder: order,
  };
}

function createNewProduct(categorySlug: string, order: number): Product {
  return {
    id: crypto.randomUUID(),
    categorySlug,
    title: "Новый товар",
    price: 1000,
    description: "Описание товара",
    specs: "Характеристики",
    article: `NEW-${Date.now()}`,
    images: ["/placeholders/camera.svg"],
    sortOrder: order,
  };
}

function moveArray<T>(list: T[], fromIndex: number, toIndex: number): T[] {
  const copy = [...list];
  const [item] = copy.splice(fromIndex, 1);
  copy.splice(toIndex, 0, item);
  return copy;
}

function RichEditor({
  value,
  onChange,
  minHeight = 160,
}: {
  value: string;
  onChange: (value: string) => void;
  minHeight?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  const run = (command: string) => {
    document.execCommand(command);
    if (ref.current) {
      onChange(ref.current.innerHTML);
    }
  };

  return (
    <div className={styles.editorWrap}>
      <div className={styles.editorToolbar}>
        <button type="button" onClick={() => run("bold")}>B</button>
        <button type="button" onClick={() => run("italic")}>I</button>
        <button type="button" onClick={() => run("insertUnorderedList")}>• Список</button>
        <button type="button" onClick={() => run("removeFormat")}>Очистить</button>
      </div>
      <div
        ref={ref}
        className={styles.editorBody}
        style={{ minHeight }}
        contentEditable
        suppressContentEditableWarning
        dangerouslySetInnerHTML={{ __html: value }}
        onInput={(e) => onChange((e.target as HTMLDivElement).innerHTML)}
      />
    </div>
  );
}

export function AdminPanel({ initialData }: AdminPanelProps) {
  const router = useRouter();
  const [tab, setTab] = useState<AdminTab>("content");
  const [content, setContent] = useState<SiteContent>(() => clone(initialData.content));
  const [categories, setCategories] = useState<Category[]>(() => [...initialData.categories].sort((a, b) => a.sortOrder - b.sortOrder));
  const [products, setProducts] = useState<Product[]>(() => [...initialData.products].sort((a, b) => a.sortOrder - b.sortOrder));
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [activeProductCategory, setActiveProductCategory] = useState(() => initialData.categories[0]?.slug ?? "");
  const [dragCategoryId, setDragCategoryId] = useState<string | null>(null);
  const [dragProductId, setDragProductId] = useState<string | null>(null);

  const productCategories = useMemo(
    () => categories.filter((cat) => !categories.some((inner) => inner.parentSlug === cat.slug)),
    [categories],
  );

  const filteredProducts = useMemo(
    () => products.filter((item) => item.categorySlug === activeProductCategory).sort((a, b) => a.sortOrder - b.sortOrder),
    [products, activeProductCategory],
  );

  const updateContent = <K extends keyof SiteContent>(key: K, value: SiteContent[K]) => {
    setContent((prev) => ({ ...prev, [key]: value }));
  };

  const saveContent = async () => {
    setBusy(true);
    setStatus("");
    const response = await fetch("/api/admin/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(content),
    });

    setBusy(false);
    setStatus(response.ok ? "Контент сохранен" : "Ошибка сохранения контента");
    router.refresh();
  };

  const saveCategory = async (category: Category) => {
    setBusy(true);
    const response = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(category),
    });
    setBusy(false);
    setStatus(response.ok ? "Категория сохранена" : "Не удалось сохранить категорию");
    router.refresh();
  };

  const removeCategory = async (id: string) => {
    if (!confirm("Удалить категорию?")) return;

    const response = await fetch("/api/admin/categories", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (response.ok) {
      setCategories((prev) => prev.filter((item) => item.id !== id));
      setStatus("Категория удалена");
      router.refresh();
    } else {
      setStatus("Не удалось удалить категорию");
    }
  };

  const saveCategoriesOrder = async () => {
    const ids = categories.map((item) => item.id);
    const response = await fetch("/api/admin/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "categories", ids }),
    });
    setStatus(response.ok ? "Порядок категорий сохранен" : "Не удалось сохранить порядок категорий");
    router.refresh();
  };

  const saveProduct = async (product: Product) => {
    setBusy(true);
    const response = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product),
    });
    setBusy(false);
    setStatus(response.ok ? "Товар сохранен" : "Не удалось сохранить товар");
    router.refresh();
  };

  const removeProduct = async (id: string) => {
    if (!confirm("Удалить товар?")) return;

    const response = await fetch("/api/admin/products", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (response.ok) {
      setProducts((prev) => prev.filter((item) => item.id !== id));
      setStatus("Товар удален");
      router.refresh();
    } else {
      setStatus("Не удалось удалить товар");
    }
  };

  const saveProductsOrder = async () => {
    const ids = [...products].sort((a, b) => a.sortOrder - b.sortOrder).map((item) => item.id);
    const response = await fetch("/api/admin/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "products", ids }),
    });

    setStatus(response.ok ? "Порядок товаров сохранен" : "Не удалось сохранить порядок товаров");
    router.refresh();
  };

  const uploadImage = async (event: ChangeEvent<HTMLInputElement>, productId: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const body = new FormData();
    body.append("file", file);
    const response = await fetch("/api/admin/upload", {
      method: "POST",
      body,
    });

    const payload = (await response.json()) as { url?: string; error?: string };
    if (!response.ok || !payload.url) {
      setStatus(payload.error || "Загрузка не удалась");
      return;
    }

    setProducts((prev) =>
      prev.map((product) =>
        product.id === productId ? { ...product, images: [...product.images, payload.url as string] } : product,
      ),
    );

    setStatus("Изображение загружено, сохраните товар");
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <main className={styles.adminPage}>
      <div className={styles.adminContainer}>
        <div className={styles.adminTop}>
          <h1>Админка НАБЛЮДЕКС</h1>
          <div className={styles.adminTopActions}>
            <button type="button" onClick={() => router.push("/")}>На сайт</button>
            <button type="button" onClick={handleLogout}>Выйти</button>
          </div>
        </div>

        <div className={styles.tabs}>
          <button className={tab === "content" ? styles.tabActive : ""} onClick={() => setTab("content")}>
            Контент
          </button>
          <button className={tab === "categories" ? styles.tabActive : ""} onClick={() => setTab("categories")}>
            Категории
          </button>
          <button className={tab === "products" ? styles.tabActive : ""} onClick={() => setTab("products")}>
            Товары
          </button>
        </div>

        {status && <p className={styles.status}>{status}</p>}

        {tab === "content" && (
          <section className={styles.block}>
            <h2>Тексты, контакты, SEO и юридические модалки</h2>

            <div className={styles.grid2}>
              <label>
                Название компании
                <input value={content.companyName} onChange={(e) => updateContent("companyName", e.target.value)} />
              </label>
              <label>
                Подзаголовок компании
                <input value={content.companyTagline} onChange={(e) => updateContent("companyTagline", e.target.value)} />
              </label>

              <label>
                Заголовок hero
                <textarea value={content.heroTitle} onChange={(e) => updateContent("heroTitle", e.target.value)} />
              </label>
              <label>
                Подзаголовок hero
                <textarea value={content.heroSubtitle} onChange={(e) => updateContent("heroSubtitle", e.target.value)} />
              </label>

              <label>
                Hero badge
                <input value={content.heroBadge} onChange={(e) => updateContent("heroBadge", e.target.value)} />
              </label>
              <label>
                Текст кнопки звонка
                <input value={content.callButtonText} onChange={(e) => updateContent("callButtonText", e.target.value)} />
              </label>

              <label>
                CTA 1
                <input value={content.heroPrimaryCta} onChange={(e) => updateContent("heroPrimaryCta", e.target.value)} />
              </label>
              <label>
                CTA 2
                <input value={content.heroSecondaryCta} onChange={(e) => updateContent("heroSecondaryCta", e.target.value)} />
              </label>

              <label>
                Заголовок блока товаров
                <input value={content.productsTitle} onChange={(e) => updateContent("productsTitle", e.target.value)} />
              </label>
              <label>
                Описание блока товаров
                <textarea value={content.productsSubtitle} onChange={(e) => updateContent("productsSubtitle", e.target.value)} />
              </label>

              <label>
                Заголовок заявки
                <input value={content.requestTitle} onChange={(e) => updateContent("requestTitle", e.target.value)} />
              </label>
              <label>
                Описание заявки
                <textarea value={content.requestSubtitle} onChange={(e) => updateContent("requestSubtitle", e.target.value)} />
              </label>

              <label>
                Заголовок преимуществ
                <input value={content.advantagesTitle} onChange={(e) => updateContent("advantagesTitle", e.target.value)} />
              </label>
              <label>
                Заголовок FAQ
                <input value={content.faqTitle} onChange={(e) => updateContent("faqTitle", e.target.value)} />
              </label>

              <label>
                SEO title
                <input value={content.seoTitle} onChange={(e) => updateContent("seoTitle", e.target.value)} />
              </label>
              <label>
                SEO description
                <textarea value={content.seoDescription} onChange={(e) => updateContent("seoDescription", e.target.value)} />
              </label>
            </div>

            <h3>Контакты</h3>
            <div className={styles.grid2}>
              <label>
                Телефон
                <input
                  value={content.contacts.phone}
                  onChange={(e) =>
                    updateContent("contacts", {
                      ...content.contacts,
                      phone: e.target.value,
                    })
                  }
                />
              </label>
              <label>
                Email
                <input
                  value={content.contacts.email}
                  onChange={(e) =>
                    updateContent("contacts", {
                      ...content.contacts,
                      email: e.target.value,
                    })
                  }
                />
              </label>
              <label>
                Telegram
                <input
                  value={content.contacts.telegram}
                  onChange={(e) =>
                    updateContent("contacts", {
                      ...content.contacts,
                      telegram: e.target.value,
                    })
                  }
                />
              </label>
              <label>
                Адрес
                <input
                  value={content.contacts.address}
                  onChange={(e) =>
                    updateContent("contacts", {
                      ...content.contacts,
                      address: e.target.value,
                    })
                  }
                />
              </label>
              <label>
                График работы
                <input
                  value={content.contacts.workHours}
                  onChange={(e) =>
                    updateContent("contacts", {
                      ...content.contacts,
                      workHours: e.target.value,
                    })
                  }
                />
              </label>
              <label>
                Режим карты
                <select
                  value={content.contacts.mapMode}
                  onChange={(e) =>
                    updateContent("contacts", {
                      ...content.contacts,
                      mapMode: e.target.value as "text" | "yandex",
                    })
                  }
                >
                  <option value="text">Текстовый адрес</option>
                  <option value="yandex">Яндекс карта iframe</option>
                </select>
              </label>
              <label>
                Текст для блока карты
                <textarea
                  value={content.contacts.yandexAddressText}
                  onChange={(e) =>
                    updateContent("contacts", {
                      ...content.contacts,
                      yandexAddressText: e.target.value,
                    })
                  }
                />
              </label>
              <label>
                Яндекс iframe URL
                <textarea
                  value={content.contacts.yandexEmbedUrl}
                  onChange={(e) =>
                    updateContent("contacts", {
                      ...content.contacts,
                      yandexEmbedUrl: e.target.value,
                    })
                  }
                />
              </label>
            </div>

            <h3>Преимущества</h3>
            <div className={styles.simpleList}>
              {content.advantages.map((item, index) => (
                <div key={item.id} className={styles.inlineCard}>
                  <label>
                    Заголовок
                    <input
                      value={item.title}
                      onChange={(e) => {
                        const next = clone(content.advantages);
                        next[index].title = e.target.value;
                        updateContent("advantages", next);
                      }}
                    />
                  </label>
                  <label>
                    Текст
                    <textarea
                      value={item.text}
                      onChange={(e) => {
                        const next = clone(content.advantages);
                        next[index].text = e.target.value;
                        updateContent("advantages", next);
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const next = content.advantages.filter((_, i) => i !== index);
                      updateContent("advantages", next);
                    }}
                  >
                    Удалить
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() =>
                updateContent("advantages", [
                  ...content.advantages,
                  { id: crypto.randomUUID(), title: "Новое преимущество", text: "Текст преимущества" },
                ])
              }
            >
              Добавить преимущество
            </button>

            <h3>FAQ</h3>
            <div className={styles.simpleList}>
              {content.faq.map((item, index) => (
                <div key={item.id} className={styles.inlineCard}>
                  <label>
                    Вопрос
                    <input
                      value={item.question}
                      onChange={(e) => {
                        const next = clone(content.faq);
                        next[index].question = e.target.value;
                        updateContent("faq", next);
                      }}
                    />
                  </label>
                  <label>
                    Ответ
                    <textarea
                      value={item.answer}
                      onChange={(e) => {
                        const next = clone(content.faq);
                        next[index].answer = e.target.value;
                        updateContent("faq", next);
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const next = content.faq.filter((_, i) => i !== index);
                      updateContent("faq", next);
                    }}
                  >
                    Удалить
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() =>
                updateContent("faq", [
                  ...content.faq,
                  { id: crypto.randomUUID(), question: "Новый вопрос", answer: "Новый ответ" },
                ])
              }
            >
              Добавить вопрос
            </button>

            <h3>Юридические модалки (визуальный редактор)</h3>
            <label>
              Политика конфиденциальности: заголовок
              <input
                value={content.legalPrivacy.title}
                onChange={(e) =>
                  updateContent("legalPrivacy", {
                    ...content.legalPrivacy,
                    title: e.target.value,
                  })
                }
              />
            </label>
            <RichEditor
              value={content.legalPrivacy.contentHtml}
              onChange={(value) =>
                updateContent("legalPrivacy", {
                  ...content.legalPrivacy,
                  contentHtml: value,
                })
              }
            />

            <label>
              Оферта: заголовок
              <input
                value={content.legalOffer.title}
                onChange={(e) =>
                  updateContent("legalOffer", {
                    ...content.legalOffer,
                    title: e.target.value,
                  })
                }
              />
            </label>
            <RichEditor
              value={content.legalOffer.contentHtml}
              onChange={(value) =>
                updateContent("legalOffer", {
                  ...content.legalOffer,
                  contentHtml: value,
                })
              }
            />

            <label>
              Согласие: заголовок
              <input
                value={content.legalConsent.title}
                onChange={(e) =>
                  updateContent("legalConsent", {
                    ...content.legalConsent,
                    title: e.target.value,
                  })
                }
              />
            </label>
            <RichEditor
              value={content.legalConsent.contentHtml}
              onChange={(value) =>
                updateContent("legalConsent", {
                  ...content.legalConsent,
                  contentHtml: value,
                })
              }
            />

            <button type="button" onClick={saveContent} disabled={busy}>
              {busy ? "Сохраняем..." : "Сохранить контент"}
            </button>
          </section>
        )}

        {tab === "categories" && (
          <section className={styles.block}>
            <h2>Категории (можно перетаскивать)</h2>
            <div className={styles.simpleList}>
              {categories.map((category, index) => (
                <div
                  key={category.id}
                  className={styles.inlineCard}
                  draggable
                  onDragStart={() => setDragCategoryId(category.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (!dragCategoryId || dragCategoryId === category.id) return;
                    const fromIndex = categories.findIndex((item) => item.id === dragCategoryId);
                    const toIndex = categories.findIndex((item) => item.id === category.id);
                    if (fromIndex < 0 || toIndex < 0) return;
                    const moved = moveArray(categories, fromIndex, toIndex).map((item, idx) => ({
                      ...item,
                      sortOrder: idx + 1,
                    }));
                    setCategories(moved);
                    setDragCategoryId(null);
                  }}
                >
                  <p className={styles.dragTitle}>Позиция: {index + 1}</p>
                  <label>
                    Название
                    <input
                      value={category.name}
                      onChange={(e) => {
                        const next = clone(categories);
                        next[index].name = e.target.value;
                        next[index].slug = slugify(e.target.value);
                        setCategories(next);
                      }}
                    />
                  </label>
                  <label>
                    Slug
                    <input
                      value={category.slug}
                      onChange={(e) => {
                        const next = clone(categories);
                        next[index].slug = slugify(e.target.value);
                        setCategories(next);
                      }}
                    />
                  </label>
                  <label>
                    Родитель
                    <select
                      value={category.parentSlug || ""}
                      onChange={(e) => {
                        const next = clone(categories);
                        next[index].parentSlug = e.target.value || null;
                        setCategories(next);
                      }}
                    >
                      <option value="">Без родителя</option>
                      {categories
                        .filter((item) => item.slug !== category.slug)
                        .map((item) => (
                          <option key={item.id} value={item.slug}>
                            {item.name}
                          </option>
                        ))}
                    </select>
                  </label>
                  <div className={styles.inlineActions}>
                    <button type="button" onClick={() => saveCategory(category)}>
                      Сохранить
                    </button>
                    <button type="button" onClick={() => removeCategory(category.id)}>
                      Удалить
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.rowActions}>
              <button
                type="button"
                onClick={() => setCategories((prev) => [...prev, createNewCategory(prev.length + 1)])}
              >
                Добавить категорию
              </button>
              <button type="button" onClick={saveCategoriesOrder}>
                Сохранить порядок
              </button>
            </div>
          </section>
        )}

        {tab === "products" && (
          <section className={styles.block}>
            <h2>Товары (перетаскивание внутри категории)</h2>
            <label>
              Активная категория
              <select value={activeProductCategory} onChange={(e) => setActiveProductCategory(e.target.value)}>
                {productCategories.map((category) => (
                  <option key={category.id} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <div className={styles.simpleList}>
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className={styles.inlineCard}
                  draggable
                  onDragStart={() => setDragProductId(product.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (!dragProductId || dragProductId === product.id) return;

                    const visible = filteredProducts;
                    const from = visible.findIndex((item) => item.id === dragProductId);
                    const to = visible.findIndex((item) => item.id === product.id);
                    if (from < 0 || to < 0) return;

                    const movedVisible = moveArray(visible, from, to).map((item, index) => ({
                      ...item,
                      sortOrder: index + 1,
                    }));

                    setProducts((prev) => {
                      const rest = prev.filter((item) => item.categorySlug !== activeProductCategory);
                      return [...rest, ...movedVisible].sort((a, b) => a.sortOrder - b.sortOrder);
                    });

                    setDragProductId(null);
                  }}
                >
                  <p className={styles.dragTitle}>ID: {product.id}</p>
                  <label>
                    Название
                    <input
                      value={product.title}
                      onChange={(e) =>
                        setProducts((prev) => prev.map((item) => (item.id === product.id ? { ...item, title: e.target.value } : item)))
                      }
                    />
                  </label>

                  <div className={styles.grid2}>
                    <label>
                      Цена
                      <input
                        type="number"
                        value={product.price}
                        onChange={(e) =>
                          setProducts((prev) =>
                            prev.map((item) => (item.id === product.id ? { ...item, price: Number(e.target.value) || 0 } : item)),
                          )
                        }
                      />
                    </label>
                    <label>
                      Артикул
                      <input
                        value={product.article}
                        onChange={(e) =>
                          setProducts((prev) => prev.map((item) => (item.id === product.id ? { ...item, article: e.target.value } : item)))
                        }
                      />
                    </label>
                  </div>

                  <label>
                    Описание
                    <textarea
                      value={product.description}
                      onChange={(e) =>
                        setProducts((prev) =>
                          prev.map((item) => (item.id === product.id ? { ...item, description: e.target.value } : item)),
                        )
                      }
                    />
                  </label>

                  <label>
                    Характеристики
                    <textarea
                      value={product.specs}
                      onChange={(e) =>
                        setProducts((prev) => prev.map((item) => (item.id === product.id ? { ...item, specs: e.target.value } : item)))
                      }
                    />
                  </label>

                  <label>
                    Категория
                    <select
                      value={product.categorySlug}
                      onChange={(e) =>
                        setProducts((prev) =>
                          prev.map((item) =>
                            item.id === product.id ? { ...item, categorySlug: e.target.value, sortOrder: item.sortOrder } : item,
                          ),
                        )
                      }
                    >
                      {productCategories.map((category) => (
                        <option key={category.id} value={category.slug}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div>
                    <p>Изображения</p>
                    {product.images.map((url, idx) => (
                      <div key={`${product.id}-${idx}`} className={styles.imageRow}>
                        <input
                          value={url}
                          onChange={(e) =>
                            setProducts((prev) =>
                              prev.map((item) => {
                                if (item.id !== product.id) return item;
                                const images = [...item.images];
                                images[idx] = e.target.value;
                                return { ...item, images };
                              }),
                            )
                          }
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setProducts((prev) =>
                              prev.map((item) => {
                                if (item.id !== product.id) return item;
                                return { ...item, images: item.images.filter((_, i) => i !== idx) };
                              }),
                            )
                          }
                        >
                          Удалить
                        </button>
                      </div>
                    ))}
                    <div className={styles.inlineActions}>
                      <button
                        type="button"
                        onClick={() =>
                          setProducts((prev) =>
                            prev.map((item) =>
                              item.id === product.id ? { ...item, images: [...item.images, "/placeholders/camera.svg"] } : item,
                            ),
                          )
                        }
                      >
                        Добавить URL
                      </button>
                      <label className={styles.uploadLabel}>
                        Загрузить файл
                        <input type="file" accept="image/*" onChange={(e) => uploadImage(e, product.id)} />
                      </label>
                    </div>
                  </div>

                  <div className={styles.inlineActions}>
                    <button type="button" onClick={() => saveProduct(product)}>
                      Сохранить товар
                    </button>
                    <button type="button" onClick={() => removeProduct(product.id)}>
                      Удалить товар
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.rowActions}>
              <button
                type="button"
                onClick={() =>
                  setProducts((prev) => [
                    ...prev,
                    createNewProduct(activeProductCategory, filteredProducts.length + 1),
                  ])
                }
              >
                Добавить товар
              </button>
              <button type="button" onClick={saveProductsOrder}>
                Сохранить порядок
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
