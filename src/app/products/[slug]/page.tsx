import type { Metadata } from 'next';
import ProductDetailClient from './ProductDetailClient';
import { queryDb } from '@/lib/db';
import { isBookInStock } from '@/lib/stock';
import { redisGetJson, redisSetJson } from '@/lib/redis';
import { serializeJsonLd } from '@/lib/jsonLd';

// Next.js ISR: cache rendered HTML on server for 60 seconds (drastically lowers CPU usage)
export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

// In-process cache to avoid DB roundtrips for repeated requests
const metaMemoryCache = new Map<string, { data: any; timestamp: number }>();
const META_TTL_MS = 60_000; // 1 minute local process cache

export function invalidateMetaMemoryCache(slug?: string) {
  if (slug) {
    metaMemoryCache.delete(String(slug).toLowerCase().trim());
  } else {
    metaMemoryCache.clear();
  }
}

function trimDescription(text: string | null | undefined, maxChars = 155): string {
  if (!text) return '';
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxChars) return clean;
  const cut = clean.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(' ');
  return lastSpace > 100 ? `${cut.slice(0, lastSpace)}...` : `${cut}...`;
}

async function getBookMeta(slug: string) {
  const rawSlug = String(slug || '').trim();
  const cleanSlug = rawSlug.toLowerCase();
  const decodedSlug = decodeURIComponent(cleanSlug).trim();
  const hyphenSlug = decodedSlug.replace(/[^a-z0-9]+/g, '-');
  const spaceSlug = decodedSlug.replace(/[-_]+/g, ' ');
  const now = Date.now();

  // 1. Check local process memory cache
  const mem = metaMemoryCache.get(cleanSlug) || metaMemoryCache.get(hyphenSlug);
  if (mem && now - mem.timestamp < META_TTL_MS) {
    return mem.data;
  }

  // 2. Check Redis cache
  try {
    const redisVal = (await redisGetJson<any>(`book_meta:${cleanSlug}`)) || (await redisGetJson<any>(`book_meta:${hyphenSlug}`));
    if (redisVal) {
      metaMemoryCache.set(cleanSlug, { data: redisVal, timestamp: now });
      metaMemoryCache.set(hyphenSlug, { data: redisVal, timestamp: now });
      return redisVal;
    }
  } catch {}

  // 3. Fall back to PostgreSQL query
  try {
    const res = await queryDb(
      `SELECT b.id, b.slug, b.title, b.description,
              b.category_id,
              b.subject,
              b.brand, b.fabric, b.fit, b.sleeve, b.pattern, b.care,
              b.is_combo, b.combo_items, b.sizes_available, b.variants, b.images,
              CASE
                WHEN b.cover_image IS NULL OR b.cover_image = '' THEN NULL
                WHEN b.cover_image LIKE 'data:%' THEN NULL
                WHEN length(b.cover_image) > 2048 THEN NULL
                ELSE b.cover_image
              END AS cover_image,
              b.discount_price, b.price, b.status, b.stock, b.stock_tamil, b.stock_english,
              b.sample_pdf_url,
              b.updated_at,
              COALESCE(COUNT(r.id), 0)::int as review_count,
              COALESCE(AVG(r.rating), 0)::numeric(3,1) as avg_rating
       FROM books b
       LEFT JOIN reviews r ON b.id = r.book_id
       WHERE b.slug = $1 
          OR b.id = $1 
          OR lower(b.slug) = $2 
          OR lower(b.slug) = $3 
          OR lower(b.slug) = $4 
          OR lower(replace(b.title, ' ', '-')) = $3
          OR b.slug ILIKE $1 
          OR b.slug ILIKE $3
       GROUP BY b.id LIMIT 1`,
      [rawSlug, cleanSlug, hyphenSlug, spaceSlug]
    );
    if (!res.rows || res.rows.length === 0) return null;
    const row = res.rows[0];
    const safeTitle = String(row.title || '');
    const result = {
      ...row,
      brand: row.brand || "VR Men's Wear",
      fabric: row.fabric || '100% Cotton',
      fit: row.fit || 'Slim Fit',
    };

    metaMemoryCache.set(cleanSlug, { data: result, timestamp: now });
    void redisSetJson(`book_meta:${cleanSlug}`, result, 300);

    return result;
  } catch (err) {
    console.error('getBookMeta error for slug', slug, err);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getBookMeta(slug);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vrmenswear.in';

  if (!product) {
    return {
      title: "Product Not Found | VR Men's Wear",
      description: "Explore the latest premium shirts, t-shirts, trousers, and combos at VR Men's Wear.",
      robots: { index: false, follow: false },
    };
  }

  const title = `${product.title} | VR Men's Wear`;
  const desc = trimDescription(
    product.description ||
      `Shop ${product.title} at VR Men's Wear. Crafted with elite fabrics for unmatched comfort and style. Fast shipping & easy size exchanges.`,
    155
  );

  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      url: `${siteUrl}/products/${slug}`,
      images: product.cover_image ? [{ url: product.cover_image }] : [],
      siteName: "VR Men's Wear",
    },
  };
}

