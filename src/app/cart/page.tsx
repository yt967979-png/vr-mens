'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  ArrowLeft,
  Trash2,
  Plus,
  Minus,
  ShieldCheck,
  Truck,
  MapPin,
  Tag,
  Check,
  Bookmark,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { pincodeDeliveryMessage } from '@/lib/pincode';
import { getSTCourierDeliveryEstimate } from '@/lib/deliveryEstimator';
import { imageNeedsUnoptimized } from '@/lib/productImage';
import { getCartItemStockState, anyCartItemBlocking } from '@/lib/cartStock';
import { cartHasCombo } from '@/lib/deliveryRules';
import { Header } from '@/components/layout/Header';
import { AnnouncementBar } from '@/components/layout/AnnouncementBar';
import { Footer } from '@/components/layout/Footer';
import { CHECKOUT_PAUSE_MESSAGE } from '@/lib/checkoutConstants';

export default function CartPage() {
  const router = useRouter();
  const {
    cart,
    products,
    updateQty,
    removeFromCart,
    addToCart,
    cartTotal,
    setIsCheckoutOpen,
    user,
    setIsAuthOpen,
    setCheckoutTotal,
    saveForLater,
    savedForLater,
    moveToCartFromSaved,
    cartCount,
    shippingFee,
    cartGrandTotal,
    validateCartStock,
    showToast,
    isCheckoutPaused,
    checkoutPauseMessage,
  } = useStore();

  const [pincode, setPincode] = useState('600040');
  const [pincodeMsg, setPincodeMsg] = useState('✓ Deliverable via ST Courier — usually 2–3 days.');
  const [pincodeOk, setPincodeOk] = useState(true);
  const hasBlockingItem = anyCartItemBlocking(cart, products);
  const isComboInCart = cartHasCombo(cart);

  const isFreeDelivery = isComboInCart || cartTotal >= 999;
  const amountToFreeShipping = Math.max(0, 999 - cartTotal);
  const freeDeliveryProgress = isFreeDelivery ? 100 : Math.min(100, Math.round((cartTotal / 999) * 100));

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    void validateCartStock();
  }, [validateCartStock]);

  const totalMrp = cart.reduce((sum, item) => sum + (item.mrp || item.price + 200) * item.qty, 0);
  const totalDiscount = Math.max(0, totalMrp - cartTotal);

  const handleCheckPincode = (e: React.FormEvent) => {
    e.preventDefault();
    const result = pincodeDeliveryMessage(pincode);
    setPincodeOk(result.ok);
    if (result.ok) {
      const estimate = getSTCourierDeliveryEstimate(result.region === 'tn' ? 'Tamil Nadu' : 'Other State');
      setPincodeMsg(`✓ ${result.message} Est. arrival ${estimate.formattedDate}.`);
    } else {
      setPincodeMsg(`⚠️ ${result.message}`);
    }
  };

  // Trending recommendations (e.g. combo packs or tops)
  const recommendations = useMemo(() => {
    if (!products || products.length === 0) return [];
    return products
      .filter((p: any) => {
        if (cart.some((c) => c.id === p.id)) return false;
        return p.inStock !== false;
      })
      .slice(0, 3);
  }, [products, cart]);

  if (!mounted) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex flex-col page-mobile-nav">
        <AnnouncementBar />
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full pb-36 lg:pb-8">
          <div className="h-8 w-48 bg-slate-800 rounded-lg animate-pulse mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex gap-6 items-center animate-pulse">
                  <div className="w-20 h-20 bg-slate-800 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 w-3/4 bg-slate-800 rounded" />
                    <div className="h-3 w-1/3 bg-slate-800 rounded" />
                    <div className="h-8 w-24 bg-slate-800 rounded-lg mt-3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col page-mobile-nav">
      <AnnouncementBar />
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full pb-36 lg:pb-8">
        <div className="flex items-center gap-2 mb-6">
          <Link href="/" className="text-xs font-bold text-slate-400 hover:text-amber-400 flex items-center gap-1 min-h-11">
            <ArrowLeft className="w-4 h-4" />
            <span>Continue Browsing Menswear</span>
          </Link>
        </div>

        <h1 className="font-heading font-black text-2xl md:text-3xl text-white mb-8 uppercase tracking-tight">
          Your Wardrobe Cart ({cart.length} {cart.length === 1 ? 'item' : 'items'})
        </h1>

        {cart.length === 0 && savedForLater.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 max-w-lg mx-auto shadow-2xl">
            <ShoppingBag className="w-16 h-16 mx-auto mb-4 opacity-20 text-amber-400" />
            <h3 className="font-heading font-black text-xl text-white mb-2">Your cart is empty</h3>
            <p className="text-xs mb-6 text-slate-400">Add shirts, trousers, kurtas, or 3-in-1 combo packs to your order.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {!user && (
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="inline-block bg-amber-400 text-slate-950 font-black text-xs px-7 py-3.5 rounded-xl shadow-lg hover:bg-amber-300 transition-colors uppercase tracking-wider min-h-12"
                >
                  LOGIN
                </button>
              )}
              <Link
                href="/#products"
                className="inline-flex items-center justify-center bg-slate-800 border border-slate-700 text-white font-black text-xs px-7 py-3.5 rounded-xl shadow-md hover:bg-slate-700 transition-colors uppercase tracking-wider min-h-12"
              >
                EXPLORE STORE
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-4">
              {/* Dynamic Free Shipping Progress Bar */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-amber-400/20 rounded-2xl p-4 sm:p-5 shadow-lg">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-amber-400/20 text-amber-400 rounded-lg border border-amber-400/30">
                      <Truck className="w-4 h-4" />
                    </span>
                    <span className="font-heading font-bold text-xs sm:text-sm text-white">
                      {isFreeDelivery ? (
                        <span className="text-emerald-400 flex items-center gap-1 font-bold">
                          <CheckCircle2 className="w-4 h-4 inline text-emerald-400" /> 🎁 FREE Express Delivery Unlocked!
                        </span>
                      ) : (
                        <span>
                          Add <strong className="text-amber-400">₹{amountToFreeShipping}</strong> more to unlock <span className="text-emerald-400 font-bold">FREE Delivery</span>
                        </span>
                      )}
                    </span>
                  </div>
                  <span className="text-[11px] font-black text-amber-300 bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded-md">
                    {isComboInCart ? 'Combo Deal' : `₹${cartTotal} / ₹999`}
                  </span>
                </div>

                <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      isFreeDelivery
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                        : 'bg-gradient-to-r from-amber-400 to-amber-500'
                    }`}
                    style={{ width: `${Math.max(10, freeDeliveryProgress)}%` }}
                  />
                </div>
              </div>

              {/* Pincode Checker */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-amber-400 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-extrabold text-white flex items-center gap-2">
                      <span>Deliver to:</span>
                      <span className="text-amber-400 font-bold">{pincode}</span>
                    </div>
                    {pincodeMsg && (
                      <span
                        className={`text-[11px] font-bold flex items-center gap-1 mt-0.5 ${
                          pincodeOk ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {pincodeOk && <Check className="w-3.5 h-3.5" />}
                        {pincodeMsg}
                      </span>
                    )}
                  </div>
                </div>

                <form onSubmit={handleCheckPincode} className="flex gap-2 w-full sm:w-auto">
                  <input
                    type="text"
                    maxLength={6}
                    inputMode="numeric"
                    placeholder="Enter Pincode..."
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                    className="px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-amber-400 w-32 min-h-11"
                  />
                  <button
                    type="submit"
                    className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl transition-colors min-h-11 cursor-pointer"
                  >
                    Check
                  </button>
                </form>
              </div>

              {/* Cart Items List */}
              {cart.map((item) => {
                const stockState = getCartItemStockState(item, products);
                const itemCompositeKey = `${item.id}::${item.selectedSize || item.selectedMedium || 'std'}`;
                const sizeLabel = item.selectedSize || item.selectedMedium || 'Standard';
                return (
                  <div
                    key={itemCompositeKey}
                    className={`bg-slate-900 border rounded-2xl p-4 sm:p-6 flex gap-4 sm:gap-6 items-center shadow-lg transition-colors ${
                      stockState.blocking ? 'border-rose-500/50' : 'border-slate-800'
                    }`}
                  >
                    <Link
                      href={`/products/${item.slug || item.id}`}
                      className="flex-shrink-0 group/img block rounded-xl"
                      title={`View ${item.title}`}
                    >
                      <Image
                        src={item.image || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=400&q=80'}
                        alt={item.title}
                        width={88}
                        height={88}
                        className="w-20 h-20 sm:w-22 sm:h-22 object-cover bg-slate-950 border border-slate-700 rounded-xl p-1 flex-shrink-0 group-hover/img:scale-105 group-hover/img:border-amber-400 transition-all duration-200 cursor-pointer"
                        unoptimized={imageNeedsUnoptimized(item.image || '')}
                      />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/40">
                          <Tag className="w-2.5 h-2.5" />
                          Size: {sizeLabel}
                        </span>
                        {item.fabric && (
                          <span className="text-[10px] font-semibold text-slate-400">
                            • {item.fabric}
                          </span>
                        )}
                        {(item.isCombo || item.category === 'cat-combos' || item.category === 'combo') && (
                          <span className="text-[9.5px] font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                            3-in-1 Combo Pack
                          </span>
                        )}
                      </div>

                      <h3 className="font-heading font-black text-sm sm:text-base text-white truncate">
                        <Link
                          href={`/products/${item.slug || item.id}`}
                          className="hover:text-amber-400 transition-colors"
                          title={`View ${item.title}`}
                        >
                          {item.title}
                        </Link>
                      </h3>

                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="font-black text-base sm:text-lg text-white">₹{item.price}</span>
                        {item.mrp && item.mrp > item.price && (
                          <span className="text-xs text-slate-500 line-through">₹{item.mrp}</span>
                        )}
                        <span className="text-xs text-slate-400 font-normal">
                          (Subtotal: ₹{item.price * item.qty})
                        </span>
                      </div>

                      {stockState.mediumInvalid ? (
                        <p className="text-[11px] font-bold text-rose-400 mt-1.5 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Size &ldquo;{sizeLabel}&rdquo; is no longer available — remove to continue
                        </p>
                      ) : !stockState.inStock ? (
                        <p className="text-[11px] font-bold text-rose-400 mt-1.5 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Out of stock — remove this item to continue
                        </p>
                      ) : stockState.overLimit ? (
                        <p className="text-[11px] font-bold text-amber-400 mt-1.5 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Only {stockState.stock} available in size {sizeLabel}
                        </p>
                      ) : null}

                      <div className="flex items-center gap-3 mt-3 flex-wrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQty(item.id, -1, item.selectedSize || item.selectedMedium)}
                            className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 font-bold flex items-center justify-center hover:bg-slate-700 active:scale-95 transition-transform"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-black text-white w-6 text-center">{item.qty}</span>
                          <button
                            onClick={() => updateQty(item.id, 1, item.selectedSize || item.selectedMedium)}
                            disabled={!stockState.inStock || stockState.atLimit}
                            className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 font-bold flex items-center justify-center hover:bg-slate-700 active:scale-95 transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          onClick={() => saveForLater(item.id, item.selectedSize || item.selectedMedium)}
                          className="text-amber-400 hover:text-amber-300 text-xs font-bold flex items-center gap-1 min-h-11 px-2"
                        >
                          <Bookmark className="w-3.5 h-3.5" />
                          Save for later
                        </button>
                        <button
                          onClick={() => removeFromCart(item.id, item.selectedSize || item.selectedMedium)}
                          className="text-rose-400 hover:text-rose-300 text-xs font-bold flex items-center gap-1 ml-auto min-h-11 px-2 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Complete Your Look Recommendations */}
              {recommendations.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <h3 className="font-heading font-black text-xs sm:text-sm text-white uppercase tracking-wider">
                        Complete Your Wardrobe Look
                      </h3>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">Popular Recommendations</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    {recommendations.map((prod: any) => {
                      const prodHref = `/products/${prod.slug || prod.id}`;
                      return (
                        <div
                          key={prod.id}
                          className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800 transition-all"
                        >
                          <Link
                            href={prodHref}
                            className="relative w-12 h-14 rounded-lg overflow-hidden bg-slate-800 border border-slate-700 flex-shrink-0 group/rec block hover:border-amber-400 transition-colors"
                            title={`View ${prod.title}`}
                          >
                            <Image
                              src={prod.image || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=120&q=80'}
                              alt={prod.title}
                              fill
                              className="object-cover group-hover/rec:scale-105 transition-transform duration-200"
                              unoptimized={imageNeedsUnoptimized(prod.image || '')}
                            />
                          </Link>

                          <div className="flex-1 min-w-0">
                            <Link
                              href={prodHref}
                              className="text-[11px] font-bold text-slate-200 truncate leading-tight hover:text-amber-400 block transition-colors"
                              title={`View ${prod.title}`}
                            >
                              {prod.title}
                            </Link>
                            <p className="text-xs font-black text-white mt-0.5">
                              ₹{prod.price}
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                addToCart(prod);
                                showToast(`Added ${prod.title} to your cart!`);
                              }}
                              className="mt-1 inline-flex items-center gap-1 text-[10px] font-black text-slate-950 bg-amber-400 hover:bg-amber-300 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                            >
                              <Plus className="w-2.5 h-2.5" />
                              <span>Add</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Saved For Later */}
              {savedForLater.length > 0 && (
                <div className="pt-4 space-y-3">
                  <h2 className="font-heading font-black text-sm text-slate-300 uppercase tracking-wider">
                    Saved for later ({savedForLater.length})
                  </h2>
                  {savedForLater.map((item) => {
                    const savedHref = `/products/${item.slug || item.id}`;
                    return (
                      <div
                        key={`${item.id}::${item.selectedSize || item.selectedMedium || 'std'}`}
                        className="bg-slate-900 border border-dashed border-slate-800 rounded-2xl p-4 flex gap-4 items-center"
                      >
                        <Link
                          href={savedHref}
                          className="flex-shrink-0 group/saved block rounded-lg"
                          title={`View ${item.title}`}
                        >
                          <Image
                            src={item.image || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=120&q=80'}
                            alt={item.title}
                            width={64}
                            height={64}
                            className="w-16 h-16 object-cover bg-slate-950 rounded-lg border border-slate-700 group-hover/saved:scale-105 group-hover/saved:border-amber-400 transition-all duration-200 cursor-pointer"
                            unoptimized={imageNeedsUnoptimized(item.image || '')}
                          />
                        </Link>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-bold text-sm text-white truncate">
                              <Link
                                href={savedHref}
                                className="hover:text-amber-400 transition-colors"
                                title={`View ${item.title}`}
                              >
                                {item.title}
                              </Link>
                            </h4>
                            <span className="text-[9px] font-black text-amber-300 bg-amber-400/20 border border-amber-400/30 px-1.5 py-0.5 rounded">
                              Size: {item.selectedSize || item.selectedMedium || 'Standard'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">₹{item.price}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => moveToCartFromSaved(item.id, item.selectedSize || item.selectedMedium)}
                          className="text-xs font-black text-slate-950 bg-amber-400 hover:bg-amber-300 px-3.5 py-2 rounded-xl cursor-pointer"
                        >
                          Move to cart
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Price Details Sidebar */}
            {cart.length > 0 && (
              <div className="lg:col-span-4">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl sticky top-24 space-y-4">
                  <h3 className="font-heading font-black text-base text-white uppercase tracking-wider pb-3 border-b border-slate-800">
                    PRICE BREAKDOWN
                  </h3>

                  <div className="space-y-3 text-xs border-b border-slate-800 pb-4">
                    <div className="flex justify-between text-slate-400">
                      <span>Price ({cart.length} items):</span>
                      <span className="font-bold text-white">₹{totalMrp}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Catalog Discount:</span>
                      <span className="font-bold text-emerald-400">- ₹{totalDiscount}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Delivery Fee:</span>
                      <span className={isFreeDelivery ? 'font-bold text-emerald-400' : 'font-bold text-white'}>
                        {isFreeDelivery ? 'FREE' : `₹${shippingFee || 60}`}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-baseline font-black text-lg text-white">
                    <span>Grand Total:</span>
                    <span className="text-xl text-amber-400">₹{cartGrandTotal}</span>
                  </div>

                  {totalDiscount > 0 && (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-400 font-bold flex items-center gap-2">
                      <Tag className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>You save ₹{totalDiscount} on this order!</span>
                    </div>
                  )}

                  {isCheckoutPaused && (
                    <div className="bg-amber-400/10 border border-amber-400/30 rounded-xl p-3 text-xs text-amber-300 font-bold flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      <span>{checkoutPauseMessage || CHECKOUT_PAUSE_MESSAGE}</span>
                    </div>
                  )}

                  <button
                    onClick={async () => {
                      if (isCheckoutPaused) {
                        showToast(checkoutPauseMessage || CHECKOUT_PAUSE_MESSAGE);
                        return;
                      }
                      if (!user) {
                        setIsAuthOpen(true);
                        return;
                      }
                      if (!pincodeOk || hasBlockingItem) {
                        return;
                      }
                      const clean = await validateCartStock();
                      if (!clean) return;
                      setCheckoutTotal(cartGrandTotal);
                      setIsCheckoutOpen(true);
                      router.push('/checkout');
                    }}
                    disabled={isCheckoutPaused || !pincodeOk || hasBlockingItem}
                    className="w-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs py-4 rounded-xl shadow-lg uppercase tracking-wider transition-all min-h-12 cursor-pointer"
                  >
                    {isCheckoutPaused
                      ? 'CHECKOUT TEMPORARILY PAUSED'
                      : user
                      ? 'PLACE ORDER WITH RAZORPAY'
                      : 'LOGIN TO PLACE ORDER'}
                  </button>

                  {!user && (
                    <p className="text-[10px] text-center text-slate-400 font-medium">Sign in via Google or Phone OTP to checkout</p>
                  )}
                  {!pincodeOk && (
                    <p className="text-[10px] text-center text-rose-400 font-medium">Please enter a serviceable pincode</p>
                  )}
                  {hasBlockingItem && (
                    <p className="text-[10px] text-center text-rose-400 font-bold flex items-center justify-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Remove or adjust out-of-stock items above
                    </p>
                  )}

                  <div className="pt-2 text-[11px] text-slate-400 space-y-2 border-t border-slate-800">
                    <div className="flex items-center gap-2 text-slate-300 font-bold">
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      <span>100% Genuine Fabric &amp; Pre-Shrunk Check</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 font-medium">
                      <Truck className="w-4 h-4 text-emerald-400" />
                      <span>7-Day Hassle-Free Size Exchange</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />

      {/* Mobile sticky checkout bar */}
      {cart.length > 0 && (
        <div
          className="fixed inset-x-0 z-40 lg:hidden border-t border-slate-800 bg-slate-950/95 backdrop-blur-md p-3 shadow-2xl"
          style={{ bottom: 'calc(var(--bottom-nav-height) + env(safe-area-inset-bottom, 0px))' }}
        >
          <div className="flex items-center gap-3 max-w-7xl mx-auto">
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total</p>
              <p className="font-black text-lg text-amber-400 leading-none">₹{cartGrandTotal}</p>
            </div>
            <button
              type="button"
              onClick={async () => {
                if (!user) {
                  setIsAuthOpen(true);
                  return;
                }
                if (!pincodeOk || hasBlockingItem) return;
                const clean = await validateCartStock();
                if (!clean) return;
                setCheckoutTotal(cartGrandTotal);
                setIsCheckoutOpen(true);
                router.push('/checkout');
              }}
              disabled={!pincodeOk || hasBlockingItem}
              className="flex-1 bg-gradient-to-r from-amber-400 to-amber-500 disabled:opacity-50 text-slate-950 font-black text-xs py-3.5 rounded-xl uppercase tracking-wider min-h-12 touch-manipulation cursor-pointer"
            >
              {user ? 'PLACE ORDER' : 'LOGIN TO ORDER'}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
