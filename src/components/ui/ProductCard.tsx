'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Heart, Star, ShoppingBag, Check, Sparkles, Layers } from 'lucide-react';
import { Product } from '@/lib/products';
import { useStore } from '@/context/StoreContext';
import { imageNeedsUnoptimized } from '@/lib/productImage';
import { isComboItem } from '@/lib/deliveryRules';

export const ProductCard = React.memo(function ProductCard({ product }: { product: Product }) {
  const router = useRouter();
  const { wishlist, toggleWishlist, addToCart, showToast } = useStore();
  const [isAdded, setIsAdded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Parse variants and sizes
  const variants = useMemo(() => {
    if (Array.isArray(product.variants) && product.variants.length > 0) {
      return product.variants;
    }
    return [];
  }, [product.variants]);

  const availableSizes = useMemo(() => {
    if (product.sizesAvailable && product.sizesAvailable.length > 0) {
      return product.sizesAvailable;
    }
    if (variants.length > 0) {
      return variants.map((v) => v.size);
    }
    return ['S', 'M', 'L', 'XL', 'XXL'];
  }, [product.sizesAvailable, variants]);

  // Initial selected size
  const [selectedSize, setSelectedSize] = useState<string>(() => {
    if (variants.length > 0) {
      const inStockVar = variants.find((v) => (v.stock ?? 1) > 0);
      return inStockVar ? inStockVar.size : variants[0].size;
    }
    return availableSizes[0] || 'M';
  });

  // Active variant based on selected size
  const activeVariant = useMemo(() => {
    return variants.find((v) => v.size === selectedSize) || null;
  }, [variants, selectedSize]);

  // Dynamic price (Flipkart style!)
  const currentPrice = activeVariant?.price ?? product.price;
  const currentMrp = activeVariant?.mrp ?? product.mrp;
  const currentStock = activeVariant?.stock ?? product.stock ?? 50;
  const isOutOfStock = product.inStock === false || currentStock <= 0;
  const discountPercent = currentMrp > currentPrice
    ? Math.round(((currentMrp - currentPrice) / currentMrp) * 100)
    : 0;

  const isCombo = isComboItem(product) || product.isCombo;
  const isWishlisted = Boolean(product?.id && wishlist.some((id) => String(id) === String(product.id)));

  // Multi-photo gallery images
  const galleryImages = useMemo(() => {
    if (Array.isArray(product.images) && product.images.length > 0) {
      return product.images;
    }
    return [product.image];
  }, [product.images, product.image]);

  const primaryImage = galleryImages[0] || product.image || 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80';
  const secondaryImage = galleryImages.length > 1 ? galleryImages[1] : primaryImage;

  const productHref = `/products/${product.slug || product.id}`;

  const prefetchProduct = () => {
    router.prefetch(productHref);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) {
      showToast(`⚠️ Size ${selectedSize} is currently out of stock`);
      return;
    }
    addToCart(product, 1, selectedSize, currentPrice, currentMrp);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1800);
  };

  const handleSizeClick = (e: React.MouseEvent, size: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedSize(size);
  };

  return (
    <article
      className="group relative flex flex-col bg-[#0B1518] rounded-2xl border border-[#16383D] shadow-lg shadow-black/40 hover:shadow-2xl hover:border-orange-500/60 transition-all duration-300 overflow-hidden"
      onPointerEnter={prefetchProduct}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Top Badges */}
      <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1.5 items-start">
        {isCombo ? (
          <span className="text-[10px] font-black tracking-wide text-white px-2.5 py-1 rounded-md bg-gradient-to-r from-orange-600 via-amber-600 to-teal-700 shadow-md flex items-center gap-1 border border-orange-400/40">
            <Layers className="w-3 h-3" />
            <span>3-IN-1 COMBO</span>
          </span>
        ) : discountPercent > 0 ? (
          <span className="text-[10px] font-black tracking-wider text-white px-2.5 py-1 rounded-md bg-gradient-to-r from-orange-500 to-amber-600 shadow-sm">
            {discountPercent}% OFF
          </span>
        ) : null}

        {product.badge && !isCombo && (
          <span className="text-[9.5px] font-bold text-white px-2 py-0.5 rounded bg-[#071113]/90 backdrop-blur-sm border border-white/10 shadow-sm uppercase">
            {product.badge}
          </span>
        )}

        {isOutOfStock && (
          <span className="text-[9.5px] font-bold text-white px-2 py-0.5 rounded bg-rose-600 shadow-sm">
            OUT OF STOCK
          </span>
        )}
      </div>

      {/* Wishlist Button */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleWishlist(product.id);
        }}
        className={`absolute top-2.5 right-2.5 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all ${
          isWishlisted
            ? 'bg-rose-950/80 text-rose-500 border border-rose-800 shadow-md'
            : 'bg-[#071113]/80 text-slate-400 hover:text-rose-500 border border-[#16383D] backdrop-blur-sm'
        }`}
        aria-label="Wishlist"
      >
        <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-500' : ''}`} />
      </button>

      {/* Product Image Container with Secondary Image Hover */}
      <Link href={productHref} className="relative block aspect-[4/5] w-full overflow-hidden bg-[#061113]">
        <Image
          src={isHovered && galleryImages.length > 1 ? secondaryImage : primaryImage}
          alt={product.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
          unoptimized={imageNeedsUnoptimized(primaryImage)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B1518] via-transparent to-transparent opacity-60 group-hover:opacity-30 transition-opacity duration-300" />
      </Link>

      {/* Product Details Body */}
      <div className="p-3.5 sm:p-4 flex flex-col flex-1 bg-[#0B1518]">
        {/* Brand & Category */}
        <div className="flex items-center justify-between gap-1 text-[11px] font-medium text-slate-400 mb-1">
          <span className="uppercase tracking-widest font-black text-orange-400 text-[10px]">
            {product.brand || "VR Men's Wear"}
          </span>
          {product.fabric && (
            <span className="text-[10px] text-teal-300/80 truncate max-w-[110px] font-semibold">
              {product.fabric}
            </span>
          )}
        </div>

        {/* Product Title */}
        <Link href={productHref} className="group-hover:text-orange-400 transition-colors">
          <h3 className="font-semibold text-sm sm:text-base text-white line-clamp-1 mb-1.5" title={product.title}>
            {product.title}
          </h3>
        </Link>

        {/* Dynamic Pricing (Flipkart Style!) */}
        <div className="flex items-baseline gap-2 mb-2.5">
          <span className="text-base sm:text-lg font-black text-white">
            ₹{currentPrice.toLocaleString('en-IN')}
          </span>
          {currentMrp > currentPrice && (
            <span className="text-xs text-slate-500 line-through">
              ₹{currentMrp.toLocaleString('en-IN')}
            </span>
          )}
          {discountPercent > 0 && (
            <span className="text-[11px] font-black text-orange-400">
              ({discountPercent}% off)
            </span>
          )}
        </div>

        {/* Dynamic Size Pills (Clickable directly on Card!) */}
        <div className="mb-3.5">
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 mb-1.5">
            <span>Size:</span>
            <span className="font-black text-orange-400">{selectedSize}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {availableSizes.map((size) => {
              const v = variants.find((item) => item.size === size);
              const isSizeOos = v && v.stock !== undefined && v.stock <= 0;
              const isSelected = selectedSize === size;

              return (
                <button
                  key={size}
                  type="button"
                  onClick={(e) => handleSizeClick(e, size)}
                  className={`min-w-[28px] h-7 px-1.5 rounded-md text-[11px] font-bold transition-all flex items-center justify-center cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black shadow-md ring-1 ring-orange-400'
                      : isSizeOos
                      ? 'bg-[#071113] text-slate-600 line-through opacity-50 cursor-not-allowed border border-dashed border-[#16383D]'
                      : 'bg-[#0E2226] text-slate-200 border border-[#194046] hover:border-orange-500/60 hover:text-white'
                  }`}
                  title={isSizeOos ? `${size} (Out of Stock)` : `Select size ${size}`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>

        {/* Add to Cart Button */}
        <div className="mt-auto pt-1">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`w-full py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer ${
              isAdded
                ? 'bg-emerald-600 text-white'
                : isOutOfStock
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 text-white shadow-orange-950/40 active:scale-[0.98]'
            }`}
          >
            {isAdded ? (
              <>
                <Check className="w-4 h-4" />
                <span>Added to Bag</span>
              </>
            ) : isOutOfStock ? (
              <span>Out of Stock</span>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Bag</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
});
