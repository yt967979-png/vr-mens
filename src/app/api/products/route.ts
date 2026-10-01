import { NextResponse } from 'next/server';
import { getDbClient, releaseDbClient, ensureDefaultCategories, queryDb } from '@/lib/db';
import { verifyAdminRequest, forbiddenResponse } from '@/lib/serverSecurity';
import { recordAdminAudit } from '@/lib/adminAudit';
import { getCatalogCacheTtlMs, getCatalogCdnHeaders } from '@/lib/launchScale';
import { isBookInStock, calculateBookPrices } from '@/lib/stock';
import { syncAllAbandonedCartsInDb } from '@/lib/abandonedCartSync';
import { isComboItem } from '@/lib/deliveryRules';
import { redisGetJson, redisSetJson } from '@/lib/redis';
import { normalizeProductMedium } from '@/lib/productMedium';

// Shared catalog cache: same search/class/slug reused without hitting DB again
const queryCache = new Map<string, { data: any[]; timestamp: number }>();
const MAX_CACHE_KEYS = 120;

// In-flight single-flight request coalescing: if 20,000 requests arrive at the same millisecond, only 1 queries DB
const inFlightRequests = new Map<string, Promise<any[]>>();

const PLACEHOLDER_COVER =
  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80';

/** Catalog must never ship multi‑MB data: URLs — they OOM / 500 under load. */
function safeCatalogImage(raw: unknown): string {
  const img = String(raw || '').trim();
  if (!img) return PLACEHOLDER_COVER;
  if (img.startsWith('data:')) return PLACEHOLDER_COVER;
  if (img.length > 2048) return PLACEHOLDER_COVER;
  if (img.includes('localhost') || img.includes('127.0.0.1')) return PLACEHOLDER_COVER;
  return img;
}

export async function invalidateProductsCache() {
  queryCache.clear();
  try {
    const { redisDelPattern } = await import('@/lib/redis');
    await redisDelPattern('catalog:*');
    await redisDelPattern('book_meta:*');
  } catch {}
  try {
    const { invalidateLiveProductsCache } = await import('@/app/api/products/live/route');
    await invalidateLiveProductsCache();
  } catch {}
  try {
    const { invalidateMetaMemoryCache } = await import('@/app/products/[slug]/page');
    invalidateMetaMemoryCache();
  } catch {}
  try {
    const { revalidatePath } = await import('next/cache');
    revalidatePath('/', 'layout');
    revalidatePath('/products/[slug]', 'page');
    revalidatePath('/admin');
  } catch {}
}

function cacheKey(cls: string | null, search: string | null, slug: string | null) {
  const normSlug = slug ? String(slug).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') : '';
  return `c=${cls || ''}|s=${(search || '').trim().toLowerCase()}|g=${normSlug}`;
}

function readCache(key: string, allowStale = false) {
  const hit = queryCache.get(key);
  if (!hit) return null;
  const age = Date.now() - hit.timestamp;
  if (age > getCatalogCacheTtlMs()) {
    if (!allowStale) {
      queryCache.delete(key);
      return null;
    }
  }
  return hit.data;
}

function writeCache(key: string, data: any[]) {
  if (queryCache.size >= MAX_CACHE_KEYS) {
    const first = queryCache.keys().next().value;
    if (first) queryCache.delete(first);
  }
  queryCache.set(key, { data, timestamp: Date.now() });
}

function catalogHeaders(extra: Record<string, string> = {}) {
  return { ...getCatalogCdnHeaders(), ...extra };
}

/** CDN-bypass headers for SSE-triggered re-fetches (?fresh=1). */
function freshHeaders(extra: Record<string, string> = {}) {
  return {
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'CDN-Cache-Control': 'no-store',
    'Cloudflare-CDN-Cache-Control': 'no-store',
    Vary: 'Accept-Encoding',
    ...extra,
  };
}

/** Selling price: use discount_price only when it is a real sale (< MRP). */
function mapBookPrices(d: { price?: unknown; discount_price?: unknown }) {
  return calculateBookPrices(d);
}

function mapBookInStock(d: { status?: unknown; stock?: unknown }) {
  return isBookInStock(d);
}

async function ensureCategory(categoryId: string, cls: string, category: string) {
  const name = category === 'combo' ? 'Combo Packs' : `${cls || '10th'} Standard Guides`;
  const slug = categoryId.replace(/^cat-/, '') || 'guides';
  await queryDb(
    `INSERT INTO categories (id, name, slug, status)
     VALUES ($1, $2, $3, 'active')
     ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, status = 'active'`,
    [categoryId, name, slug]
  );
}

function slugFromTitle(title: string, id: string) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
  return base ? `${base}-${id.slice(-6)}` : id;
}

const CATALOG_GET_BUDGET_MS = Number(process.env.CATALOG_GET_TIMEOUT_MS || 8_000);

