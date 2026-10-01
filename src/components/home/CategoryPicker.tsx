'use client';

import React from 'react';
import { useStore } from '@/context/StoreContext';
import { Sparkles, Shirt, Layers, ShoppingBag, Flame, Tag } from 'lucide-react';

interface CategoryCard {
  id: string;
  name: string;
  subtitle: string;
  badge?: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
}

const APPAREL_CATEGORIES: CategoryCard[] = [
  {
    id: 'cat-shirts',
    name: 'Formal & Casual Shirts',
    subtitle: 'Pure Cotton & Linen Fits',
    badge: 'Best Seller',
    icon: Shirt,
    accentColor: 'from-orange-500/20 via-teal-900/20 to-transparent border-teal-500/30 text-orange-400',
  },
  {
    id: 'cat-tshirts',
    name: 'Premium T-Shirts',
    subtitle: 'Polo & Heavyweight 220 GSM',
    badge: 'Trending',
    icon: Shirt,
    accentColor: 'from-orange-600/20 via-amber-600/10 to-transparent border-orange-500/30 text-orange-400',
  },
  {
    id: 'cat-trousers',
    name: 'Trousers & Chinos',
    subtitle: 'Stretch Tailored Fits',
    icon: Tag,
    accentColor: 'from-teal-600/20 via-emerald-600/10 to-transparent border-teal-500/30 text-teal-300',
  },
  {
    id: 'cat-jeans',
    name: 'Denim & Jeans',
    subtitle: 'Comfort Stretch Selvedge',
    icon: ShoppingBag,
    accentColor: 'from-cyan-600/20 via-teal-700/10 to-transparent border-cyan-500/30 text-cyan-300',
  },
  {
    id: 'cat-kurtas',
    name: 'Ethnic & Festive Kurtas',
    subtitle: 'Silk Blend & Jacquard Weave',
    badge: 'Festive',
    icon: Flame,
    accentColor: 'from-amber-600/20 via-orange-600/10 to-transparent border-amber-500/30 text-amber-300',
  },
  {
    id: 'cat-combos',
    name: '3-in-1 Combo Packs',
    subtitle: '3 Dresses in One • Save 50%',
    badge: 'Mega Value',
    icon: Layers,
    accentColor: 'from-orange-600/30 via-red-600/20 to-teal-900/30 border-orange-500/60 text-orange-300 ring-1 ring-orange-500/40',
  },
];

export const CategoryPicker = () => {
  const { selectedCategory, setSelectedCategory } = useStore();

  const handleSelectCategory = (catId: string) => {
    setSelectedCategory(catId);
    const elem = document.getElementById('products');
    if (elem) elem.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="py-8 sm:py-12 bg-[#061113] border-t border-[#143337] relative overflow-hidden">
      <div className="absolute top-0 right-1/3 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="text-center mb-6 sm:mb-9">
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-orange-400 bg-orange-500/10 border border-orange-500/30 px-3.5 py-1 rounded-full inline-flex items-center gap-1.5 mb-2 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
            CURATED MEN&apos;S WARDROBE
          </span>
          <h2 className="font-heading font-black text-xl sm:text-3xl md:text-4xl text-white tracking-tight uppercase">
            EXPLORE BY CATEGORY
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm font-medium mt-1 px-2">
            Handcrafted menswear tailored for sharp style, everyday comfort &amp; high durability
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {APPAREL_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleSelectCategory(cat.id)}
                className={`relative flex flex-col items-center justify-between p-4 sm:p-5 rounded-2xl border text-center touch-manipulation transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl bg-gradient-to-b ${
                  cat.accentColor
                } ${
                  isSelected
                    ? 'ring-2 ring-orange-500 shadow-xl shadow-orange-950/50 font-bold bg-[#0D2529] scale-[1.03] border-orange-500'
                    : 'bg-[#0A1619]/90 hover:bg-[#0E2024] shadow-sm border-[#16383D]'
                }`}
              >
                {cat.badge && (
                  <span className="absolute -top-2.5 right-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md">
                    {cat.badge}
                  </span>
                )}
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-3 text-orange-400">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-heading font-black text-xs sm:text-sm text-white leading-snug">
                    {cat.name}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                    {cat.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
