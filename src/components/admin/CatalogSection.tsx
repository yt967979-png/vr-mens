'use client';

import React, { useState, useMemo, useRef } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Upload,
  Filter,
  CheckCircle2,
  ImageIcon,
  RefreshCw,
  Eye,
  AlertTriangle,
  ChevronDown,
  Layers,
  Ruler,
  Tag,
  Package,
  Sparkles,
} from 'lucide-react';
import type { Product } from '@/context/StoreContext';
import { useStore } from '@/context/StoreContext';
import { authFormHeaders } from '@/lib/clientAuth';
import { APPAREL_CATEGORIES, STANDARD_TOP_SIZES, STANDARD_BOTTOM_SIZES, STANDARD_COMBO_SIZES } from '@/lib/products';
import { isComboItem } from '@/lib/deliveryRules';

interface CatalogSectionProps {
  products: Product[];
  onUpdateProduct: (id: string | number, updates: any) => Promise<any> | void;
  onAddNewProduct?: (product: any) => Promise<any> | void;
  onCreateProduct?: (product: any) => Promise<any> | void;
  onDeleteProduct: (id: string | number) => Promise<any> | void;
  onShowToast: (msg: string) => void;
  authHeaders?: Record<string, string>;
  activeStockHolds?: { count: number; totalQty: number; list?: any[] | undefined };
  onReleaseHold?: (holdGroupId: string, bookTitle: string) => Promise<void> | void;
}

interface SizeVariantInput {
  size: string;
  price: number;
  mrp: number;
  stock: number;
  enabled: boolean;
}

