'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Star,
  ShoppingBag,
  Heart,
  Truck,
  Share2,
  CheckCircle,
  ChevronRight,
  ThumbsUp,
  X,
  Camera,
  Check,
  Zap,
  Sparkles,
  Layers,
  Ruler,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { Header } from '@/components/layout/Header';
import { AnnouncementBar } from '@/components/layout/AnnouncementBar';
import { Footer } from '@/components/layout/Footer';
import { SizeGuideModal } from '@/components/products/SizeGuideModal';
import { sizeInquiryWhatsAppUrl } from '@/lib/shopContact';
import { serializeJsonLd } from '@/lib/jsonLd';
import { ProductCard } from '@/components/ui/ProductCard';
import { FrequentlyBoughtTogether } from '@/components/products/FrequentlyBoughtTogether';
import { getSTCourierDeliveryEstimate } from '@/lib/deliveryEstimator';
import { pincodeDeliveryMessage } from '@/lib/pincode';
import { authFormHeaders } from '@/lib/clientAuth';
import { imageNeedsUnoptimized } from '@/lib/productImage';
import { isComboItem } from '@/lib/deliveryRules';

export default function ProductDetailClient({ slug, initialProduct }: { slug: string; initialProduct?: any }) {
  const router = useRouter();
  const { products, productsLoading, addToCart, toggleWishlist, wishlist, user, setIsAuthOpen, setIsCheckoutOpen, showToast } = useStore();
  const [dbProduct, setDbProduct] = useState<any>(initialProduct || null);
  const [productFetchDone, setProductFetchDone] = useState(Boolean(initialProduct));
  const [dbReviews, setDbReviews] = useState<any[]>([]);
  const [reviewStats, setReviewStats] = useState({ count: 0, avgRating: 4.8 });
  const [canReview, setCanReview] = useState(false);
  const [userReview, setUserReview] = useState<any>(null);
  const [reviewImages, setReviewImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [pincode, setPincode] = useState('600001');
  const [pincodeMsg, setPincodeMsg] = useState('✓ Deliverable via Express Courier — usually 2–3 days.');
  const [pincodeOk, setPincodeOk] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [selectedRatingFilter, setSelectedRatingFilter] = useState<number | null>(null);
  const [reviewSort, setReviewSort] = useState<'newest' | 'highest' | 'lowest' | 'helpful'>('newest');
  const [photosOnlyFilter, setPhotosOnlyFilter] = useState(false);
  const [helpfulVoted, setHelpfulVoted] = useState<Record<string, boolean>>({});
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [isMobileAdded, setIsMobileAdded] = useState(false);

  const normalizedSlug = useMemo(() => {
    return decodeURIComponent(String(slug || ''))
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');
  }, [slug]);

  const storeProduct = useMemo(() => {
    return (
      products.find((p: any) => {
        if (dbProduct?.id && String(p.id) === String(dbProduct.id)) return true;
        if (String(p.id) === String(slug)) return true;
        const pSlug = decodeURIComponent(String(p.slug || ''))
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-');
        return pSlug && normalizedSlug && pSlug === normalizedSlug;
      }) || null
    );
  }, [products, dbProduct?.id, slug, normalizedSlug]);

  const product = useMemo(() => {
    if (!dbProduct && !storeProduct) return null;
    if (!dbProduct) return storeProduct;
    if (!storeProduct) return dbProduct;
    return {
      ...storeProduct,
      ...dbProduct,
      description: dbProduct.description || storeProduct.description,
      image: dbProduct.image || storeProduct.image,
    };
  }, [dbProduct, storeProduct]);

  // Multi-photo gallery images
  const galleryImages = useMemo(() => {
    if (!product) return [];
    if (Array.isArray(product.images) && product.images.length > 0) {
      return product.images;
    }
    const imgs = [product.image, product.hoverImage].filter(Boolean);
    return imgs.length > 0 ? imgs : ['https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80'];
  }, [product]);

  const [activeImg, setActiveImg] = useState('');
  useEffect(() => {
    if (galleryImages.length > 0) {
      setActiveImg(galleryImages[0]);
    }
  }, [galleryImages]);

  // Variants & Dynamic Size Management (Flipkart style!)
  const variants = useMemo(() => {
    if (Array.isArray(product?.variants) && product.variants.length > 0) {
      return product.variants;
    }
    return [];
  }, [product?.variants]);

  const availableSizes = useMemo(() => {
    if (Array.isArray(product?.sizesAvailable) && product.sizesAvailable.length > 0) {
      return product.sizesAvailable;
    }
    if (Array.isArray(product?.sizes_available) && product.sizes_available.length > 0) {
      return product.sizes_available;
    }
    if (variants.length > 0) {
      return variants.map((v: any) => v.size);
    }
    return ['S', 'M', 'L', 'XL', 'XXL'];
  }, [product?.sizesAvailable, product?.sizes_available, variants]);

  const [selectedSize, setSelectedSize] = useState<string>('M');

  // Sync selected size on product change
  useEffect(() => {
    if (availableSizes.length > 0) {
      if (!availableSizes.includes(selectedSize)) {
        const inStockVar = variants.find((v: any) => (v.stock ?? 1) > 0);
        setSelectedSize(inStockVar ? inStockVar.size : availableSizes[0]);
      }
    }
  }, [availableSizes, variants]);

  // Active variant based on user size click
  const activeVariant = useMemo(() => {
    return variants.find((v: any) => v.size === selectedSize) || null;
  }, [variants, selectedSize]);

  // Dynamic pricing (changes instantly when clicking size!)
  const currentPrice = activeVariant?.price ?? product?.price ?? 0;
  const currentMrp = activeVariant?.mrp ?? product?.mrp ?? currentPrice;
  const currentStock = activeVariant && typeof activeVariant.stock === 'number'
    ? Math.max(0, activeVariant.stock)
    : (typeof product?.stock === 'number' ? Math.max(0, product.stock) : 50);

  const isComingSoon = Boolean(product?.isComingSoon || product?.is_coming_soon || product?.status === 'coming_soon');
  const isOutOfStock = !isComingSoon && (product?.inStock === false || currentStock <= 0);
  const discountPercent = currentMrp > currentPrice
    ? Math.round(((currentMrp - currentPrice) / currentMrp) * 100)
    : 0;

  const isCombo = Boolean(product?.isCombo || product?.is_combo || product?.category === 'combos' || isComboItem(product));
  const comboItems = useMemo(() => {
    if (Array.isArray(product?.comboItems) && product.comboItems.length > 0) return product.comboItems;
    if (Array.isArray(product?.combo_items) && product.combo_items.length > 0) return product.combo_items;
    return isCombo ? ['1x Classic Navy Formal Shirt', '1x Crisp White Formal Shirt', '1x Charcoal Grey Formal Shirt'] : [];
  }, [product, isCombo]);

  const isWishlisted = Boolean(product?.id && wishlist.some((id) => String(id) === String(product.id)));

  // Load reviews & fresh product details from API
  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      try {
        const res = await fetch(`/api/products?slug=${encodeURIComponent(normalizedSlug || slug)}&fresh=1`);
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list) && list.length > 0 && !cancelled) {
            setDbProduct(list[0]);
            setProductFetchDone(true);
          }
        }
      } catch {}

      try {
        const prodId = dbProduct?.id || slug;
        const revRes = await fetch(`/api/reviews?bookId=${encodeURIComponent(prodId)}`);
        if (revRes.ok) {
          const data = await revRes.json();
          if (!cancelled && data) {
            if (data.stats) setReviewStats(data.stats);
            if (Array.isArray(data.reviews)) setDbReviews(data.reviews);
            if (data.canReview) setCanReview(true);
            if (data.userReview) setUserReview(data.userReview);
          }
        }
      } catch {}
    }
    void loadData();
    return () => { cancelled = true; };
  }, [slug, normalizedSlug]);

  useEffect(() => {
    if (product?.title) {
      document.title = `${product.title} | VR Men's Wear`;
    }
  }, [product?.title]);

  const handleAddToCart = () => {
    if (!product || isOutOfStock || isComingSoon) return;
    addToCart(product, 1, selectedSize, currentPrice, currentMrp);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1800);
  };

  const handleMobileAddToCart = () => {
    if (!product || isOutOfStock || isComingSoon) return;
    addToCart(product, 1, selectedSize, currentPrice, currentMrp);
    setIsMobileAdded(true);
    setTimeout(() => setIsMobileAdded(false), 1800);
  };

  const tryBuyNow = () => {
    if (!product || isComingSoon || isOutOfStock) return;
    addToCart(product, 1, selectedSize, currentPrice, currentMrp);
    setIsCheckoutOpen(true);
    router.push('/checkout');
  };

  const checkPincode = (e: React.FormEvent) => {
    e.preventDefault();
    const result = pincodeDeliveryMessage(pincode);
    setPincodeOk(result.ok);
    if (result.ok) {
      const estimate = getSTCourierDeliveryEstimate(result.region === 'tn' ? 'Tamil Nadu' : 'Other State');
      setPincodeMsg(`✓ Express Delivery available to ${pincode}. Est. ${estimate.formattedDate}.`);
    } else {
      setPincodeMsg(`⚠️ ${result.message}`);
    }
  };

  const shareViaWhatsApp = () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const discountText = discountPercent > 0 ? ` (${discountPercent}% OFF)` : '';
    const text = `👔 *${product?.title}*\n💎 VR Men's Wear\n💰 Special Price: ₹${currentPrice}${discountText}\n🚚 Express Delivery Across India\n👉 Order directly here:\n${url}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  const shareProduct = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const text = `${product?.title} — ₹${currentPrice} | VR Men's Wear`;
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: product?.title, text, url });
        return;
      }
    } catch {}
    try {
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    } catch {
      shareViaWhatsApp();
    }
  };

  if (!product && !productFetchDone) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-600 dark:text-slate-400 font-semibold">Loading VR Men&apos;s Collection...</p>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Product Not Found</h1>
        <p className="text-slate-500 mb-6">The apparel item you requested does not exist or has been removed.</p>
        <Link href="/" className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl">
          Back to Collection
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#061113] flex flex-col pb-24 md:pb-12 text-slate-100">
      <AnnouncementBar />
      <Header />

      {/* Breadcrumb */}
      <nav className="bg-[#071113] border-b border-[#143337] py-3">
        <div className="max-w-7xl mx-auto px-4 text-xs font-semibold text-slate-400 flex items-center gap-2">
          <Link href="/" className="hover:text-orange-400">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="capitalize">{product.category || 'Apparel'}</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-white truncate">{product.title}</span>
        </div>
      </nav>

      {/* Main Product Showcase Grid */}
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 flex-1 w-full">
        <div className="bg-[#0B1518] border border-[#16383D] rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
          
          {/* Left Column: Interactive Multi-Photo Gallery */}
          <div className="lg:col-span-6 flex flex-col items-center">
            {/* Primary Main Image Container */}
            <div className="w-full aspect-[4/5] rounded-2xl bg-[#061113] border border-[#16383D] overflow-hidden relative mb-4 shadow-inner flex items-center justify-center">
              <Image
                src={activeImg || galleryImages[0] || product.image || ''}
                alt={product.title}
                fill
                priority
                className="object-cover object-top transition-transform duration-500 hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 550px"
                unoptimized={imageNeedsUnoptimized(activeImg || galleryImages[0] || product.image || '')}
              />

              {/* Badges on main image */}
              <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 items-start">
                {isCombo ? (
                  <span className="text-xs font-black tracking-wide text-white px-3 py-1.5 rounded-lg bg-gradient-to-r from-orange-600 via-amber-600 to-teal-700 shadow-md flex items-center gap-1.5 border border-orange-400/40">
                    <Layers className="w-4 h-4" />
                    <span>3-IN-1 VALUE PACK</span>
                  </span>
                ) : discountPercent > 0 ? (
                  <span className="text-xs font-black tracking-wider text-white px-3 py-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-600 shadow-md">
                    {discountPercent}% OFF
                  </span>
                ) : null}

                {product.badge && !isCombo && (
                  <span className="text-xs font-bold text-white px-2.5 py-1 rounded-md bg-[#071113]/90 border border-white/10 backdrop-blur-md uppercase">
                    {product.badge}
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnail switcher row */}
            {galleryImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto py-1 max-w-full">
                {galleryImages.map((img: string, i: number) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveImg(img)}
                    className={`relative w-20 h-24 rounded-xl border-2 overflow-hidden transition-all shrink-0 cursor-pointer ${
                      activeImg === img
                        ? 'border-orange-500 ring-2 ring-orange-500/40 shadow-lg'
                        : 'border-[#16383D] opacity-70 hover:opacity-100'
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`Photo ${i + 1}`}
                      fill
                      className="object-cover object-top"
                      unoptimized={imageNeedsUnoptimized(img)}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Specifications, Dynamic Size Selector, Pricing & Cart */}
          <div className="lg:col-span-6 flex flex-col">
            {/* Brand & Category Heading */}
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="text-xs font-black text-orange-400 uppercase tracking-widest">
                  {product.brand || "VR Men's Wear"}
                </span>
                <h1 className="font-heading font-black text-2xl sm:text-3xl md:text-4xl text-white mt-1">
                  {product.title}
                </h1>
              </div>

              {/* Actions */}
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => toggleWishlist(product.id)}
                  className={`p-2.5 rounded-xl border transition cursor-pointer ${
                    isWishlisted
                      ? 'bg-rose-950/80 text-rose-500 border-rose-800 shadow-sm'
                      : 'border-[#16383D] hover:bg-[#0F2327] text-slate-400'
                  }`}
                  aria-label="Wishlist"
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-rose-500' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={shareViaWhatsApp}
                  className="p-2.5 rounded-xl border border-emerald-800 bg-emerald-950/40 text-[#25D366] hover:bg-emerald-900/50 transition cursor-pointer"
                  title="Share on WhatsApp"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={shareProduct}
                  className="p-2.5 rounded-xl border border-[#16383D] hover:bg-[#0F2327] transition cursor-pointer"
                >
                  <Share2 className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Rating Stars */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-xs font-bold text-slate-200">4.8</span>
              <span className="text-xs text-slate-400">
                • ({reviewStats.count || 24} customer ratings)
              </span>
            </div>

            {/* Dynamic Price Box (Changes instantly with size selection!) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#0E2226] border border-[#194046] mb-5">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-black text-white">
                  ₹{currentPrice.toLocaleString('en-IN')}
                </span>
                {currentMrp > currentPrice && (
                  <span className="text-base sm:text-lg text-slate-500 line-through">
                    ₹{currentMrp.toLocaleString('en-IN')}
                  </span>
                )}
                {discountPercent > 0 && (
                  <span className="text-xs sm:text-sm font-black text-orange-400 bg-orange-500/10 border border-orange-500/30 px-2.5 py-0.5 rounded-md">
                    {discountPercent}% OFF
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Inclusive of all taxes • Free delivery on orders over ₹999 &amp; Combos
              </p>
            </div>

            {/* Dynamic Size Selector (The Flipkart Experience!) */}
            <div className="mb-6 p-4 rounded-2xl bg-[#0E2226] border border-[#194046] shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xs uppercase tracking-wider text-slate-300">
                    Select Size:
                  </span>
                  <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs font-black rounded border border-orange-500/30">
                    {selectedSize}
                  </span>
                </div>

                {/* Size Guide modal trigger button */}
                <button
                  type="button"
                  onClick={() => setShowSizeGuide(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-400 hover:text-orange-300 hover:underline cursor-pointer"
                >
                  <Ruler className="w-3.5 h-3.5" />
                  <span>Size Guide</span>
                </button>
              </div>

              {/* Size Buttons Matrix */}
              <div className="flex flex-wrap gap-2.5">
                {availableSizes.map((size: string) => {
                  const v = variants.find((item: any) => item.size === size);
                  const isSizeOos = v && v.stock !== undefined && v.stock <= 0;
                  const isSelected = selectedSize === size;

                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-[48px] h-12 px-3.5 rounded-xl font-black text-sm transition-all flex flex-col items-center justify-center cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md ring-2 ring-orange-400 scale-105'
                          : isSizeOos
                          ? 'bg-[#071113] text-slate-600 line-through opacity-50 cursor-not-allowed border border-dashed border-[#16383D]'
                          : 'bg-[#0A181B] text-slate-200 border border-[#16383D] hover:border-orange-500/60 hover:text-white'
                      }`}
                    >
                      <span>{size}</span>
                      {v && typeof v.price === 'number' && variants.length > 1 && (
                        <span className={`text-[9.5px] font-semibold ${isSelected ? 'text-amber-100' : 'text-slate-400'}`}>
                          ₹{v.price}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Live stock notification for selected size */}
              <div className="mt-3.5 pt-3 border-t border-[#194046] flex items-center justify-between text-xs">
                {isOutOfStock ? (
                  <span className="text-rose-500 font-bold flex items-center gap-1.5">
                    ⚠️ Size {selectedSize} is currently sold out.
                  </span>
                ) : currentStock <= 5 && currentStock > 0 ? (
                  <span className="text-orange-400 font-bold flex items-center gap-1.5 animate-pulse">
                    🔥 Hurry! Only {currentStock} left in Size {selectedSize}
                  </span>
                ) : (
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" /> In Stock • Ready for 24h dispatch
                  </span>
                )}
                <span className="text-slate-400 text-[11px]">7-day size exchange</span>
              </div>
            </div>

            {/* 3-in-1 Combo Pack Feature Breakdown */}
            {isCombo && comboItems.length > 0 && (
              <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-orange-950/20 via-[#0E2024] to-[#0A1619] border border-orange-500/30 shadow-sm">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🎁</span>
                    <h3 className="text-xs font-black uppercase tracking-wider text-orange-300">
                      3-in-1 Combo Pack Includes:
                    </h3>
                  </div>
                  <span className="text-[10px] font-black text-white px-2 py-0.5 rounded-full bg-orange-600">
                    SAVE ₹{currentMrp - currentPrice}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {comboItems.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-xs font-bold text-slate-200 bg-[#071113]/90 px-3 py-2 rounded-xl border border-white/5">
                      <CheckCircle className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Desktop Action Buttons */}
            <div className="hidden sm:flex gap-3 mb-6">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={`flex-1 py-4 px-6 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
                  isAdded
                    ? 'bg-emerald-600 text-white'
                    : isOutOfStock
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-[#133036] hover:bg-[#183d45] border border-teal-500/40 text-white active:scale-[0.98]'
                }`}
              >
                {isAdded ? (
                  <>
                    <Check className="w-5 h-5" />
                    <span>Added to Bag</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-5 h-5 text-teal-400" />
                    <span>Add to Bag</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={tryBuyNow}
                disabled={isOutOfStock}
                className="flex-1 py-4 px-6 rounded-2xl font-black text-sm bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 text-white flex items-center justify-center gap-2 shadow-lg shadow-orange-950/40 active:scale-[0.98] transition cursor-pointer"
              >
                <Zap className="w-5 h-5 fill-white" />
                <span>Buy Now</span>
              </button>
            </div>

            {/* Fabric & Fit Specifications Table */}
            <div className="p-4 rounded-2xl bg-[#0E2226] border border-[#194046] mb-6">
              <h4 className="text-xs font-black uppercase tracking-wider text-white mb-3">
                Fabric &amp; Product Specifications
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Fabric Material</span>
                  <span className="font-bold text-slate-200">{product.fabric || '100% Combed Cotton'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Fit Type</span>
                  <span className="font-bold text-slate-200">{product.fit || 'Slim Fit'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Sleeve Length</span>
                  <span className="font-bold text-slate-200">{product.sleeve || 'Full Sleeve'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Pattern / Style</span>
                  <span className="font-bold text-slate-200">{product.pattern || 'Solid'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[11px]">Wash &amp; Care</span>
                  <span className="font-bold text-slate-200">{product.care || 'Machine Wash Cold, Gentle Cycle'}</span>
                </div>
              </div>
            </div>

            {/* Pincode & Delivery Options */}
            <div className="border-t border-slate-200 dark:border-slate-800 pt-5 mb-6">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Truck className="w-4 h-4 text-amber-500" />
                <span>Delivery & Check Pincode</span>
              </h4>
              <form onSubmit={checkPincode} className="flex gap-2 max-w-sm mb-2.5">
                <input
                  type="text"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit Pincode"
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-slate-900 dark:bg-amber-500 text-white font-bold text-xs rounded-xl hover:bg-slate-800 dark:hover:bg-amber-600 transition"
                >
                  Check
                </button>
              </form>
              <p className={`text-xs font-semibold ${pincodeOk ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                {pincodeMsg}
              </p>
            </div>

            {/* Service Guarantee Badges */}
            <div className="grid grid-cols-3 gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-800 text-center">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 flex flex-col items-center">
                <ShieldCheck className="w-5 h-5 text-amber-500 mb-1" />
                <span className="text-[11px] font-bold">100% Genuine</span>
                <span className="text-[9.5px] text-slate-400">Pure Fabrics</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 flex flex-col items-center">
                <RefreshCw className="w-5 h-5 text-amber-500 mb-1" />
                <span className="text-[11px] font-bold">7-Day Exchange</span>
                <span className="text-[9.5px] text-slate-400">Hassle-Free Fit</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 flex flex-col items-center">
                <Truck className="w-5 h-5 text-amber-500 mb-1" />
                <span className="text-[11px] font-bold">Express Shipping</span>
                <span className="text-[9.5px] text-slate-400">Dispatched in 24h</span>
              </div>
            </div>

          </div>
        </div>

        {/* Product Description Detailed Section */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm mb-10">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-3">
            Product Story & Craftsmanship
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-4xl">
            {product.description}
          </p>
        </section>

      </div>

      {/* Size Guide Modal */}
      <SizeGuideModal
        isOpen={showSizeGuide}
        onClose={() => setShowSizeGuide(false)}
        category={product.category || 'shirts'}
      />

      {/* Mobile Sticky Checkout Bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-[#0B1518]/95 backdrop-blur-md border-t border-[#16383D] p-3 sm:hidden shadow-2xl flex items-center justify-between gap-3">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-black text-white">
              ₹{currentPrice.toLocaleString('en-IN')}
            </span>
            {currentMrp > currentPrice && (
              <span className="text-xs text-slate-500 line-through">
                ₹{currentMrp}
              </span>
            )}
          </div>
          <span className="text-[10px] font-black text-orange-400">
            Size: {selectedSize}
          </span>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleMobileAddToCart}
            disabled={isOutOfStock}
            className="px-4 py-3 bg-[#0E262A] hover:bg-[#14363B] border border-teal-500/40 text-white font-black text-xs rounded-xl flex items-center gap-1.5 active:scale-95"
          >
            {isMobileAdded ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Added</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4 text-teal-400" />
                <span>Add</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={tryBuyNow}
            disabled={isOutOfStock}
            className="px-5 py-3 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-black text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-orange-950/50 active:scale-95"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>Buy Now</span>
          </button>
        </div>
      </div>

      <Footer />
    </main>
  );
}