function mapCatalogRows(rows: any[]) {
  return (rows || []).map((d: any) => {
    const { price, mrp, discount } = mapBookPrices(d);
    const safeTitle = String(d.title || '');
    const isCombo = isComboItem({
      title: d.title,
      subject: d.subject,
      category_id: d.category_id,
      combo_subjects: d.combo_subjects,
    });

    // Authoritative class extraction: check category_id first (e.g. cat-7th -> 7th), then fall back to title regex
    let extractedClass = '10th';
    const catMatch = String(d.category_id || '').match(/^cat-(6th|7th|8th|9th|10th|11th|12th)$/i);
    if (catMatch) {
      extractedClass = catMatch[1];
    } else {
      const classMatch = safeTitle.match(/(6th|7th|8th|9th|10th|11th|12th)/i);
      if (classMatch) {
        extractedClass = classMatch[0];
      }
    }
    extractedClass = extractedClass.toLowerCase();
    const safeImg = safeCatalogImage(d.cover_image);

    let comboSubjects: string[] | undefined = undefined;
    if (d.combo_subjects) {
      if (Array.isArray(d.combo_subjects)) {
        comboSubjects = d.combo_subjects;
      } else if (typeof d.combo_subjects === 'string') {
        try {
          const parsed = JSON.parse(d.combo_subjects);
          if (Array.isArray(parsed)) comboSubjects = parsed;
        } catch {}
      }
    }

    let variants: any[] = [];
    if (d.variants) {
      if (Array.isArray(d.variants)) variants = d.variants;
      else if (typeof d.variants === 'string') {
        try { variants = JSON.parse(d.variants); } catch {}
      }
    }

    let sizesAvailable: string[] = ['S', 'M', 'L', 'XL', 'XXL'];
    if (d.sizes_available) {
      if (Array.isArray(d.sizes_available)) sizesAvailable = d.sizes_available;
      else if (typeof d.sizes_available === 'string') {
        try { sizesAvailable = JSON.parse(d.sizes_available); } catch {}
      }
    } else if (variants.length > 0) {
      sizesAvailable = variants.map((v) => v.size);
    }

    let images: string[] = safeImg ? [safeImg] : [];
    if (d.images) {
      if (Array.isArray(d.images) && d.images.length > 0) images = d.images;
      else if (typeof d.images === 'string') {
        try {
          const parsed = JSON.parse(d.images);
          if (Array.isArray(parsed) && parsed.length > 0) images = parsed;
        } catch {}
      }
    }

    let comboItems: string[] = [];
    if (d.combo_items) {
      if (Array.isArray(d.combo_items)) comboItems = d.combo_items;
      else if (typeof d.combo_items === 'string') {
        try { comboItems = JSON.parse(d.combo_items); } catch {}
      }
    }

    const catSlug = String(d.category_id || '').replace(/^cat-/, '');
    const apparelCategory = isCombo ? 'combos' : (catSlug || 'shirts');

    return {
      id: d.id,
      slug: d.slug || d.id,
      title: safeTitle || 'Apparel Item',
      subtitle: `${d.brand || "VR Men's Wear"} • ${d.fit || 'Slim Fit'}`,
      brand: d.brand || "VR Men's Wear",
      cls: extractedClass,
      category: apparelCategory,
      categoryId: d.category_id || `cat-${apparelCategory}`,
      category_id: d.category_id || `cat-${apparelCategory}`,
      subject: (d.subject && String(d.subject).trim()) || 'Apparel',
      price,
      mrp,
      discount,
      rating: Number(d.review_count) > 0 ? Number(d.avg_rating || 0) : 4.8,
      reviews: Number(d.review_count || 12),
      badge: (d.badge && String(d.badge).trim()) || (isCombo ? '3-in-1 Combo' : ''),
      badgeColor: (d.badge && String(d.badge).trim())
        ? String(d.badge).toUpperCase().includes('COMBO')
          ? 'bg-purple-600'
          : 'bg-amber-600'
        : (isCombo ? 'bg-purple-600' : 'bg-amber-600'),
      image: safeImg,
      hoverImage: images.length > 1 ? images[1] : safeImg,
      images,
      fabric: d.fabric || '100% Combed Cotton',
      fit: d.fit || 'Slim Fit',
      sleeve: d.sleeve || 'Full Sleeve',
      pattern: d.pattern || 'Solid',
      care: d.care || 'Machine Wash Cold',
      sizesAvailable,
      variants,
      isCombo: Boolean(d.is_combo || isCombo),
      comboItems,
      samplePdfUrl: d.sample_pdf_url || null,
      comboSubjects: comboSubjects || undefined,
      description: d.description || `Premium handcrafted ${safeTitle} tailored for unmatched comfort and elite modern style.`,
      features: ['100% Premium Cotton', 'Breathable Weave', 'Tailored Modern Fit', 'Pre-Shrunk & Color-Fast'],
      inStock: mapBookInStock(d),
      stock: Number(d.stock ?? 0),
      stockTamil: d.stock_tamil !== null && d.stock_tamil !== undefined ? Number(d.stock_tamil) : null,
      stockEnglish: d.stock_english !== null && d.stock_english !== undefined ? Number(d.stock_english) : null,
      stock_tamil: d.stock_tamil !== null && d.stock_tamil !== undefined ? Number(d.stock_tamil) : null,
      stock_english: d.stock_english !== null && d.stock_english !== undefined ? Number(d.stock_english) : null,
      isBestSeller: String(d.badge || '').toUpperCase().includes('BEST') || Boolean(d.is_bestseller),
      isComingSoon: Boolean(d.is_coming_soon || d.status === 'coming_soon'),
      language: d.language || 'Both',
    };
  });
}

