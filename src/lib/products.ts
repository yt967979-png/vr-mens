// Product data and types for VR Men's Wear

export interface ProductVariant {
  size: string; // e.g. 'S', 'M', 'L', 'XL', 'XXL', '30', '32', '34', '36', 'Combo Pack'
  price: number; // Selling price for this specific size (₹)
  mrp?: number; // MRP / Cut-price for this specific size (₹)
  stock: number; // Stock inventory count for this specific size
  sku?: string;
  color?: string; // Optional color variant
}

export interface Product {
  id: string | number;
  slug: string;
  title: string;
  subtitle?: string;
  brand?: string;
  category?: 'shirts' | 'tshirts' | 'trousers' | 'jeans' | 'kurtas' | 'ethnic-wear' | 'combos' | string;
  categoryId?: string;
  category_id?: string;
  price: number; // Base selling price
  mrp: number; // Base MRP
  discount?: number; // Discount percentage
  rating?: number;
  reviews?: number;
  badge?: string;
  badgeColor?: string;
  image: string;
  images?: string[]; // Multi-photo gallery (Front, Back, Fabric Close-up, Model)
  hoverImage?: string;
  description?: string;
  fabric?: string; // e.g. '100% Combed Cotton', 'Pure Linen', 'Denim'
  fit?: string; // e.g. 'Slim Fit', 'Regular Fit', 'Relaxed Fit'
  sleeve?: string; // e.g. 'Full Sleeve', 'Half Sleeve', 'Sleeveless'
  pattern?: string; // e.g. 'Solid', 'Checked', 'Striped', 'Printed'
  care?: string; // e.g. 'Machine wash cold, gentle cycle'
  inStock: boolean;
  stock?: number;
  sizesAvailable?: string[]; // e.g. ['M', 'L', 'XL']
  sizes_available?: string[];
  variants?: ProductVariant[]; // Dynamic variants with per-size pricing & stock
  selectedSize?: string;
  isCombo?: boolean;
  is_combo?: boolean;
  comboItems?: string[] | any[]; // e.g. ["1x Classic White Shirt", "1x Navy Blue Shirt", "1x Slate Grey Shirt"]
  combo_items?: string[] | any[];
  isNew?: boolean;
  isBestSeller?: boolean;
  isTrending?: boolean;
  isComingSoon?: boolean;
  is_coming_soon?: boolean;
  status?: string;

  // Backward compatibility fields for any legacy queries
  cls?: string;
  subject?: string;
  features?: string[];
  language?: string;
  medium?: string;
  stockTamil?: number | null;
  stockEnglish?: number | null;
  stock_tamil?: number | null;
  stock_english?: number | null;
  samplePdfUrl?: string | null;
  comboSubjects?: string[];
}

export const APPAREL_CATEGORIES = [
  { id: 'cat-shirts', name: 'Shirts', slug: 'shirts', icon: 'Shirt', desc: 'Formal, Casual & Linen' },
  { id: 'cat-tshirts', name: 'T-Shirts', slug: 'tshirts', icon: 'Smile', desc: 'Polo & Round Neck Tees' },
  { id: 'cat-trousers', name: 'Trousers', slug: 'trousers', icon: 'Layers', desc: 'Chinos & Formal Pants' },
  { id: 'cat-jeans', name: 'Jeans', slug: 'jeans', icon: 'Scissors', desc: 'Slim & Regular Denim' },
  { id: 'cat-kurtas', name: 'Kurtas', slug: 'kurtas', icon: 'Sparkles', desc: 'Ethnic & Festive Wear' },
  { id: 'cat-combos', name: 'Combo Packs', slug: 'combos', icon: 'Package', desc: '3-in-1 Value Packs' },
] as const;

export const STANDARD_TOP_SIZES = ['S', 'M', 'L', 'XL', 'XXL', '3XL'] as const;
export const STANDARD_BOTTOM_SIZES = ['28', '30', '32', '34', '36', '38', '40'] as const;
export const STANDARD_COMBO_SIZES = ['Pack M', 'Pack L', 'Pack XL', 'Pack XXL', 'Free Size'] as const;

export interface CartItem extends Product {
  qty: number;
  selectedSize?: string;
  selectedColor?: string;
  variantPrice?: number;
  variantMrp?: number;
  selectedMedium?: string; // legacy alias
}

export interface UserData {
  id: number | string;
  name: string;
  email: string;
  phone: string;
}

export const PRODUCTS: Product[] = [];
