'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Search, Heart, ShoppingBag, User, Bell, CheckCheck, Sparkles, ArrowRight, Shirt, Layers } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { imageNeedsUnoptimized } from '@/lib/productImage';
import { useCartBadgeBump } from '@/hooks/useCartBadgeBump';
import { authHeaders } from '@/lib/clientAuth';
import { isAdminShopPreview } from '@/lib/adminShopPreview';
import { isComboItem } from '@/lib/deliveryRules';

export const Header = () => {
  const router = useRouter();
  const {
    products,
    wishlistCount,
    cartCount,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    setIsAuthOpen,
    user,
    addToCart,
    showToast,
  } = useStore();

  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const cartBump = useCartBadgeBump(cartCount);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const staffPreview =
    mounted && Boolean(user && (user.role === 'admin' || user.role === 'super_admin') && isAdminShopPreview());

  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [notificationsList, setNotificationsList] = useState<any[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/notifications', { headers: authHeaders(user) });
      if (res.ok) {
        const data = await res.json();
        setNotificationsList(data.notifications || []);
        setUnreadNotifCount(data.unreadCount || 0);
      }
    } catch {
      /* best-effort */
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const timer = setInterval(fetchNotifications, 20000);
      return () => clearInterval(timer);
    } else {
      setNotificationsList([]);
      setUnreadNotifCount(0);
    }
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: authHeaders(user, { 'Content-Type': 'application/json' }),
        body: JSON.stringify({ markAllRead: true }),
      });
      setUnreadNotifCount(0);
      setNotificationsList((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      /* best-effort */
    }
  };

  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(localQuery), 160);
    return () => clearTimeout(t);
  }, [localQuery, setSearchQuery]);

  const POPULAR_SHORTCUTS = [
    { label: '🎁 3-in-1 Combo Pack', query: 'combo', cat: 'cat-combos' },
    { label: '👔 Cotton Shirts', query: 'shirt', cat: 'cat-shirts' },
    { label: '👕 Polo & Heavy T-Shirts', query: 't-shirt', cat: 'cat-tshirts' },
    { label: '👖 Stretch Chinos', query: 'trouser', cat: 'cat-trousers' },
    { label: '✨ Festive Kurtas', query: 'kurta', cat: 'cat-kurtas' },
    { label: '🔥 Slim Fit Denim', query: 'jeans', cat: 'cat-jeans' },
  ];

  const handleShortcutClick = (shortcut: (typeof POPULAR_SHORTCUTS)[number]) => {
    setLocalQuery(shortcut.query);
    setSearchQuery(shortcut.query);
    if (shortcut.cat !== 'all') {
      setSelectedCategory(shortcut.cat);
    }
    router.push(`/search?q=${encodeURIComponent(shortcut.query)}`);
    setShowSearchDropdown(false);
  };

  const queryText = (localQuery || '').trim();
  const filteredSearch = queryText
    ? products
        .filter((p: any) => {
          if (!p.inStock) return false;
          const q = queryText.toLowerCase();
          return (
            p.title.toLowerCase().includes(q) ||
            (p.brand && p.brand.toLowerCase().includes(q)) ||
            (p.fabric && p.fabric.toLowerCase().includes(q)) ||
            (p.fit && p.fit.toLowerCase().includes(q)) ||
            (p.category && p.category.toLowerCase().includes(q))
          );
        })
        .slice(0, 8)
    : [];

  const goSearch = () => {
    const q = localQuery.trim() || searchQuery.trim();
    if (!q) return;
    setSearchQuery(q);
    router.push(`/search?q=${encodeURIComponent(q)}`);
    setShowSearchDropdown(false);
  };

  const prefetchProduct = (slug: string) => {
    router.prefetch(`/products/${slug}`);
  };

  const onQueryChange = (value: string) => {
    setLocalQuery(value);
    setShowSearchDropdown(true);
  };

  const searchHit = (p: any) => {
    const isCombo = isComboItem(p) || p.category === 'cat-combos' || p.category === 'combo';
    return (
      <div
        key={p.id}
        onPointerEnter={() => prefetchProduct(p.slug)}
        onClick={() => {
          router.push(`/products/${p.slug}`);
          setShowSearchDropdown(false);
        }}
        className="w-full p-2.5 sm:p-3 hover:bg-slate-800/80 active:bg-slate-800 cursor-pointer flex items-center justify-between gap-3 text-left transition-colors group touch-manipulation"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-12 h-14 sm:w-13 sm:h-15 rounded-lg bg-slate-800 border border-slate-700 p-1 flex items-center justify-center shrink-0 overflow-hidden group-hover:scale-105 transition-transform">
            <Image
              src={
                p.image ||
                'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=120&q=80'
              }
              alt=""
              width={52}
              height={60}
              className="w-full h-full object-cover rounded-md"
              unoptimized={imageNeedsUnoptimized(p.image || '')}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
              <span className="text-[10px] font-extrabold text-amber-400 bg-amber-400/10 border border-amber-400/30 px-1.5 py-0.2 rounded uppercase">
                {p.fabric || 'Pure Cotton'} • {p.fit || 'Regular'}
              </span>
              {isCombo && (
                <span className="text-[9px] font-black text-amber-300 bg-amber-500/20 border border-amber-400/40 px-1.5 py-0.2 rounded uppercase">
                  🎁 3-in-1 Combo
                </span>
              )}
            </div>
            <div className="font-extrabold text-xs sm:text-sm text-white group-hover:text-amber-400 transition-colors line-clamp-1">
              {p.title}
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-2 mt-1">
              <span className="font-black text-white text-xs sm:text-sm">₹{p.price}</span>
              {p.mrp > p.price ? (
                <span className="line-through text-[11px] text-slate-500 font-semibold">₹{p.mrp}</span>
              ) : null}
              {p.discount > 0 ? (
                <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/15 px-1.5 py-0.2 rounded border border-emerald-500/30">
                  {p.discount}% OFF
                </span>
              ) : null}
              {Array.isArray(p.sizesAvailable) && p.sizesAvailable.length > 0 && (
                <span className="text-[9px] font-bold text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded border border-slate-700">
                  Sizes: {p.sizesAvailable.slice(0, 3).join(', ')}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            title="Quick view"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              router.push(`/products/${p.slug}`);
              setShowSearchDropdown(false);
            }}
            className="px-2.5 py-1.5 rounded-lg bg-amber-400/15 hover:bg-amber-400 text-amber-300 hover:text-slate-950 border border-amber-400/30 hover:border-amber-400 font-extrabold text-[11px] flex items-center gap-1 transition-all shadow-xs cursor-pointer"
          >
            <span>View</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  const dropdownBody = (
    <div className="flex flex-col max-h-[75vh] overflow-y-auto divide-y divide-slate-800 bg-slate-900 text-white">
      {/* Category Shortcuts Strip */}
      <div className="p-3 bg-slate-950">
        <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Popular Categories &amp; Trends</span>
          </span>
          <span className="text-[10px] text-amber-400 font-bold">1-Tap Discovery</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {POPULAR_SHORTCUTS.map((s) => (
            <button
              key={s.label}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleShortcutClick(s);
              }}
              className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:border-amber-400 hover:text-amber-300 hover:bg-slate-800 shadow-2xs transition-all cursor-pointer flex items-center gap-1"
            >
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Matching Results */}
      {filteredSearch.length > 0 ? (
        <div>
          <div className="px-3 pt-2.5 pb-1 flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-slate-400">
            <span>Matching Apparel ({filteredSearch.length})</span>
            <span className="text-[10px] text-emerald-400 font-bold">✓ Ready for Dispatch</span>
          </div>
          <div className="divide-y divide-slate-800">
            {filteredSearch.map(searchHit)}
          </div>
          <div className="p-2.5 bg-slate-950">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                goSearch();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <span>View all results for &ldquo;{queryText}&rdquo;</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : queryText.length >= 2 ? (
        <div className="p-6 text-center text-slate-400">
          <Shirt className="w-8 h-8 mx-auto text-slate-600 mb-2" />
          <p className="font-extrabold text-xs text-slate-200">
            No exact item matches &ldquo;{queryText}&rdquo;
          </p>
          <p className="text-[11px] text-slate-400 mt-1 mb-3">
            Try checking your search term or select one of the popular categories above.
          </p>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              goSearch();
            }}
            className="text-xs font-bold text-amber-400 hover:underline cursor-pointer"
          >
            Search entire store catalog &rarr;
          </button>
        </div>
      ) : null}
    </div>
  );

  return (
    <>
      {staffPreview && (
        <div className="bg-[#0B0F19] border-b border-amber-400/30 text-white text-[11px] sm:text-xs px-3 sm:px-4 py-2 flex items-center justify-between gap-3">
          <span className="font-medium text-amber-300">
            Viewing storefront as customer. Admin session active.
          </span>
          <Link href="/admin" className="font-bold text-white underline shrink-0">
            Back to admin
          </Link>
        </div>
      )}
      <header className="sticky top-0 z-40 bg-[#091518]/95 backdrop-blur-md border-b border-[#143337] shadow-xl">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3.5 flex items-center justify-between gap-2 sm:gap-6">
          <Link
            href="/"
            className="flex items-center gap-2.5 flex-shrink-0 group min-w-0 max-w-[72%] sm:max-w-none"
          >
            <BrandLogo
              size={44}
              priority
              className="w-10 h-10 sm:w-11 sm:h-11 shadow-lg"
            />
            <div className="min-w-0">
              <h1 className="font-heading font-black text-sm sm:text-lg text-white tracking-tight leading-tight truncate">
                VR MEN&apos;S WEAR
              </h1>
              <p className="text-[9.5px] bg-gradient-to-r from-orange-400 via-amber-300 to-teal-300 bg-clip-text text-transparent font-extrabold tracking-[0.2em] uppercase hidden sm:block truncate">
                Flagship Store · Chennai
              </p>
            </div>
          </Link>

          {/* Desktop Search Bar with Category Switcher */}
          <div className="flex-1 max-w-xl hidden sm:block relative">
            <div className="flex border border-[#16383D] rounded-xl overflow-hidden focus-within:border-orange-500 bg-[#0D2125] transition-colors shadow-inner">
              <select
                value={selectedCategory || 'all'}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-[#091619] border-r border-[#16383D] text-xs font-bold text-slate-300 px-3 py-2 outline-none cursor-pointer hover:text-orange-400"
              >
                <option value="all">All Styles</option>
                <option value="cat-shirts">Shirts</option>
                <option value="cat-tshirts">T-Shirts</option>
                <option value="cat-trousers">Trousers</option>
                <option value="cat-jeans">Jeans</option>
                <option value="cat-kurtas">Kurtas</option>
                <option value="cat-combos">3-in-1 Combos</option>
              </select>
              <input
                type="text"
                placeholder="Search shirts, trousers, kurtas, 3-in-1 combos..."
                value={localQuery}
                onChange={(e) => onQueryChange(e.target.value)}
                onFocus={() => setShowSearchDropdown(true)}
                onBlur={() => setTimeout(() => setShowSearchDropdown(false), 280)}
                className="w-full px-3 py-2 text-sm text-white placeholder-slate-400 outline-none bg-transparent"
              />
              <button
                type="button"
                onClick={goSearch}
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white px-4 flex items-center justify-center font-bold transition-all shadow-md cursor-pointer"
                aria-label="Search"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>

            {showSearchDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden text-xs">
                {dropdownBody}
              </div>
            )}
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {user && (
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowNotifDropdown(!showNotifDropdown);
                    if (!showNotifDropdown) fetchNotifications();
                  }}
                  className="relative flex p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 min-h-10 min-w-10 sm:min-h-11 sm:min-w-11 items-center justify-center cursor-pointer touch-manipulation"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotifCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-amber-400 text-slate-950 text-[10px] font-black rounded-full flex items-center justify-center shadow-xs animate-pulse">
                      {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                    </span>
                  )}
                </button>

                {showNotifDropdown && (
                  <div className="absolute top-full right-0 mt-2 w-[calc(100vw-1.5rem)] max-w-sm sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden text-xs">
                    <div className="p-3 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
                      <div className="flex items-center gap-2 font-bold">
                        <Bell className="w-4 h-4 text-amber-400" />
                        <span>Notifications</span>
                        {unreadNotifCount > 0 && (
                          <span className="bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full text-[10px] font-black">
                            {unreadNotifCount} new
                          </span>
                        )}
                      </div>
                      {unreadNotifCount > 0 && (
                        <button
                          type="button"
                          onClick={handleMarkAllRead}
                          className="text-[11px] text-amber-300 hover:text-white flex items-center gap-1 font-semibold"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          Mark read
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-800">
                      {notificationsList.length === 0 ? (
                        <div className="p-6 text-center text-slate-400">
                          <Bell className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                          <p className="font-medium text-slate-300">No notifications yet</p>
                          <p className="text-[11px] text-slate-500 mt-1">Order status and tracking updates will appear here.</p>
                        </div>
                      ) : (
                        notificationsList.map((n) => (
                          <div
                            key={n.id}
                            className={`p-3.5 transition-colors ${
                              !n.isRead ? 'bg-amber-400/10 border-l-4 border-l-amber-400' : 'hover:bg-slate-800/50'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-bold text-white text-xs">{n.title}</h4>
                              <span className="text-[10px] text-slate-500 shrink-0">
                                {new Date(n.createdAt).toLocaleDateString('en-IN', {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            </div>
                            <p className="text-slate-300 text-[11px] leading-relaxed mt-1">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <Link
              href={user ? '/profile' : '#'}
              onClick={(e) => {
                if (!user) {
                  e.preventDefault();
                  setIsAuthOpen(true);
                }
              }}
              className="hidden sm:flex p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 min-h-11 min-w-11 items-center justify-center shrink-0 cursor-pointer"
              aria-label={user ? 'Profile' : 'Login'}
            >
              <User className="w-5 h-5 text-amber-400" />
            </Link>

            <Link
              href="/wishlist"
              className="relative flex p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 min-h-10 min-w-10 sm:min-h-11 sm:min-w-11 items-center justify-center shrink-0 cursor-pointer"
              aria-label="Wishlist"
            >
              <Heart
                className={`w-5 h-5 ${
                  mounted && wishlistCount > 0 ? 'text-rose-500 fill-rose-500' : 'text-slate-300'
                }`}
              />
              {mounted && wishlistCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <Link
              href="/cart"
              onPointerEnter={() => router.prefetch('/cart')}
              className="relative hidden sm:flex p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 min-h-11 min-w-11 items-center justify-center shrink-0 cursor-pointer"
              aria-label="Cart"
            >
              <ShoppingBag className="w-5 h-5 text-amber-400" />
              {mounted && cartCount > 0 && (
                <span
                  className={`absolute top-0.5 right-0.5 w-4 h-4 bg-amber-400 text-slate-950 text-[10px] font-black rounded-full flex items-center justify-center shadow-xs ${
                    cartBump ? 'cart-badge-bump' : ''
                  }`}
                >
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="px-3 pb-2.5 sm:hidden">
          <div className="relative">
            <div className="flex border border-slate-800 rounded-xl overflow-hidden bg-slate-900 focus-within:border-amber-400">
              <input
                type="search"
                enterKeyHint="search"
                placeholder="Search shirts, kurtas, combos..."
                value={localQuery}
                onChange={(e) => onQueryChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') goSearch();
                }}
                onFocus={() => setShowSearchDropdown(true)}
                onBlur={() => setTimeout(() => setShowSearchDropdown(false), 280)}
                className="w-full pl-3 pr-2 py-2.5 text-base text-white placeholder-slate-500 outline-none bg-transparent min-h-[44px]"
              />
              <button
                type="button"
                onClick={goSearch}
                className="bg-amber-400 text-slate-950 px-3.5 flex items-center justify-center touch-manipulation font-bold"
                aria-label="Search"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>

            {showSearchDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden text-xs max-h-[60vh] overflow-y-auto">
                {dropdownBody}
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
};