let booksColumnsChecked = false;
async function ensureBooksColumns() {
  if (booksColumnsChecked) return;
  booksColumnsChecked = true;
  try {
    await queryDb(`ALTER TABLE books ADD COLUMN IF NOT EXISTS combo_subjects JSONB DEFAULT '[]'::jsonb;`);
    await queryDb(`ALTER TABLE books ADD COLUMN IF NOT EXISTS language VARCHAR(50) DEFAULT 'Both';`);
    await queryDb(`ALTER TABLE books ADD COLUMN IF NOT EXISTS stock_tamil INT DEFAULT NULL;`);
    await queryDb(`ALTER TABLE books ADD COLUMN IF NOT EXISTS stock_english INT DEFAULT NULL;`);
    await queryDb(`ALTER TABLE books ADD COLUMN IF NOT EXISTS is_coming_soon BOOLEAN DEFAULT false;`);
    await queryDb(`ALTER TABLE stock_holds ADD COLUMN IF NOT EXISTS medium VARCHAR(50);`);
    await queryDb(`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS medium VARCHAR(50);`);

    // VR Men's Wear apparel columns
    await queryDb(`ALTER TABLE books ADD COLUMN IF NOT EXISTS brand VARCHAR(255) DEFAULT 'VR Men''s Collection';`);
    await queryDb(`ALTER TABLE books ADD COLUMN IF NOT EXISTS fabric VARCHAR(100) DEFAULT '100% Cotton';`);
    await queryDb(`ALTER TABLE books ADD COLUMN IF NOT EXISTS fit VARCHAR(100) DEFAULT 'Slim Fit';`);
    await queryDb(`ALTER TABLE books ADD COLUMN IF NOT EXISTS sleeve VARCHAR(100) DEFAULT 'Full Sleeve';`);
    await queryDb(`ALTER TABLE books ADD COLUMN IF NOT EXISTS pattern VARCHAR(100) DEFAULT 'Solid';`);
    await queryDb(`ALTER TABLE books ADD COLUMN IF NOT EXISTS care VARCHAR(255) DEFAULT 'Machine Wash';`);
    await queryDb(`ALTER TABLE books ADD COLUMN IF NOT EXISTS is_combo BOOLEAN DEFAULT FALSE;`);
    await queryDb(`ALTER TABLE books ADD COLUMN IF NOT EXISTS combo_items JSONB DEFAULT '[]'::jsonb;`);
    await queryDb(`ALTER TABLE books ADD COLUMN IF NOT EXISTS sizes_available JSONB DEFAULT '["S","M","L","XL","XXL"]'::jsonb;`);
    await queryDb(`ALTER TABLE books ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]'::jsonb;`);
    await queryDb(`ALTER TABLE books ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;`);

    await queryDb(`ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS selected_size VARCHAR(50);`);
    await queryDb(`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS selected_size VARCHAR(50);`);
    await queryDb(`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_image TEXT;`);
  } catch {}
}