function mapBookToClientProduct(book: any) {
  if (!book) return null;
  const mrp = Number(book.price) || 0;
  const rawSale = book.discount_price == null || book.discount_price === '' ? NaN : Number(book.discount_price);
  const hasSale = Number.isFinite(rawSale) && rawSale > 0 && rawSale < mrp;
  const price = hasSale ? rawSale : mrp;
  const discount = hasSale && mrp > 0 ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const safeImg =
    book.cover_image &&
    !String(book.cover_image).startsWith('data:') &&
    String(book.cover_image).length <= 2048
      ? String(book.cover_image)
      : 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80';

  let variants: any[] = [];
  if (book.variants) {
    if (Array.isArray(book.variants)) variants = book.variants;
    else if (typeof book.variants === 'string') {
      try { variants = JSON.parse(book.variants); } catch {}
    }
  }

  let sizesAvailable: string[] = ['S', 'M', 'L', 'XL', 'XXL'];
  if (book.sizes_available) {
    if (Array.isArray(book.sizes_available)) sizesAvailable = book.sizes_available;
    else if (typeof book.sizes_available === 'string') {
      try { sizesAvailable = JSON.parse(book.sizes_available); } catch {}
    }
  } else if (variants.length > 0) {
    sizesAvailable = variants.map((v) => v.size);
  }

  let images: string[] = safeImg ? [safeImg] : [];
  if (book.images) {
    if (Array.isArray(book.images) && book.images.length > 0) images = book.images;
    else if (typeof book.images === 'string') {
      try {
        const parsed = JSON.parse(book.images);
        if (Array.isArray(parsed) && parsed.length > 0) images = parsed;
      } catch {}
    }
  }

  let comboItems: string[] = [];
  if (book.combo_items) {
    if (Array.isArray(book.combo_items)) comboItems = book.combo_items;
    else if (typeof book.combo_items === 'string') {
      try { comboItems = JSON.parse(book.combo_items); } catch {}
    }
  }

  const isCombo = Boolean(book.is_combo || book.category_id === 'cat-combos');

  return {
    id: book.id,
    slug: book.slug || book.id,
    title: book.title,
    subtitle: `${book.brand || "VR Men's Wear"} • ${book.fit || 'Slim Fit'}`,
    brand: book.brand || "VR Men's Wear",
    category: isCombo ? 'combos' : (String(book.category_id || '').replace(/^cat-/, '') || 'shirts'),
    categoryId: book.category_id || 'cat-shirts',
    price,
    mrp,
    discount,
    rating: Number(book.review_count) > 0 ? Number(book.avg_rating || 0) : 4.8,
    reviews: Number(book.review_count || 12),
    badge: book.badge || (isCombo ? '3-in-1 Combo' : ''),
    badgeColor: isCombo ? 'bg-purple-600' : 'bg-amber-600',
    image: safeImg,
    hoverImage: images.length > 1 ? images[1] : safeImg,
    images,
    fabric: book.fabric || '100% Combed Cotton',
    fit: book.fit || 'Slim Fit',
    sleeve: book.sleeve || 'Full Sleeve',
    pattern: book.pattern || 'Solid',
    care: book.care || 'Machine Wash Cold',
    sizesAvailable,
    variants,
    isCombo,
    comboItems,
    description: book.description || `Premium handcrafted ${book.title} from VR Men's Wear.`,
    inStock: isBookInStock(book),
    stock: Math.max(0, Math.floor(Number(book.stock) || 50)),
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const book = await getBookMeta(slug);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vrmenswear.in';

  const price = Number(book?.discount_price || book?.price || 0);
  const inStock = book ? isBookInStock(book) : true;
  const reviewCount = Number(book?.review_count || 0);
  const safeCover =
    book?.cover_image &&
    !String(book.cover_image).startsWith('data:') &&
    String(book.cover_image).length <= 2048
      ? String(book.cover_image)
      : `${siteUrl}/logo.png`;

  const productUrl = `${siteUrl}/products/${slug}`;
  const cls = book?.class_standard ? `Class ${book.class_standard}` : 'Guide Books';

  // Schema.org JSON-LD — Product Markup
  const productSchema = book
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: book.title,
        image: [safeCover],
        description:
          book.description ||
          `Premium ${book.title} crafted exclusively for VR Men's Wear.`,
        sku: book.id,
        brand: {
          '@type': 'Brand',
          name: book.brand || "VR Men's Wear",
        },
        offers: {
          '@type': 'Offer',
          url: productUrl,
          priceCurrency: 'INR',
          price,
          priceValidUntil: new Date(Date.now() + 31536000000).toISOString().slice(0, 10),
          itemCondition: 'https://schema.org/NewCondition',
          availability: inStock
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
          seller: {
            '@type': 'Organization',
            name: "VR Men's Wear",
          },
        },
        ...(reviewCount > 0
          ? {
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: Number(book.avg_rating || 0),
                reviewCount,
              },
            }
          : {}),
      }
    : null;

  // Schema.org JSON-LD — BreadcrumbList Markup
  const breadcrumbSchema = book
    ? {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: siteUrl,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: cls,
            item: `${siteUrl}/search?class=${encodeURIComponent(book.class_standard || 'all')}`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: book.title,
            item: productUrl,
          },
        ],
      }
    : null;

  return (
    <>
      {productSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(productSchema) }}
        />
      )}
      {breadcrumbSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbSchema) }}
        />
      )}
      <ProductDetailClient slug={slug} initialProduct={mapBookToClientProduct(book)} />
    </>
  );
}
