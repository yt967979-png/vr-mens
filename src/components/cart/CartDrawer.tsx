'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, X, Truck, Plus, Minus, ArrowRight, AlertTriangle, Trash2, Sparkles, Tag } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { getSTCourierDeliveryEstimate } from '@/lib/deliveryEstimator';
import { getCartItemStockState, anyCartItemBlocking } from '@/lib/cartStock';
import { imageNeedsUnoptimized } from '@/lib/productImage';
import { cartHasCombo } from '@/lib/deliveryRules';
import { CHECKOUT_PAUSE_MESSAGE } from '@/lib/checkoutConstants';

export const CartDrawer = () => {
  const {
    cart,
    products,
    isCartOpen,
    setIsCartOpen,
    updateQty,
    removeFromCart,
    cartTotal,
    cartGrandTotal,
    shippingFee,
    setIsCheckoutOpen,
    user,
    setIsAuthOpen,
    validateCartStock,
    showToast,
    isCheckoutPaused,
    checkoutPauseMessage,
  } = useStore();

  const hasCombo = cartHasCombo(cart);
  const totalItems = cart.reduce((a, b) => a + Number(b.qty || 0), 0);
  const isFreeDelivery = hasCombo || cartTotal >= 999;
  const amountToFreeShipping = Math.max(0, 999 - cartTotal);
  const deliveryProgress = isFreeDelivery ? 100 : Math.min(100, Math.round((cartTotal / 999) * 100));
  const hasBlockingItem = anyCartItemBlocking(cart, products);

  useEffect(() => {
    if (isCartOpen) void validateCartStock();
  }, [isCartOpen, validateCartStock]);

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-xs z-[60]"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 240 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-slate-900 text-white z-[70] shadow-2xl flex flex-col border-l border-slate-800"
          >
            <div className="bg-slate-950 text-white p-4 flex justify-between items-center border-b border-slate-800 shadow-md">
              <h3 className="font-heading font-black text-base flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-400" />
                <span>Your Cart ({totalItems} {totalItems === 1 ? 'item' : 'items'})</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors min-h-11 min-w-11 flex items-center justify-center cursor-pointer"
                aria-label="Close cart"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Smart Free Shipping Progress Bar */}
            <div className="bg-slate-950/80 p-3.5 border-b border-slate-800 text-xs">
              <div className="flex items-center justify-between font-bold mb-1.5">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  {isFreeDelivery ? (
                    <span className="text-emerald-400 font-extrabold flex items-center gap-1">
                      🎉 FREE Express Delivery Unlocked!
                    </span>
                  ) : (
                    <span className="text-slate-300">
                      Add ₹{amountToFreeShipping} more for <strong className="text-amber-400">FREE Delivery</strong>
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-black text-amber-300 bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded-full">
                  {hasCombo ? 'Combo Free Shipping' : `₹${cartTotal} / ₹999`}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden p-0.5 shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${deliveryProgress}%` }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className={`h-full rounded-full transition-all ${
                    isFreeDelivery
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm'
                      : 'bg-gradient-to-r from-amber-400 to-amber-500'
                  }`}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <ShoppingBag className="w-16 h-16 mx-auto mb-3 opacity-20 text-amber-400" />
                  <h4 className="font-heading font-black text-base text-white">Your wardrobe cart is empty</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                    Explore shirts, chinos, kurtas and 3-in-1 value combo packs to style your look.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsCartOpen(false)}
                    className="mt-5 px-5 py-2.5 rounded-xl bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                cart.map((item) => {
                  const stockState = getCartItemStockState(item, products);
                  const itemKey = `${item.id}::${item.selectedSize || item.selectedMedium || 'std'}`;
                  const itemHref = `/products/${item.slug || item.id}`;
                  return (
                    <div key={itemKey} className="flex gap-3 pb-3 border-b border-slate-800 items-center">
                      <Link
                        href={itemHref}
                        onClick={() => setIsCartOpen(false)}
                        className="relative w-16 h-16 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden flex-shrink-0 group hover:border-amber-400 transition-colors block"
                        title={`View ${item.title}`}
                      >
                        <Image
                          src={item.image || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=400&q=80'}
                          alt={item.title}
                          fill
                          className="object-cover p-1 group-hover:scale-105 transition-transform duration-200 rounded-lg"
                          sizes="64px"
                          unoptimized={imageNeedsUnoptimized(item.image || '')}
                        />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-heading font-bold text-xs text-white truncate max-w-[190px]">
                            <Link
                              href={itemHref}
                              onClick={() => setIsCartOpen(false)}
                              className="hover:text-amber-400 transition-colors"
                              title={`View ${item.title}`}
                            >
                              {item.title}
                            </Link>
                          </h4>
                        </div>

                        {/* Selected Size Badge */}
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/40">
                            <Tag className="w-2.5 h-2.5" />
                            Size: {item.selectedSize || item.selectedMedium || 'Standard'}
                          </span>
                          {item.fabric && (
                            <span className="text-[10px] font-semibold text-slate-400 hidden sm:inline">
                              • {item.fabric}
                            </span>
                          )}
                        </div>

                        <div className="font-black text-sm text-white mt-1">
                          ₹{item.price * item.qty}
                          <span className="text-[10px] text-slate-400 font-normal ml-1.5">(₹{item.price} each)</span>
                        </div>

                        {stockState.mediumInvalid ? (
                          <p className="text-[10px] font-bold text-rose-400 mt-1 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Size not available — remove
                          </p>
                        ) : !stockState.inStock ? (
                          <p className="text-[10px] font-bold text-rose-400 mt-1 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Out of stock — remove to continue
                          </p>
                        ) : stockState.overLimit ? (
                          <p className="text-[10px] font-bold text-amber-400 mt-1 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Only {stockState.stock} available in this size
                          </p>
                        ) : null}

                        <div className="flex items-center gap-2 mt-2">
                          <button
                            type="button"
                            onClick={() => updateQty(item.id, -1, item.selectedSize || item.selectedMedium)}
                            className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 font-bold flex items-center justify-center hover:bg-slate-700 active:scale-95 transition-transform"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold text-white w-5 text-center">{item.qty}</span>
                          <button
                            type="button"
                            onClick={() => updateQty(item.id, 1, item.selectedSize || item.selectedMedium)}
                            disabled={!stockState.inStock || stockState.atLimit}
                            className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 font-bold flex items-center justify-center hover:bg-slate-700 active:scale-95 transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id, item.selectedSize || item.selectedMedium)}
                            className="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 flex items-center justify-center transition-colors ml-auto cursor-pointer"
                            aria-label={`Remove ${item.title} from cart`}
                            title="Remove from cart"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {cart.length > 0 && (
              <div
                className="bg-slate-950 border-t border-slate-800 p-4 space-y-3 shadow-inner"
                style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
              >
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-2.5 flex items-center gap-2 text-xs text-emerald-400 font-bold">
                  <Truck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    ST Courier Delivery: Est. arrival by{' '}
                    {getSTCourierDeliveryEstimate('Tamil Nadu').formattedDate}
                  </span>
                </div>

                <div className="flex justify-between text-xs font-semibold text-slate-300">
                  <span>Subtotal ({totalItems} items)</span>
                  <span>₹{cartTotal}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold text-slate-300">
                  <span>Delivery Fee</span>
                  <span>{isFreeDelivery ? <strong className="text-emerald-400">FREE</strong> : `₹${shippingFee || 60}`}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-white border-t border-slate-800 pt-2">
                  <span>Estimated Total</span>
                  <span className="text-base text-amber-400">₹{cartGrandTotal}</span>
                </div>

                {hasBlockingItem ? (
                  <p className="text-[10px] font-bold text-rose-400 text-center flex items-center justify-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Please adjust out-of-stock items before checkout
                  </p>
                ) : isCheckoutPaused ? (
                  <p className="text-[11px] font-extrabold text-amber-400 text-center bg-amber-400/10 border border-amber-400/30 p-2.5 rounded-xl">
                    ⚠️ {checkoutPauseMessage || CHECKOUT_PAUSE_MESSAGE}
                  </p>
                ) : null}

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  disabled={isCheckoutPaused || hasBlockingItem}
                  onClick={() => {
                    if (isCheckoutPaused) {
                      showToast(checkoutPauseMessage || CHECKOUT_PAUSE_MESSAGE);
                      return;
                    }
                    setIsCartOpen(false);
                    if (!user) {
                      setIsAuthOpen(true);
                      showToast('Please sign in to complete checkout');
                      return;
                    }
                    setIsCheckoutOpen(true);
                  }}
                  className="w-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs py-3.5 rounded-xl shadow-lg transition-all uppercase tracking-wider text-center min-h-12 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isCheckoutPaused
                    ? 'CHECKOUT TEMPORARILY PAUSED'
                    : user
                    ? 'PROCEED TO CHECKOUT'
                    : 'LOGIN TO CHECKOUT'}
                </motion.button>

                <div className="text-center pt-1">
                  <Link
                    href="/cart"
                    onClick={() => setIsCartOpen(false)}
                    className="text-xs font-bold text-amber-400 hover:underline inline-flex items-center gap-1 min-h-11"
                  >
                    <span>View Full Wardrobe Cart</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