/** Always 200 JSON for the shop — never surface DB/schema faults as HTTP 500. */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cls = searchParams.get('cls');
    const search = searchParams.get('search');
    const slug = searchParams.get('slug');
    const key = cacheKey(cls, search, slug);
    const forceFresh = Boolean(
      searchParams.get('fresh') === '1' ||
      searchParams.get('admin') === '1' ||
      request.headers.get('x-admin-request') === '1'
    );

    const hdrs = forceFresh ? freshHeaders : catalogHeaders;

    if (!forceFresh) {
      const cached = readCache(key);
      if (cached) {
        return NextResponse.json(cached, {
          headers: hdrs({ 'X-Cache-Status': 'HIT_MEMORY' }),
        });
      }

      try {
        const redisCached = await redisGetJson<any[]>(`catalog:${key}`);
        if (redisCached && Array.isArray(redisCached) && redisCached.length > 0) {
          writeCache(key, redisCached);
          return NextResponse.json(redisCached, {
            headers: hdrs({ 'X-Cache-Status': 'HIT_REDIS' }),
          });
        }
      } catch {}

      // In-flight coalescing: if request 1 is already querying DB, requests 2-20,000 share its exact result!
      const existingInFlight = inFlightRequests.get(key);
      if (existingInFlight) {
        try {
          const coalesced = await existingInFlight;
          return NextResponse.json(coalesced, {
            headers: hdrs({ 'X-Cache-Status': 'HIT_COALESCED' }),
          });
        } catch {}
      }
    }

    const emptyOk = (cacheStatus: string) => {
      const stale = readCache(key, true);
      if (stale && stale.length > 0) {
        return NextResponse.json(stale, {
          headers: hdrs({ 'X-Cache-Status': 'STALE_MEMORY' }),
        });
      }
      return NextResponse.json([], {
        status: 200,
        headers: hdrs({ 'X-Cache-Status': cacheStatus }),
      });
    };

    const buildFilters = () => {
      let where = ' WHERE 1=1';
      const params: any[] = [];
      let count = 1;
      if (slug) {
        const rawSlug = String(slug).trim();
        const normSlug = rawSlug.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        where += ` AND (b.slug = $${count} OR b.id = $${count} OR lower(b.slug) = $${count + 1} OR lower(b.slug) = $${count + 2} OR lower(replace(b.title, ' ', '-')) = $${count + 2})`;
        params.push(rawSlug, rawSlug.toLowerCase(), normSlug);
        count += 3;
      }
      if (cls && cls !== 'all' && cls !== 'ALL') {
        const cleanCls = cls.toLowerCase().trim();
        where += ` AND (b.category_id = $${count} OR b.category_id = $${count + 1} OR b.title ILIKE $${count + 2})`;
        params.push(`cat-${cleanCls}`, cleanCls, `%${cleanCls}%`);
        count += 3;
      }
      if (search && search.trim()) {
        where += ` AND (b.title ILIKE $${count} OR COALESCE(b.subject, '') ILIKE $${count} OR COALESCE(b.description, '') ILIKE $${count})`;
        params.push(`%${search.trim()}%`);
        count++;
      }
      return { where, params };
    };

    const loadPrimary = async () => {
      await ensureBooksColumns();
      const { where, params } = buildFilters();
      const sql = `
        SELECT b.id, b.slug, b.title, b.subject, b.price, b.discount_price, b.stock, b.stock_tamil, b.stock_english, b.status, b.is_coming_soon,
               b.badge, b.description, b.category_id, b.created_at, b.sample_pdf_url,
               b.combo_subjects, b.language,
               CASE
                 WHEN b.cover_image IS NULL OR b.cover_image = '' THEN NULL
                 WHEN b.cover_image LIKE 'data:%' THEN NULL
                 WHEN length(b.cover_image) > 2048 THEN NULL
                 ELSE b.cover_image
               END AS cover_image,
               COALESCE(COUNT(r.id), 0)::int as review_count,
               COALESCE(AVG(r.rating), 0)::numeric(3,1) as avg_rating
        FROM books b
        LEFT JOIN reviews r ON b.id = r.book_id
        ${where}
        GROUP BY b.id
        ORDER BY b.created_at DESC
      `;
      return queryDb(sql, params);
    };

    /** Minimal fallback if reviews join / columns fail — still never 500. */
    const loadFallback = async () => {
      const { where, params } = buildFilters();
      const sql = `
        SELECT b.id, b.slug, b.title, b.subject, b.price, b.discount_price, b.stock, NULL::int AS stock_tamil, NULL::int AS stock_english, b.status, COALESCE(b.is_coming_soon, false) AS is_coming_soon,
               b.badge, b.description, b.category_id, b.created_at, b.sample_pdf_url,
               '[]'::jsonb AS combo_subjects, COALESCE(b.language, 'Both') AS language,
               NULL::text AS cover_image,
               0::int as review_count,
               0::numeric as avg_rating
        FROM books b
        ${where}
        ORDER BY b.created_at DESC
        LIMIT 200
      `;
      return queryDb(sql, params);
    };

    const loadDataPromise = (async () => {
      let res: { rows?: any[] };
      try {
        res = await loadPrimary();
      } catch (primaryErr: any) {
        console.warn('[products] primary catalog query failed, using fallback:', primaryErr?.message || primaryErr);
        res = await loadFallback();
      }
      const mapped = mapCatalogRows(res.rows || []);
      if (mapped.length > 0) {
        writeCache(key, mapped);
        void redisSetJson(`catalog:${key}`, mapped, 300);
      }
      return mapped;
    })();

    if (!forceFresh) {
      inFlightRequests.set(key, loadDataPromise);
      loadDataPromise.finally(() => inFlightRequests.delete(key));
    }

    const load = (async () => {
      const mapped = await loadDataPromise;
      return NextResponse.json(mapped, {
        headers: hdrs({
          'X-Cache-Status': mapped.length > 0 ? 'MISS_DB' : 'MISS_DB_EMPTY',
          'X-Catalog-Count': String(mapped.length),
        }),
      });
    })();

    let timer: ReturnType<typeof setTimeout> | undefined;
    const raced = await Promise.race([
      load
        .catch((err: any) => {
          console.error('[products] catalog load failed:', err?.message || err);
          return emptyOk('EMPTY_OR_ERROR');
        })
        .finally(() => {
          if (timer) clearTimeout(timer);
        }),
      new Promise<NextResponse>((resolve) => {
        timer = setTimeout(() => resolve(emptyOk('EMPTY_OR_TIMEOUT')), CATALOG_GET_BUDGET_MS);
      }),
    ]);
    return raced;
  } catch (err: any) {
    console.error('[products] GET fatal (returning []):', err?.message || err);
    return NextResponse.json([], {
      status: 200,
      headers: freshHeaders({ 'X-Cache-Status': 'FATAL_SOFT' }),
    });
  }
}