export function CatalogSection({
  products,
  onUpdateProduct,
  onCreateProduct,
  onDeleteProduct,
  onShowToast,
}: CatalogSectionProps) {
  const { user, refreshProducts } = useStore();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State: Product Information
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('shirts');
  const [formBrand, setFormBrand] = useState("VR Men's Wear");
  const [formBasePrice, setFormBasePrice] = useState<string>('599');
  const [formBaseMrp, setFormBaseMrp] = useState<string>('1299');
  const [formFabric, setFormFabric] = useState('100% Combed Cotton');
  const [formFit, setFormFit] = useState('Slim Fit');
  const [formSleeve, setFormSleeve] = useState('Full Sleeve');
  const [formPattern, setFormPattern] = useState('Solid');
  const [formCare, setFormCare] = useState('Machine Wash Cold');
  const [formDescription, setFormDescription] = useState('');
  const [formBadge, setFormBadge] = useState('Best Seller');

  // Form State: Multi-Photo Gallery
  const [formPrimaryImage, setFormPrimaryImage] = useState('');
  const [formGalleryImages, setFormGalleryImages] = useState<string[]>([]);
  const [imageUploading, setImageUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State: 3-in-1 Combo Pack Details
  const [formIsCombo, setFormIsCombo] = useState(false);
  const [formComboItems, setFormComboItems] = useState<string[]>([
    '1x Navy Blue Solid Shirt',
    '1x Crisp White Solid Shirt',
    '1x Charcoal Grey Solid Shirt',
  ]);
  const [newComboItemText, setNewComboItemText] = useState('');

  // Form State: Dynamic Size & Pricing Matrix
  const [sizePresetType, setSizePresetType] = useState<'top' | 'bottom' | 'combo'>('top');
  const [sizeVariants, setSizeVariants] = useState<Record<string, SizeVariantInput>>(() => {
    const init: Record<string, SizeVariantInput> = {};
    STANDARD_TOP_SIZES.forEach((s) => {
      init[s] = { size: s, price: 599, mrp: 1299, stock: 20, enabled: ['M', 'L', 'XL'].includes(s) };
    });
    return init;
  });

  // Switch size preset types
  const handlePresetChange = (type: 'top' | 'bottom' | 'combo') => {
    setSizePresetType(type);
    const list = type === 'top' ? STANDARD_TOP_SIZES : type === 'bottom' ? STANDARD_BOTTOM_SIZES : STANDARD_COMBO_SIZES;
    const baseP = Number(formBasePrice) || 599;
    const baseM = Number(formBaseMrp) || 1299;
    const updated: Record<string, SizeVariantInput> = {};
    list.forEach((s, idx) => {
      updated[s] = {
        size: s,
        price: baseP,
        mrp: baseM,
        stock: 20,
        enabled: idx < 3, // Enable first 3 by default
      };
    });
    setSizeVariants(updated);
  };

  // 1-Click apply base price & MRP to all enabled sizes
  const handleApplyBasePriceToAllSizes = () => {
    const p = Number(formBasePrice) || 599;
    const m = Number(formBaseMrp) || 1299;
    setSizeVariants((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        if (next[k].enabled) {
          next[k] = { ...next[k], price: p, mrp: m };
        }
      });
      return next;
    });
    onShowToast('✓ Applied base price & MRP to all enabled sizes');
  };

  // Image upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isPrimary = true) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      onShowToast('❌ File too large. Max 10MB allowed.');
      return;
    }

    setImageUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', 'apparel');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: authFormHeaders(user),
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      if (isPrimary) {
        setFormPrimaryImage(data.url);
        onShowToast('✅ Primary cover image uploaded');
      } else {
        setFormGalleryImages((prev) => [...prev, data.url].slice(0, 4));
        onShowToast('✅ Gallery photo uploaded');
      }
    } catch (err: any) {
      onShowToast(`❌ Upload error: ${err.message}`);
    } finally {
      setImageUploading(false);
    }
  };

  // Open modal in edit mode
  const handleStartEdit = (p: Product) => {
    setEditingProduct(p);
    setFormTitle(p.title || '');
    setFormCategory(p.category || 'shirts');
    setFormBrand(p.brand || "VR Men's Wear");
    setFormBasePrice(String(p.price || 599));
    setFormBaseMrp(String(p.mrp || 1299));
    setFormFabric(p.fabric || '100% Combed Cotton');
    setFormFit(p.fit || 'Slim Fit');
    setFormSleeve(p.sleeve || 'Full Sleeve');
    setFormPattern(p.pattern || 'Solid');
    setFormCare(p.care || 'Machine Wash Cold');
    setFormDescription(p.description || '');
    setFormBadge(p.badge || '');
    setFormPrimaryImage(p.image || '');

    const imgs = Array.isArray(p.images) ? p.images : (p.image ? [p.image] : []);
    setFormGalleryImages(imgs);

    const isComb = Boolean(p.isCombo || p.is_combo || p.category === 'combos' || isComboItem(p));
    setFormIsCombo(isComb);
    const cItems = Array.isArray(p.comboItems) ? p.comboItems : (Array.isArray(p.combo_items) ? p.combo_items : []);
    setFormComboItems(cItems.length > 0 ? cItems : ['1x Dress A', '1x Dress B', '1x Dress C']);

    // Set up size variants
    const baseP = Number(p.price) || 599;
    const baseM = Number(p.mrp) || 1299;
    const existingVariants = Array.isArray(p.variants) ? p.variants : [];
    const sizesTicked = (p as any).sizesAvailable || (p as any).sizes_available || (existingVariants.length > 0 ? existingVariants.map((v: any) => v.size) : ['M', 'L', 'XL']);

    const isBottom = ['trousers', 'jeans'].includes(p.category || '');
    const preset = isComb ? 'combo' : isBottom ? 'bottom' : 'top';
    setSizePresetType(preset);
    const list = preset === 'top' ? STANDARD_TOP_SIZES : preset === 'bottom' ? STANDARD_BOTTOM_SIZES : STANDARD_COMBO_SIZES;

    const map: Record<string, SizeVariantInput> = {};
    list.forEach((s) => {
      const match = existingVariants.find((v: any) => v.size === s);
      const isEnabled = sizesTicked.includes(s) || Boolean(match);
      map[s] = {
        size: s,
        price: match ? match.price : baseP,
        mrp: match && match.mrp ? match.mrp : baseM,
        stock: match && typeof match.stock === 'number' ? match.stock : 20,
        enabled: isEnabled,
      };
    });
    setSizeVariants(map);
    setShowAddModal(true);
  };

  // Submit product creation or update
  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      onShowToast('⚠️ Please enter an apparel title');
      return;
    }

    // Filter only the sizes that the admin TICKED!
    const enabledVariants = Object.values(sizeVariants)
      .filter((v) => v.enabled)
      .map((v) => ({
        size: v.size,
        price: Number(v.price) || Number(formBasePrice),
        mrp: Number(v.mrp) || Number(formBaseMrp),
        stock: Math.max(0, Number(v.stock) || 0),
      }));

    if (enabledVariants.length === 0) {
      onShowToast('⚠️ Please tick at least one size for this product');
      return;
    }

    const sizesAvailable = enabledVariants.map((v) => v.size);
    const totalStock = enabledVariants.reduce((sum, v) => sum + v.stock, 0);
    const primaryImg = formPrimaryImage || (formGalleryImages[0] || 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80');
    const allImages = formGalleryImages.length > 0 ? formGalleryImages : [primaryImg];

    const payload = {
      title: formTitle.trim(),
      category: formCategory,
      category_id: `cat-${formCategory}`,
      brand: formBrand.trim(),
      price: enabledVariants[0].price,
      mrp: enabledVariants[0].mrp,
      stock: totalStock,
      inStock: totalStock > 0,
      image: primaryImg,
      images: allImages,
      fabric: formFabric,
      fit: formFit,
      sleeve: formSleeve,
      pattern: formPattern,
      care: formCare,
      description: formDescription || `Premium ${formTitle} crafted for modern style and maximum all-day comfort.`,
      badge: formBadge,
      is_combo: formIsCombo,
      isCombo: formIsCombo,
      combo_items: formIsCombo ? formComboItems : [],
      comboItems: formIsCombo ? formComboItems : [],
      sizes_available: sizesAvailable,
      sizesAvailable: sizesAvailable,
      variants: enabledVariants,
    };

    try {
      if (editingProduct) {
        await onUpdateProduct(editingProduct.id, payload);
        onShowToast('✅ Apparel product updated successfully');
      } else if (onCreateProduct) {
        await onCreateProduct(payload);
        onShowToast('✅ New apparel product added to collection');
      }
      refreshProducts(true);
      setShowAddModal(false);
      setEditingProduct(null);
    } catch (err: any) {
      onShowToast(`❌ Error: ${err.message}`);
    }
  };

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p: any) => {
      const matchSearch =
        searchQuery.trim() === '' ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        Boolean(p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
        Boolean(p.fabric && p.fabric.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCat =
        selectedCategoryFilter === 'all' ||
        p.category === selectedCategoryFilter ||
        p.categoryId === `cat-${selectedCategoryFilter}` ||
        (selectedCategoryFilter === 'combos' && Boolean(p.isCombo || isComboItem(p)));

      return matchSearch && matchCat;
    });
  }, [products, searchQuery, selectedCategoryFilter]);

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            VR Men&apos;s Collection Catalog
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Apparel Inventory &amp; Variants
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage shirts, t-shirts, trousers, kurtas, size variants, and 3-in-1 combo packs
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => refreshProducts(true)}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
            title="Refresh Catalog"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingProduct(null);
              setFormTitle('');
              setFormCategory('shirts');
              setFormBasePrice('599');
              setFormBaseMrp('1299');
              setFormPrimaryImage('');
              setFormGalleryImages([]);
              setFormIsCombo(false);
              handlePresetChange('top');
              setShowAddModal(true);
            }}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-600 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center gap-2 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Apparel</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search products by title, fabric, or brand..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm outline-none focus:border-amber-500 shadow-sm"
          />
        </div>

        {/* Category Pills */}
        <div className="flex gap-1.5 overflow-x-auto py-1">
          <button
            type="button"
            onClick={() => setSelectedCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              selectedCategoryFilter === 'all'
                ? 'bg-slate-900 dark:bg-amber-500 text-white'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
            }`}
          >
            All Items ({products.length})
          </button>
          {APPAREL_CATEGORIES.map((cat) => (
            <button
              key={cat.slug}
              type="button"
              onClick={() => setSelectedCategoryFilter(cat.slug)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                selectedCategoryFilter === cat.slug
                  ? 'bg-slate-900 dark:bg-amber-500 text-white'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Product Details</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Price &amp; MRP</th>
                <th className="py-3.5 px-4">Sizes &amp; Inventory</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No apparel products found matching your search.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p: any) => {
                  const variants = Array.isArray(p.variants) ? p.variants : [];
                  const isCombo = Boolean(p.isCombo || p.is_combo || String(p.category).includes('combo') || isComboItem(p));
                  const isOOS = p.inStock === false || (p.stock !== undefined && p.stock <= 0);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                      {/* Product image & title */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-14 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden relative shrink-0 border border-slate-200 dark:border-slate-700">
                            <img
                              src={p.image || 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=100&q=80'}
                              alt=""
                              className="w-full h-full object-cover object-top"
                            />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white line-clamp-1">
                              {p.title}
                            </span>
                            <div className="flex items-center gap-2 text-[10.5px] text-slate-400 mt-0.5">
                              <span>{p.brand || "VR Men's Wear"}</span>
                              {p.fabric && <span>• {p.fabric}</span>}
                              {isCombo && (
                                <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 font-bold">
                                  3-in-1 Combo
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300 capitalize">
                        {p.category || 'Shirts'}
                      </td>

                      {/* Price & MRP */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-black text-slate-900 dark:text-white">
                            ₹{p.price}
                          </span>
                          {p.mrp > p.price && (
                            <span className="text-[11px] text-slate-400 line-through">
                              ₹{p.mrp}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Sizes & Stock */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[180px]">
                          {variants.length > 0 ? (
                            variants.map((v: any) => (
                              <span
                                key={v.size}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                                  v.stock > 0
                                    ? 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                    : 'bg-red-50 text-red-500 border-red-200 line-through'
                                }`}
                                title={`Size ${v.size}: ₹${v.price} (${v.stock} in stock)`}
                              >
                                {v.size}:{v.stock}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-500">
                              {p.stock ?? 50} units
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            isOOS
                              ? 'bg-rose-50 text-rose-600'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {isOOS ? 'Out of Stock' : 'Active'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(p)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                            title="Edit Product & Sizes"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteProduct(p.id)}
                            className="p-1.5 rounded-lg border border-rose-200 text-rose-500 hover:bg-rose-50"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT APPAREL MODAL WITH DYNAMIC SIZE & COMBO MATRIX */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">
                  VR Men&apos;s Collection Editor
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {editingProduct ? 'Edit Apparel Product & Sizes' : 'Add New Apparel to Store'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingProduct(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body Form */}
            <form onSubmit={handleSubmitProduct} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              
              {/* SECTION 1: BASIC INFORMATION */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-4">
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-amber-500" />
                  <span>1. Product Identity</span>
                </h4>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Royal Oxford Pure Cotton Slim Fit Shirt"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Category *
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => {
                        const cat = e.target.value;
                        setFormCategory(cat);
                        if (cat === 'combos') {
                          setFormIsCombo(true);
                          handlePresetChange('combo');
                        } else if (['trousers', 'jeans'].includes(cat)) {
                          handlePresetChange('bottom');
                        } else {
                          handlePresetChange('top');
                        }
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold outline-none"
                    >
                      {APPAREL_CATEGORIES.map((c) => (
                        <option key={c.slug} value={c.slug}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Base Offer Price (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={formBasePrice}
                      onChange={(e) => setFormBasePrice(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Base Printed MRP (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={formBaseMrp}
                      onChange={(e) => setFormBaseMrp(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold outline-none"
                    />
                  </div>
                </div>

                {/* Fabric & Fit Details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1 text-[11px]">
                      Fabric Material
                    </label>
                    <input
                      type="text"
                      value={formFabric}
                      onChange={(e) => setFormFabric(e.target.value)}
                      placeholder="e.g. 100% Cotton"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1 text-[11px]">
                      Fit
                    </label>
                    <input
                      type="text"
                      value={formFit}
                      onChange={(e) => setFormFit(e.target.value)}
                      placeholder="e.g. Slim Fit"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1 text-[11px]">
                      Sleeve
                    </label>
                    <input
                      type="text"
                      value={formSleeve}
                      onChange={(e) => setFormSleeve(e.target.value)}
                      placeholder="e.g. Full Sleeve"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1 text-[11px]">
                      Pattern
                    </label>
                    <input
                      type="text"
                      value={formPattern}
                      onChange={(e) => setFormPattern(e.target.value)}
                      placeholder="e.g. Solid / Checked"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: PRODUCT PHOTOS UPLOAD */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-amber-500" />
                  <span>2. Product Photography Gallery</span>
                </h4>

                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  {/* Primary Photo Preview */}
                  <div className="w-24 h-28 rounded-xl bg-slate-200 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 overflow-hidden relative shrink-0 flex items-center justify-center">
                    {formPrimaryImage ? (
                      <img src={formPrimaryImage} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] text-slate-400 text-center px-1">No Cover</span>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <label className="block font-bold text-slate-700 dark:text-slate-300">
                      Primary Cover Photo URL or Upload *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Paste image link or click upload"
                        value={formPrimaryImage}
                        onChange={(e) => setFormPrimaryImage(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                      />
                      <label className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg cursor-pointer flex items-center gap-1 shrink-0">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{imageUploading ? 'Uploading...' : 'Upload'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, true)}
                        />
                      </label>
                    </div>
                    <p className="text-[10.5px] text-slate-400">
                      Upload front, model fit, or high-res apparel photos.
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION 3: DYNAMIC SIZE & PRICING MATRIX (THE USER'S REQUEST!) */}
              <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border-2 border-amber-300/80 dark:border-amber-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-amber-900 dark:text-amber-400 flex items-center gap-1.5">
                      <Ruler className="w-4 h-4" />
                      <span>3. Size Matrix &amp; Dynamic Pricing (Flipkart Style)</span>
                    </h4>
                    <p className="text-[10.5px] text-slate-600 dark:text-slate-400">
                      Tick ONLY the sizes available for this product. You can set a custom price &amp; stock per size!
                    </p>
                  </div>

                  {/* 1-Click fast copy */}
                  <button
                    type="button"
                    onClick={handleApplyBasePriceToAllSizes}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[11px] self-start sm:self-auto cursor-pointer"
                  >
                    Copy Base Price to All Checked Sizes
                  </button>
                </div>

                {/* Preset switch buttons */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handlePresetChange('top')}
                    className={`px-3 py-1 rounded-md text-[11px] font-bold ${
                      sizePresetType === 'top'
                        ? 'bg-slate-900 text-white'
                        : 'bg-white dark:bg-slate-800 text-slate-600 border'
                    }`}
                  >
                    Shirts / T-Shirts (S, M, L, XL, XXL)
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetChange('bottom')}
                    className={`px-3 py-1 rounded-md text-[11px] font-bold ${
                      sizePresetType === 'bottom'
                        ? 'bg-slate-900 text-white'
                        : 'bg-white dark:bg-slate-800 text-slate-600 border'
                    }`}
                  >
                    Trousers / Jeans (28, 30, 32, 34, 36)
                  </button>
                </div>

                {/* Size Matrix Grid */}
                <div className="space-y-2.5">
                  {Object.keys(sizeVariants).map((sizeKey) => {
                    const v = sizeVariants[sizeKey];
                    return (
                      <div
                        key={sizeKey}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border transition ${
                          v.enabled
                            ? 'bg-white dark:bg-slate-800 border-amber-400 shadow-sm'
                            : 'bg-slate-100/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-60'
                        }`}
                      >
                        {/* Checkbox to tick this size */}
                        <label className="flex items-center gap-2.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={v.enabled}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setSizeVariants((prev) => ({
                                ...prev,
                                [sizeKey]: { ...prev[sizeKey], enabled: checked },
                              }));
                            }}
                            className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                          />
                          <span className={`font-black text-sm ${v.enabled ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                            Size {sizeKey}
                          </span>
                        </label>

                        {/* If ticked, show price, MRP, and stock inputs */}
                        {v.enabled ? (
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-500 text-[11px] font-medium">Selling ₹:</span>
                              <input
                                type="number"
                                min={0}
                                value={v.price}
                                onChange={(e) => {
                                  const val = Number(e.target.value) || 0;
                                  setSizeVariants((prev) => ({
                                    ...prev,
                                    [sizeKey]: { ...prev[sizeKey], price: val },
                                  }));
                                }}
                                className="w-20 px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-bold"
                              />
                            </div>

                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-500 text-[11px] font-medium">MRP ₹:</span>
                              <input
                                type="number"
                                min={0}
                                value={v.mrp}
                                onChange={(e) => {
                                  const val = Number(e.target.value) || 0;
                                  setSizeVariants((prev) => ({
                                    ...prev,
                                    [sizeKey]: { ...prev[sizeKey], mrp: val },
                                  }));
                                }}
                                className="w-20 px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-bold"
                              />
                            </div>

                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-500 text-[11px] font-medium">Stock:</span>
                              <input
                                type="number"
                                min={0}
                                value={v.stock}
                                onChange={(e) => {
                                  const val = Number(e.target.value) || 0;
                                  setSizeVariants((prev) => ({
                                    ...prev,
                                    [sizeKey]: { ...prev[sizeKey], stock: val },
                                  }));
                                }}
                                className="w-16 px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-bold text-center"
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Unticked (Size not available)</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 4: 3 DRESS IN ONE COMBO PACK BUILDER */}
              <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsCombo}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setFormIsCombo(checked);
                        if (checked) {
                          setFormCategory('combos');
                          setFormBadge('3-in-1 Combo');
                        }
                      }}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                    />
                    <span className="font-extrabold text-xs uppercase tracking-wider text-purple-950 dark:text-purple-300 flex items-center gap-1.5">
                      <Layers className="w-4 h-4" />
                      <span>This Product is a Combo Pack (e.g. 3 Dress in One Product)</span>
                    </span>
                  </label>
                </div>

                {formIsCombo && (
                  <div className="space-y-2.5 pt-2">
                    <p className="text-[10.5px] text-slate-600 dark:text-slate-400">
                      List the individual garments included inside this combo bundle:
                    </p>
                    {formComboItems.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-purple-200 text-purple-900 flex items-center justify-center font-bold text-xs shrink-0">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormComboItems((prev) => prev.map((it, i) => (i === idx ? val : it)));
                          }}
                          placeholder={`Included dress #${idx + 1}`}
                          className="flex-1 px-3 py-1.5 rounded-lg border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-900 font-semibold"
                        />
                        <button
                          type="button"
                          onClick={() => setFormComboItems((prev) => prev.filter((_, i) => i !== idx))}
                          className="p-1 text-slate-400 hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    <div className="flex gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="Add another garment (e.g. 1x Sky Blue Linen Shirt)"
                        value={newComboItemText}
                        onChange={(e) => setNewComboItemText(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newComboItemText.trim()) {
                            setFormComboItems((prev) => [...prev, newComboItemText.trim()]);
                            setNewComboItemText('');
                          }
                        }}
                        className="px-3 py-1.5 bg-purple-600 text-white font-bold rounded-lg text-xs"
                      >
                        Add Item
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 5: DESCRIPTION */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Product Description
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Describe the styling, weave, comfort, occasion, and fabric quality..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:border-amber-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-600 text-white font-bold rounded-xl shadow-md"
                >
                  {editingProduct ? 'Save Changes' : 'Publish Product to Store'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CatalogSection;

