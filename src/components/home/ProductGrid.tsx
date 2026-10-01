'use client';

import React, { useMemo } from 'react';
import { Sparkles, Shirt, Layers, Tag } from 'lucide-react';
import { ProductCard } from '@/components/ui/ProductCard';
import { ProductCardSkeletonGrid } from '@/components/ui/ProductCardSkeleton';
import { useStore } from '@/context/StoreContext';
import { isComboItem } from '@/lib/deliveryRules';

const FILTER_CATEGORIES = [
  { id: 'all', label: 'All Collection' },
  { id: 'cat-shirts', label: 'Shirts' },
  { id: 'cat-tshirts', label: 'T-Shirts' },
  { id: 'cat-trousers', label: 'Trousers' },
  { id: 'cat-jeans', label: 'Jeans' },
  { id: 'cat-kurtas', label: 'Kurtas' },
  { id: 'cat-combos', label: '3-in-1 Combos', isHighlight: true },
];

export const ProductGrid = () => {
  const {
    products,
    productsLoading,
    searchQuery,
    selectedCategory,
    setSelectedCategory,
    setSearchQuery,
  } = useStore();

  const filteredProducts = useMemo(() => {
    return products.filter((product: any) => {
      const catFilter = (selectedCategory || 'all').toLowerCase();

      if (catFilter !== 'all') {
        const isCombo = isComboItem(product) || product.category === 'cat-combos' || product.category === 'combo';
        if (catFilter === 'cat-combos' || catFilter === 'combo') {
          if (!isCombo) return false;
        } else {
          // If filtering for another category, skip combos unless category matches
          const pCat = (product.category || '').toLowerCase();
          const matchesCat =
            pCat === catFilter ||
            (catFilter === 'cat-shirts' && (pCat.includes('shirt') && !pCat.includes('t-shirt'))) ||
            (catFilter === 'cat-tshirts' && (pCat.includes('t-shirt') || pCat.includes('tshirt') || pCat.includes('polo'))) ||
            (catFilter === 'cat-trousers' && (pCat.includes('trouser') || pCat.includes('chino') || pCat.includes('pant'))) ||
            (catFilter === 'cat-jeans' && (pCat.includes('jean') || pCat.includes('denim'))) ||
            (catFilter === 'cat-kurtas' && (pCat.includes('kurta') || pCat.includes('ethnic')));
          if (!matchesCat) return false;
        }
      }

      if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = product.title?.toLowerCase().includes(q);
        const matchesFabric = product.fabric?.toLowerCase().includes(q);
        const matchesFit = product.fit?.toLowerCase().includes(q);
        const matchesBrand = product.brand?.toLowerCase().includes(q);
        const matchesCat = product.category?.toLowerCase().includes(q);
        const matchesSizes = Array.isArray(product.sizesAvailable) && product.sizesAvailable.some((s: any) => String(s).toLowerCase().includes(q));
        const matchesComboItems =
          Array.isArray(product.comboItems) &&
          product.comboItems.some((ci: any) => (typeof ci === 'string' ? ci : ci.name || '').toLowerCase().includes(q));
        const matchesCombo =
          (q.includes('combo') ||
            q.includes('pack of 3') ||
            q.includes('3 in 1') ||
            q.includes('3 dress') ||
            q.includes('set')) &&
          isComboItem(product);

        if (
          !matchesTitle &&
          !matchesFabric &&
          !matchesFit &&
          !matchesBrand &&
          !matchesCat &&
          !matchesSizes &&
          !matchesComboItems &&
          !matchesCombo
        ) {
          return false;
        }
      }
      return true;
    });
  }, [products, selectedCategory, searchQuery]);

  return (
    <section id="products" className="py-8 sm:py-14 bg-slate-950 text-white border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-9">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-[10px] sm:text-xs font-bold text-amber-400 uppercase tracking-widest">
                VR Men&apos;s Storefront
              </span>
            </div>
            <h2 className="font-heading font-black text-xl sm:text-2xl md:text-3xl text-white tracking-tight uppercase">
              CURATED MENSWEAR COLLECTION
            </h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              {productsLoading && products.length === 0
                ? 'Loading collection…'
                : `${filteredProducts.length} style${filteredProducts.length === 1 ? '' : 's'} available`}
            </p>
          </div>

          {/* Filter Pills — horizontal scroll on mobile */}
          <div className="flex flex-nowrap sm:flex-wrap items-center gap-2 overflow-x-auto scroll-chips w-full sm:w-auto pb-1 -mx-1 px-1">
            {FILTER_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id || (cat.id === 'all' && (!selectedCategory || selectedCategory === 'all'));
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all shrink-0 min-h-11 touch-manipulation flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950 shadow-lg font-black'
                      : cat.isHighlight
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-400/40 hover:bg-amber-400/25'
                      : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  {cat.id === 'cat-combos' ? <Layers className="w-3.5 h-3.5" /> : null}
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid or Clean Empty State */}
        {productsLoading && products.length === 0 ? (
          <ProductCardSkeletonGrid count={8} />
        ) : filteredProducts.length === 0 ? (
          <div className="py-16 text-center bg-slate-900/60 border border-dashed border-slate-800 rounded-3xl p-8 max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-amber-400/10 text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-400/30">
              <Shirt className="w-8 h-8" />
            </div>
            <h3 className="font-heading font-black text-xl text-white mb-1">
              No Styles Found
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
              No clothing items currently match this category or search filter. Try resetting filters or exploring our combo packs.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-6 py-3 rounded-xl transition-all shadow-md active:scale-95 touch-manipulation"
              >
                Reset All Filters
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
