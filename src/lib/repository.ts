import { cloneDefaultSiteData, defaultSiteData } from "@/lib/default-data";
import { getSupabaseAdminClient, getSupabasePublicClient } from "@/lib/supabase";
import { Category, Product, SiteContent, SiteData } from "@/lib/types";

const CONTENT_TABLE = "site_content";
const CATEGORIES_TABLE = "categories";
const PRODUCTS_TABLE = "products";

function normalizeCategory(input: Partial<Category>): Category {
  return {
    id: input.id ?? crypto.randomUUID(),
    slug: input.slug ?? "",
    name: input.name ?? "",
    parentSlug: input.parentSlug ?? null,
    sortOrder: Number(input.sortOrder ?? 0),
  };
}

function normalizeProduct(input: Partial<Product>): Product {
  return {
    id: input.id ?? crypto.randomUUID(),
    categorySlug: input.categorySlug ?? "",
    title: input.title ?? "",
    price: Number(input.price ?? 0),
    description: input.description ?? "",
    specs: input.specs ?? "",
    article: input.article ?? "",
    images: Array.isArray(input.images) ? input.images.filter(Boolean) : [],
    sortOrder: Number(input.sortOrder ?? 0),
  };
}

export async function getSiteData(): Promise<SiteData> {
  const fallback = cloneDefaultSiteData();
  const supabase = getSupabasePublicClient();

  if (!supabase) {
    return fallback;
  }

  try {
    const [contentResult, categoriesResult, productsResult] = await Promise.all([
      supabase.from(CONTENT_TABLE).select("content").eq("locale", "ru").maybeSingle(),
      supabase.from(CATEGORIES_TABLE).select("*").order("sort_order", { ascending: true }),
      supabase.from(PRODUCTS_TABLE).select("*").order("sort_order", { ascending: true }),
    ]);

    const loadedContent =
      contentResult.data?.content && typeof contentResult.data.content === "object"
        ? ({ ...defaultSiteData.content, ...(contentResult.data.content as Partial<SiteContent>) } as SiteContent)
        : fallback.content;

    const loadedCategories =
      categoriesResult.error || !categoriesResult.data?.length
        ? fallback.categories
        : categoriesResult.data.map((item) =>
            normalizeCategory({
              id: item.id,
              slug: item.slug,
              name: item.name,
              parentSlug: item.parent_slug,
              sortOrder: item.sort_order,
            }),
          );

    const loadedProducts =
      productsResult.error || !productsResult.data?.length
        ? fallback.products
        : productsResult.data.map((item) =>
            normalizeProduct({
              id: item.id,
              categorySlug: item.category_slug,
              title: item.title,
              price: item.price,
              description: item.description,
              specs: item.specs,
              article: item.article,
              images: item.images,
              sortOrder: item.sort_order,
            }),
          );

    return {
      content: loadedContent,
      categories: loadedCategories,
      products: loadedProducts,
    };
  } catch {
    return fallback;
  }
}

function getAdminOrThrow() {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    throw new Error("SUPABASE_NOT_CONFIGURED");
  }
  return supabase;
}

export async function saveSiteContent(content: SiteContent): Promise<void> {
  const supabase = getAdminOrThrow();
  const { error } = await supabase.from(CONTENT_TABLE).upsert(
    {
      locale: "ru",
      content,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "locale" },
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function saveCategory(category: Category): Promise<void> {
  const supabase = getAdminOrThrow();
  const { error } = await supabase.from(CATEGORIES_TABLE).upsert(
    {
      id: category.id,
      slug: category.slug,
      name: category.name,
      parent_slug: category.parentSlug,
      sort_order: category.sortOrder,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteCategory(categoryId: string): Promise<void> {
  const supabase = getAdminOrThrow();
  const { error } = await supabase.from(CATEGORIES_TABLE).delete().eq("id", categoryId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function saveProduct(product: Product): Promise<void> {
  const supabase = getAdminOrThrow();
  const { error } = await supabase.from(PRODUCTS_TABLE).upsert(
    {
      id: product.id,
      category_slug: product.categorySlug,
      title: product.title,
      price: product.price,
      description: product.description,
      specs: product.specs,
      article: product.article,
      images: product.images,
      sort_order: product.sortOrder,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteProduct(productId: string): Promise<void> {
  const supabase = getAdminOrThrow();
  const { error } = await supabase.from(PRODUCTS_TABLE).delete().eq("id", productId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function reorderCategories(ids: string[]): Promise<void> {
  const supabase = getAdminOrThrow();
  await Promise.all(
    ids.map((id, index) =>
      supabase
        .from(CATEGORIES_TABLE)
        .update({ sort_order: index + 1, updated_at: new Date().toISOString() })
        .eq("id", id),
    ),
  );
}

export async function reorderProducts(ids: string[]): Promise<void> {
  const supabase = getAdminOrThrow();
  await Promise.all(
    ids.map((id, index) =>
      supabase
        .from(PRODUCTS_TABLE)
        .update({ sort_order: index + 1, updated_at: new Date().toISOString() })
        .eq("id", id),
    ),
  );
}