export async function POST(request: Request) {
  const auth = await verifyAdminRequest(request);
  if (!auth.isAdmin) return forbiddenResponse(auth.error);

  try {
    const body = await request.json();
    const {
      title, cls, category, price, mrp, badge, image, images, description, stock,
      stockTamil, stock_tamil, stockEnglish, stock_english, subject, status,
      samplePdfUrl, sample_pdf_url, comboSubjects, combo_subjects, language, medium,
      isComingSoon, is_coming_soon, brand, fabric, fit, sleeve, pattern, care,
      is_combo, isCombo: isComboInput, combo_items, comboItems, sizes_available, sizesAvailable, variants
    } = body;

    if (!title || price === undefined || price === null || price === '') {
      return NextResponse.json({ error: 'Title and price are required' }, { status: 400 });
    }

    const parsedVariants = Array.isArray(variants) ? variants : (typeof variants === 'string' ? JSON.parse(variants || '[]') : []);
    const parsedSizes = Array.isArray(sizesAvailable || sizes_available)
      ? (sizesAvailable || sizes_available)
      : (parsedVariants.length > 0 ? parsedVariants.map((v: any) => v.size) : ['S', 'M', 'L', 'XL', 'XXL']);
    const parsedImages = Array.isArray(images) ? images : (image ? [image] : []);
    const parsedComboItems = Array.isArray(comboItems || combo_items) ? (comboItems || combo_items) : [];

    const finalIsComingSoon = Boolean(isComingSoon !== undefined ? isComingSoon : (is_coming_soon !== undefined ? is_coming_soon : status === 'coming_soon'));
    const finalLanguage = normalizeProductMedium(language || medium);

    let stockQty = 0;
    if (parsedVariants.length > 0) {
      stockQty = parsedVariants.reduce((sum: number, v: any) => sum + (Math.max(0, Number(v.stock) || 0)), 0);
    } else {
      stockQty = Math.max(0, Math.floor(Number(stock) || 50));
    }

    const finalStockTamil = stockQty;
    const finalStockEnglish = 0;

    const bookStatus = status === 'draft' ? 'draft' : (finalIsComingSoon ? 'coming_soon' : (stockQty > 0 ? 'published' : 'out_of_stock'));

    const id = `vrm-${Date.now()}`;
    const slug = slugFromTitle(String(title), id);
    const finalMrp = Number(mrp || price);
    const sale = Number(price);
    const hasSale = Number.isFinite(sale) && sale > 0 && sale < finalMrp;
    const finalDiscountPrice = hasSale ? sale : null;
    const finalSubject = String(subject || 'Men\'s Fashion').trim();

    const isCombo = Boolean(
      is_combo ||
      isComboInput ||
      category === 'combos' ||
      category === 'cat-combos' ||
      isComboItem({ title: String(title || ''), subject: finalSubject, category })
    );

    let categoryId = 'cat-shirts';
    if (category) {
      categoryId = String(category).startsWith('cat-') ? String(category) : `cat-${category}`;
    } else if (isCombo) {
      categoryId = 'cat-combos';
    }

    const finalImgRaw = String(image || (parsedImages[0] || '')).trim();
    const finalImg = finalImgRaw || PLACEHOLDER_COVER;
    const finalDesc = description || `Premium ${title} from VR Men's Wear. Crafted with elite fabrics for superior comfort and refined style.`;
    const finalBadge = String(badge || (isCombo ? '3-in-1 Combo' : '')).trim().slice(0, 100);

    const finalPdf = String(samplePdfUrl || sample_pdf_url || '').trim() || null;
    const finalComboSubjects = isCombo
      ? JSON.stringify(parsedComboItems.length > 0 ? parsedComboItems : (comboSubjects || combo_subjects || []))
      : '[]';

    // queryDb is a function — wrap so helpers that expect client.query work
    const db = { query: (text: string, params?: any[]) => queryDb(text, params) };
    await ensureDefaultCategories(db);
    await ensureBooksColumns();

    const sql = `
      INSERT INTO books (
        id, title, slug, category_id, subject, price, discount_price, cover_image, description,
        status, featured, badge, stock, sample_pdf_url, combo_subjects, language,
        stock_tamil, stock_english, is_coming_soon,
        brand, fabric, fit, sleeve, pattern, care, is_combo, combo_items, sizes_available, variants, images
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9,
        $10, TRUE, $11, $12, $13, $14::jsonb, $15,
        $16, $17, $18,
        $19, $20, $21, $22, $23, $24, $25, $26::jsonb, $27::jsonb, $28::jsonb, $29::jsonb
      )
      RETURNING *
    `;
    const res = await queryDb(sql, [
      id,
      title,
      slug,
      categoryId,
      finalSubject,
      finalMrp,
      finalDiscountPrice,
      finalImg,
      finalDesc,
      bookStatus,
      finalBadge,
      stockQty,
      finalPdf,
      finalComboSubjects,
      finalLanguage,
      finalStockTamil,
      finalStockEnglish,
      finalIsComingSoon,
      brand || "VR Men's Wear",
      fabric || "100% Cotton",
      fit || "Slim Fit",
      sleeve || "Full Sleeve",
      pattern || "Solid",
      care || "Machine Wash",
      isCombo,
      JSON.stringify(parsedComboItems),
      JSON.stringify(parsedSizes),
      JSON.stringify(parsedVariants),
      JSON.stringify(parsedImages.length > 0 ? parsedImages : [finalImg]),
    ]);
    await invalidateProductsCache();
    void recordAdminAudit(
      {
        actorId: auth.user?.userId || 'admin',
        action: 'PRODUCT_CREATED',
        targetType: 'book',
        targetId: id,
        details: { title, price: finalMrp, discount_price: finalDiscountPrice, stock: stockQty },
      },
      request
    );
    try {
      const { notifyCatalogChanged } = await import('@/app/api/stock/stream/route');
      void notifyCatalogChanged([id]);
    } catch (_) {}
    void syncAllAbandonedCartsInDb().catch((e) =>
      console.warn('[POST /api/products] syncAllAbandonedCartsInDb failed:', e?.message || e)
    );
    return NextResponse.json(res.rows[0], { status: 201 });
  } catch (err: any) {
    console.error('POST /api/products failed:', err?.message || err);
    const msg = err?.message || 'Failed to add product';
    if (msg.includes('books_category_id_fkey')) {
      return NextResponse.json(
        { error: 'Catalog category missing in database. Redeploy latest app or run category seed in Railway Postgres.' },
        { status: 500 }
      );
    }
    const status = msg.includes('connect') || msg.includes('timeout') ? 503 : 500;
    return NextResponse.json({ error: 'Failed to add product. Please try again.' }, { status });
  }
}

