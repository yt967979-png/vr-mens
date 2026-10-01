'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Truck,
  Layers,
  Gift,
  CheckCircle2,
  Tag,
} from 'lucide-react';
import { useStore, Product } from '@/context/StoreContext';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { imageNeedsUnoptimized } from '@/lib/productImage';
import { useCouponCatalogSync } from '@/hooks/useCouponCatalogSync';

function HeroShowcase({
  size,
  product,
  showProduct,
}: {
  size: 'sm' | 'lg';
  product: Product | null;
  showProduct: boolean;
}) {
  const canFlip = Boolean(product?.image);

  const box =
    size === 'lg'
      ? 'h-[14rem] w-[14rem] md:h-80 md:w-80'
      : 'h-[8rem] w-[8rem]';
  const logoSize = size === 'lg' ? 280 : 120;
  const logoClass =
    size === 'lg'
      ? 'w-56 h-56 md:w-68 md:h-68 rounded-2xl shadow-2xl'
      : 'w-[7rem] h-[7rem] rounded-xl shadow-lg';

  return (
    <div className={`hero-showcase ${box} group cursor-pointer`}>
      <div className={`hero-showcase-inner ${box} ${showProduct && canFlip ? 'is-book' : ''}`}>
        <div className="hero-showcase-face hero-showcase-logo flex items-center justify-center rounded-3xl bg-slate-950 p-2 md:p-3 shadow-2xl border border-amber-400/30 overflow-hidden">
          <BrandLogo size={logoSize} priority className={logoClass} />
        </div>
        {product?.image ? (
          <Link
            href={`/products/${product.slug}`}
            className="hero-showcase-face hero-showcase-book flex flex-col items-center justify-center rounded-3xl bg-slate-900 p-3 md:p-4 shadow-2xl border border-amber-400/20 overflow-hidden relative group"
            aria-label={product.title}
          >
            <Image
              src={product.image}
              alt={`${product.title} - VR Men's Wear`}
              width={size === 'lg' ? 320 : 140}
              height={size === 'lg' ? 320 : 140}
              priority={size === 'lg'}
              className="h-full w-full object-cover rounded-2xl transition-transform duration-500 group-hover:scale-105"
              unoptimized={imageNeedsUnoptimized(product.image)}
            />
            {size === 'lg' && (
              <span className="absolute bottom-3 inset-x-3 bg-slate-950/90 backdrop-blur-md text-amber-300 text-xs font-black py-1.5 px-3 rounded-xl text-center truncate shadow-lg border border-amber-400/40">
                {product.title} • ₹{product.price}
              </span>
            )}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export const HeroSection = () => {
  const { setSelectedCategory, products } = useStore();
  const [heroTitle, setHeroTitle] = useState('');

  // Collect products with valid image
  const productsWithImages = useMemo(() => {
    return products.filter((p) => Boolean(String(p.image || (p as any).cover_image || '').trim()));
  }, [products]);

  // Current active product for rotation
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [showProduct, setShowProduct] = useState(false);

  useEffect(() => {
    if (productsWithImages.length > 0 && !activeProduct) {
      const initial = productsWithImages[Math.floor(Math.random() * productsWithImages.length)];
      setActiveProduct(initial);
    }
  }, [productsWithImages, activeProduct]);

  // Rotate between Brand Monogram and Showcase Products
  useEffect(() => {
    if (productsWithImages.length === 0) {
      setShowProduct(false);
      return;
    }

    let isMounted = true;
    let flipTimeout: NodeJS.Timeout;
    let switchTimeout: NodeJS.Timeout;

    const runFlipCycle = () => {
      setShowProduct(true);

      flipTimeout = setTimeout(() => {
        if (!isMounted) return;
        setShowProduct(false);

        switchTimeout = setTimeout(() => {
          if (!isMounted) return;
          setActiveProduct((prev) => {
            if (productsWithImages.length <= 1) return productsWithImages[0] || null;
            const pool = productsWithImages.filter((b) => b.id !== prev?.id);
            const next = pool[Math.floor(Math.random() * pool.length)] || productsWithImages[0];
            return next;
          });

          flipTimeout = setTimeout(() => {
            if (!isMounted) return;
            runFlipCycle();
          }, 2000);
        }, 900);
      }, 3800);
    };

    const initialTimer = setTimeout(() => {
      runFlipCycle();
    }, 2000);

    return () => {
      isMounted = false;
      clearTimeout(initialTimer);
      clearTimeout(flipTimeout);
      clearTimeout(switchTimeout);
    };
  }, [productsWithImages]);

  const loadHeroOffer = useCallback(async () => {
    try {
      const res = await fetch('/api/coupons/hero', { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      setHeroTitle(String(data.offer?.title || '').trim());
    } catch {
      setHeroTitle('');
    }
  }, []);

  useEffect(() => {
    void loadHeroOffer();
  }, [loadHeroOffer]);

  useCouponCatalogSync(loadHeroOffer);

  const scrollToProducts = () => {
    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
  };

  const highlights = [
    { icon: CheckCircle2, label: '100% Pure Cotton & Linen' },
    { icon: Tag, label: 'Flipkart-Style Size Pricing' },
    { icon: Layers, label: '3-in-1 Mega Value Combos' },
  ];

  return (
    <section className="relative bg-gradient-to-br from-[#071113] via-[#0B1A1D] to-[#11282D] text-white overflow-hidden py-12 md:py-24 border-b border-[#1A3D42]">
      {/* Ambient Flame & Teal Glow */}
      <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-orange-600/15 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-teal-500/15 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-7 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-300 text-xs font-black tracking-widest mb-5 shadow-xs">
              <Sparkles className="w-4 h-4 text-orange-400 shrink-0" />
              <span>OFFICIAL FLAGSHIP STORE · FLIPKART-STYLE LIVE SIZING</span>
            </div>

            <h1 className="font-heading font-black tracking-tight mb-4">
              <span className="block text-xs sm:text-base text-slate-300 font-extrabold tracking-[0.2em] uppercase mb-1">
                ELEVATE YOUR PRESENCE WITH
              </span>
              <span className="block text-3xl leading-tight sm:text-5xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-teal-200">
                VR MEN&apos;S WEAR
              </span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto lg:mx-0 mb-6 font-medium leading-relaxed">
              Breathable 100% combed cotton shirts, stretch chinos, premium denims, and high-value 3-in-1 combo packs. Tailored for sharp aesthetics and all-day comfort.
            </p>

            {heroTitle ? (
              <button
                type="button"
                onClick={scrollToProducts}
                className="hero-offer-ticket group relative mb-6 w-full max-w-xl mx-auto lg:mx-0 text-left overflow-hidden rounded-2xl touch-manipulation"
                aria-label={heroTitle}
              >
                <span className="pointer-events-none absolute -top-6 -right-4 h-20 w-20 rounded-full bg-orange-400/25 blur-2xl" />
                <span className="pointer-events-none absolute -bottom-8 -left-4 h-16 w-16 rounded-full bg-teal-500/20 blur-2xl" />
                <span className="hero-offer-shine pointer-events-none absolute inset-0" />
                <span className="relative flex items-start gap-3 p-3.5 sm:p-4 bg-[#0A1619]/95 border border-orange-500/30 rounded-2xl">
                  <span className="relative shrink-0 mt-0.5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 text-white shadow-md">
                    <Gift className="h-6 w-6" strokeWidth={2.25} />
                    <Sparkles className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 text-amber-200 animate-pulse" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/20 border border-orange-400/40 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-orange-300">
                      Season Launch Offer
                    </span>
                    <span className="mt-1.5 block font-heading text-[17px] sm:text-xl font-black leading-snug text-white">
                      {heroTitle}
                    </span>
                    <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-orange-300 group-hover:text-orange-200">
                      Claim This Discount
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </span>
                </span>
              </button>
            ) : null}

            <div className="sm:hidden flex justify-center mb-6">
              <HeroShowcase size="sm" product={activeProduct} showProduct={showProduct} />
            </div>

            <div className="grid grid-cols-3 gap-2.5 mb-6 max-w-md mx-auto lg:mx-0">
              {highlights.map((item) => (
                <div
                  key={item.label}
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#112529]/80 border border-[#1C454B]/80 backdrop-blur-md"
                >
                  <item.icon className="w-4 h-4 text-orange-400 mb-1" />
                  <span className="text-[11px] font-bold text-slate-200 text-center leading-tight">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mb-6">
              <span className="text-xs text-slate-400 font-bold mr-1">Categories:</span>
              {[
                { label: 'Shirts', cat: 'cat-shirts' },
                { label: 'T-Shirts', cat: 'cat-tshirts' },
                { label: 'Trousers', cat: 'cat-trousers' },
                { label: 'Jeans', cat: 'cat-jeans' },
                { label: 'Kurtas', cat: 'cat-kurtas' },
                { label: '3-in-1 Combos', cat: 'cat-combos' },
              ].map((pill) => (
                <button
                  key={pill.label}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(pill.cat);
                    scrollToProducts();
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-[#112529] hover:bg-orange-500 hover:text-white border border-[#1E484F] hover:border-orange-500 text-xs font-bold text-slate-200 transition-all touch-manipulation shadow-xs"
                >
                  {pill.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3">
              <button
                type="button"
                onClick={scrollToProducts}
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-black text-sm px-8 py-4 rounded-xl uppercase tracking-wider touch-manipulation min-h-12 shadow-lg shadow-orange-600/30 transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Explore Store</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('cat-combos');
                  scrollToProducts();
                }}
                className="inline-flex items-center justify-center gap-2 bg-[#122A2E]/90 hover:bg-[#18393E] border border-orange-500/40 text-orange-300 font-extrabold text-sm px-8 py-4 rounded-xl uppercase tracking-wider touch-manipulation min-h-12 transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Layers className="w-4 h-4 text-orange-400" />
                <span>3-in-1 Value Packs</span>
              </button>
            </div>
          </div>

          <div className="hidden sm:flex lg:col-span-5 relative justify-center items-center">
            <div className="absolute w-80 h-80 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute w-72 h-72 bg-teal-500/20 rounded-full blur-2xl pointer-events-none" />
            <HeroShowcase size="lg" product={activeProduct} showProduct={showProduct} />
          </div>
        </div>
      </div>
    </section>
  );
};