export async function PATCH(request: Request) {
  const auth = await verifyAdminRequest(request);
  if (!auth.isAdmin) return forbiddenResponse(auth.error);

  try {
    const {
      id, title, cls, category, category_id, subject, price, mrp, inStock, stock,
      stockTamil, stock_tamil, stockEnglish, stock_english, description, image, images,
      badge, hasDiscount, samplePdfUrl, sample_pdf_url, comboSubjects, combo_subjects,
      language, medium, isComingSoon, is_coming_soon, status,
      brand, fabric, fit, sleeve, pattern, care, is_combo, isCombo, combo_items, comboItems,
      sizes_available, sizesAvailable, variants
    } = await request.json().catch(() => ({}));
    if (!id) return NextResponse.json({ error: 'Product id is required' }, { status: 400 });

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    await ensureBooksColumns();

    if (variants !== undefined) {
      const vArr = Array.isArray(variants) ? variants : (typeof variants === 'string' ? JSON.parse(variants) : []);
      fields.push(`variants = $${idx++}::jsonb`);
      values.push(JSON.stringify(vArr));
      // Update total stock from variants if stock not explicitly given
      if (stock === undefined && vArr.length > 0) {
        const vStock = vArr.reduce((sum: number, v: any) => sum + (Math.max(0, Number(v.stock) || 0)), 0);
        fields.push(`stock = $${idx++}`);
        values.push(vStock);
      }
    }

    if (sizes_available !== undefined || sizesAvailable !== undefined) {
      const sArr = Array.isArray(sizes_available || sizesAvailable) ? (sizes_available || sizesAvailable) : [];
      fields.push(`sizes_available = $${idx++}::jsonb`);
      values.push(JSON.stringify(sArr));
    }

    if (images !== undefined) {
      const imgArr = Array.isArray(images) ? images : [];
      fields.push(`images = $${idx++}::jsonb`);
      values.push(JSON.stringify(imgArr));
    }

    if (combo_items !== undefined || comboItems !== undefined) {
      const cArr = Array.isArray(combo_items || comboItems) ? (combo_items || comboItems) : [];
      fields.push(`combo_items = $${idx++}::jsonb`);
      values.push(JSON.stringify(cArr));
    }

    if (is_combo !== undefined || isCombo !== undefined) {
      fields.push(`is_combo = $${idx++}`);
      values.push(Boolean(is_combo !== undefined ? is_combo : isCombo));
    }

    if (brand !== undefined) { fields.push(`brand = $${idx++}`); values.push(String(brand)); }
    if (fabric !== undefined) { fields.push(`fabric = $${idx++}`); values.push(String(fabric)); }
    if (fit !== undefined) { fields.push(`fit = $${idx++}`); values.push(String(fit)); }
    if (sleeve !== undefined) { fields.push(`sleeve = $${idx++}`); values.push(String(sleeve)); }
    if (pattern !== undefined) { fields.push(`pattern = $${idx++}`); values.push(String(pattern)); }
    if (care !== undefined) { fields.push(`care = $${idx++}`); values.push(String(care)); }

    const comingSoonInput = isComingSoon !== undefined ? isComingSoon : (is_coming_soon !== undefined ? is_coming_soon : (status === 'coming_soon' ? true : undefined));
    if (comingSoonInput !== undefined) {
      await ensureBooksColumns();
      const val = Boolean(comingSoonInput);
      fields.push(`is_coming_soon = $${idx++}`);
      values.push(val);
    }

    let currentSubject = subject !== undefined ? String(subject) : undefined;
    let currentTitle = title !== undefined ? String(title) : undefined;
    const existing = await queryDb('SELECT title, subject, category_id, language, stock, stock_tamil, stock_english FROM books WHERE id = $1 LIMIT 1', [id]);
    const existingRow = existing.rows[0] || {};
    if (currentSubject === undefined) currentSubject = existingRow.subject;
    if (currentTitle === undefined) currentTitle = existingRow.title;

    const singleSubjects = [
      'tamil', 'english', 'mathematics', 'maths', 'science', 'social science', 'social',
      'physics', 'chemistry', 'biology', 'computer science', 'commerce', 'accountancy', 'economics'
    ];
    const isSingleSubject = currentSubject && singleSubjects.includes(currentSubject.trim().toLowerCase());

    if (title !== undefined) { fields.push(`title = $${idx++}`); values.push(title); }
    if (subject !== undefined) {
      fields.push(`subject = $${idx++}`);
      values.push(String(subject || 'General').trim());
    }

    const updatedLanguage = (language !== undefined || medium !== undefined) ? normalizeProductMedium(language || medium) : undefined;
    const activeLanguage = updatedLanguage || (existingRow.language ? normalizeProductMedium(existingRow.language) : 'Both');

    if (updatedLanguage !== undefined) {
      await ensureBooksColumns();
      fields.push(`language = $${idx++}`);
      values.push(updatedLanguage);
    }

    const rawStockTamil = stockTamil !== undefined ? stockTamil : stock_tamil;
    const rawStockEnglish = stockEnglish !== undefined ? stockEnglish : stock_english;

    let finalStockTamil: number | null | undefined = undefined;
    let finalStockEnglish: number | null | undefined = undefined;
    let finalStock: number | undefined = undefined;
    let finalStatus: string | undefined = undefined;

    if (activeLanguage === 'English') {
      // English-only: Tamil copies MUST NOT be added or preserved
      finalStockTamil = null;
      if (rawStockEnglish !== undefined && rawStockEnglish !== null && rawStockEnglish !== '') {
        finalStockEnglish = Math.max(0, parseInt(String(rawStockEnglish), 10) || 0);
      } else if (stock !== undefined) {
        finalStockEnglish = Math.max(0, Math.floor(Number(stock) || 0));
      } else if (updatedLanguage === 'English' && existingRow.stock_english !== null && existingRow.stock_english !== undefined) {
        finalStockEnglish = Math.max(0, Number(existingRow.stock_english) || 0);
      } else if (stock === undefined && rawStockEnglish === undefined && existingRow.stock !== undefined) {
        finalStockEnglish = Math.max(0, Number(existingRow.stock_english ?? existingRow.stock) || 0);
      }
      if (finalStockEnglish !== undefined) {
        finalStock = finalStockEnglish;
      }
    } else if (activeLanguage === 'Tamil') {
      // Tamil-only: English copies MUST NOT be added or preserved
      finalStockEnglish = null;
      if (rawStockTamil !== undefined && rawStockTamil !== null && rawStockTamil !== '') {
        finalStockTamil = Math.max(0, parseInt(String(rawStockTamil), 10) || 0);
      } else if (stock !== undefined) {
        finalStockTamil = Math.max(0, Math.floor(Number(stock) || 0));
      } else if (updatedLanguage === 'Tamil' && existingRow.stock_tamil !== null && existingRow.stock_tamil !== undefined) {
        finalStockTamil = Math.max(0, Number(existingRow.stock_tamil) || 0);
      } else if (stock === undefined && rawStockTamil === undefined && existingRow.stock !== undefined) {
        finalStockTamil = Math.max(0, Number(existingRow.stock_tamil ?? existingRow.stock) || 0);
      }
      if (finalStockTamil !== undefined) {
        finalStock = finalStockTamil;
      }
    } else {
      // Bilingual (Both)
      const prevTamil = existingRow.stock_tamil != null
        ? Math.max(0, Number(existingRow.stock_tamil) || 0)
        : (existingRow.language === 'Tamil' ? Math.max(0, Number(existingRow.stock) || 0) : 0);
      const prevEnglish = existingRow.stock_english != null
        ? Math.max(0, Number(existingRow.stock_english) || 0)
        : (existingRow.language === 'English' ? Math.max(0, Number(existingRow.stock) || 0) : 0);

      if (rawStockTamil !== undefined && rawStockTamil !== null && rawStockTamil !== '') {
        finalStockTamil = Math.max(0, parseInt(String(rawStockTamil), 10) || 0);
      } else if (updatedLanguage === 'Both' || existingRow.stock_tamil === null) {
        finalStockTamil = prevTamil;
      }

      if (rawStockEnglish !== undefined && rawStockEnglish !== null && rawStockEnglish !== '') {
        finalStockEnglish = Math.max(0, parseInt(String(rawStockEnglish), 10) || 0);
      } else if (updatedLanguage === 'Both' || existingRow.stock_english === null) {
        finalStockEnglish = prevEnglish;
      }

      if (finalStockTamil !== undefined || finalStockEnglish !== undefined) {
        const t = finalStockTamil !== undefined ? finalStockTamil : prevTamil;
        const e = finalStockEnglish !== undefined ? finalStockEnglish : prevEnglish;
        finalStockTamil = t;
        finalStockEnglish = e;
        finalStock = t + e;
      } else if (stock !== undefined) {
        finalStock = Math.max(0, Math.floor(Number(stock) || 0));
      }
    }

    if (cls !== undefined || category !== undefined || category_id !== undefined || isSingleSubject) {
      const targetCls = cls ? String(cls).trim().toLowerCase() : undefined;
      let targetCat = category_id
        ? String(category_id).trim()
        : category === 'combo'
        ? 'cat-combos'
        : (targetCls ? `cat-${targetCls}` : undefined);

      if (isSingleSubject && targetCat === 'cat-combos') {
        targetCat = targetCls ? `cat-${targetCls}` : 'cat-10th';
      }

      if (targetCat) {
        const db = { query: (text: string, params?: any[]) => queryDb(text, params) };
        await ensureDefaultCategories(db);
        await ensureCategory(targetCat, targetCls || '10th', targetCat === 'cat-combos' ? 'combo' : 'guide');
        fields.push(`category_id = $${idx++}`);
        values.push(targetCat);
      }
    }
    if (mrp !== undefined) { fields.push(`price = $${idx++}`); values.push(Number(mrp)); }
    if (price !== undefined || hasDiscount === false) {
      const mrpNum = Number(mrp);
      const saleNum = Number(price);
      const noSale =
        hasDiscount === false ||
        !Number.isFinite(saleNum) ||
        (Number.isFinite(mrpNum) && saleNum >= mrpNum);
      fields.push(`discount_price = $${idx++}`);
      values.push(noSale ? null : saleNum);
    }
    if (description !== undefined) { fields.push(`description = $${idx++}`); values.push(description); }
    if (image !== undefined) {
      const img = String(image || '').trim();
      if (img.startsWith('data:')) {
        return NextResponse.json(
          { error: 'Cover image must be an uploaded URL (not base64). Use the image upload button.' },
          { status: 400 }
        );
      }
      fields.push(`cover_image = $${idx++}`);
      values.push(img || PLACEHOLDER_COVER);
    }
    if (samplePdfUrl !== undefined || sample_pdf_url !== undefined) {
      const pdf = String(samplePdfUrl || sample_pdf_url || '').trim() || null;
      fields.push(`sample_pdf_url = $${idx++}`);
      values.push(pdf);
    }
    if (badge !== undefined) { fields.push(`badge = $${idx++}`); values.push(String(badge || '').trim().slice(0, 100)); }
    if (comboSubjects !== undefined || combo_subjects !== undefined || isSingleSubject) {
      await ensureBooksColumns();
      const raw = comboSubjects !== undefined ? comboSubjects : combo_subjects;
      const arr = isSingleSubject ? [] : (Array.isArray(raw) ? raw : []);
      fields.push(`combo_subjects = $${idx++}::jsonb`);
      values.push(JSON.stringify(arr));
    }

    if (finalStock !== undefined) {
      if (activeLanguage === 'Both') {
        const t = finalStockTamil !== undefined && finalStockTamil !== null ? finalStockTamil : (existingRow.stock_tamil != null ? Number(existingRow.stock_tamil) : 0);
        const e = finalStockEnglish !== undefined && finalStockEnglish !== null ? finalStockEnglish : (existingRow.stock_english != null ? Number(existingRow.stock_english) : 0);
        finalStatus = (t > 0 || e > 0) && finalStock > 0 ? 'published' : 'out_of_stock';
      } else {
        finalStatus = finalStock > 0 ? 'published' : 'out_of_stock';
      }
    }

    if (inStock !== undefined && !comingSoonInput) {
      const available = Boolean(inStock);
      finalStatus = available ? 'published' : 'out_of_stock';
    }

    if (comingSoonInput === true) {
      finalStatus = 'coming_soon';
    } else if (status !== undefined) {
      finalStatus = String(status);
    } else if (comingSoonInput === false && finalStatus === undefined && existingRow.status === 'coming_soon') {
      const curStock = finalStock !== undefined ? finalStock : Number(existingRow.stock || 0);
      finalStatus = curStock > 0 ? 'published' : 'out_of_stock';
    }

    // Assign each column once (avoids "multiple assignments to same column")
    const setCols = new Map<string, unknown>();
    for (let i = 0; i < fields.length; i++) {
      const col = fields[i].split('=')[0].trim();
      setCols.set(col, values[i]);
    }
    if (finalStockTamil !== undefined) setCols.set('stock_tamil', finalStockTamil);
    if (finalStockEnglish !== undefined) setCols.set('stock_english', finalStockEnglish);
    if (finalStock !== undefined) setCols.set('stock', finalStock);
    if (finalStatus !== undefined) setCols.set('status', finalStatus);

    if (setCols.size > 0) {
      const cols = [...setCols.keys()];
      const params = [...setCols.values(), id];
      const assignments = cols.map((c, i) => `${c} = $${i + 1}`);
      assignments.push('updated_at = NOW()');
      await queryDb(
        `UPDATE books SET ${assignments.join(', ')} WHERE id = $${params.length}`,
        params
      );
      await invalidateProductsCache();
      try {
        const { notifyStockChanged, notifyCatalogChanged } = await import('@/app/api/stock/stream/route');
        void notifyStockChanged([id]);
        void notifyCatalogChanged([id]);
      } catch (_) {}
      void syncAllAbandonedCartsInDb().catch((e) =>
        console.warn('[PATCH /api/products] syncAllAbandonedCartsInDb failed:', e?.message || e)
      );

      void recordAdminAudit(
        {
          actorId: auth.user?.userId || 'admin',
          action: price !== undefined || mrp !== undefined ? 'PRICE_CHANGED' : (finalStock !== undefined ? 'STOCK_CHANGED' : 'PRODUCT_UPDATED'),
          targetType: 'book',
          targetId: id,
          details: Object.fromEntries(setCols.entries()),
        },
        request
      );
    }

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    console.error('PATCH /api/products failed:', err?.message || err);
    return NextResponse.json({ error: 'Failed to update product. Please try again.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await verifyAdminRequest(request);
  if (!auth.isAdmin) return forbiddenResponse(auth.error);

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Product id is required' }, { status: 400 });

    // Cascade cleanups: purge active carts, wishlists, and unconfirmed reservations for this deleted book
    await queryDb(`DELETE FROM cart_items WHERE book_id = $1`, [id]).catch(() => {});
    await queryDb(`DELETE FROM wishlist WHERE book_id = $1`, [id]).catch(() => {});
    await queryDb(`DELETE FROM stock_holds WHERE book_id = $1 AND status != 'confirmed'`, [id]).catch(() => {});

    await queryDb(`DELETE FROM books WHERE id = $1`, [id]);
    await invalidateProductsCache();

    void recordAdminAudit(
      {
        actorId: auth.user?.userId || 'admin',
        action: 'PRODUCT_DELETED',
        targetType: 'book',
        targetId: id,
        details: { deletedId: id },
      },
      request
    );

    try {
      // Book row is gone — stock notify would no-op; force full catalog refresh
      const { notifyCatalogChanged } = await import('@/app/api/stock/stream/route');
      void notifyCatalogChanged([id]);
    } catch (_) {}
    void syncAllAbandonedCartsInDb().catch((e) =>
      console.warn('[DELETE /api/products] syncAllAbandonedCartsInDb failed:', e?.message || e)
    );
    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    console.error('DELETE /api/products failed:', err?.message || err);
    return NextResponse.json({ error: 'Failed to delete product. Please try again.' }, { status: 500 });
  }
}
