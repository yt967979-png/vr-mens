export const MIN_BOOKS_PER_ORDER = 1;
export const MIN_ITEMS_PER_ORDER = 1;
export const FREE_DELIVERY_AT_AMOUNT = 999;
export const FREE_DELIVERY_AT_QTY = 3;
export const STANDARD_DELIVERY_FEE = 60;
export const COMBO_BOOK_EQUIVALENT = 3; // 1 combo pack represents 3 apparel items

/** Checks if an item belongs to the Combo Pack category or contains 3-in-1 dresses/shirts */
export function isComboItem(item: any): boolean {
  if (!item) return false;
  if (item.isCombo || item.is_combo) return true;
  if (item.category === 'combos' || item.category === 'combo') return true;
  if (item.category_id === 'cat-combos') return true;

  const title = String(item.title || item.name || '').toLowerCase();
  const hasComboTitle =
    title.includes('combo') ||
    title.includes('pack of') ||
    title.includes('3 in 1') ||
    title.includes('3-in-1') ||
    title.includes('set of') ||
    title.includes('bundle');

  if (hasComboTitle) return true;

  const comboItems = item.comboItems || item.combo_items || item.comboSubjects || item.combo_subjects;
  if (Array.isArray(comboItems) && comboItems.length >= 2) {
    return true;
  }

  return false;
}

/** Returns true if any active item in the cart is a Combo Pack */
export function cartHasCombo(items: any[] | null | undefined): boolean {
  if (!Array.isArray(items)) return false;
  return items.some((item) => Number(item.qty || 0) > 0 && isComboItem(item));
}

/** Calculates total items count */
export function effectiveBookCount(items: any[] | null | undefined): number {
  if (!Array.isArray(items)) return 0;
  return items.reduce((sum, item) => {
    const q = Math.max(0, Number(item.qty || 0));
    if (q === 0) return sum;
    if (isComboItem(item)) {
      return sum + q * COMBO_BOOK_EQUIVALENT;
    }
    return sum + q;
  }, 0);
}

export function booksUntilMinOrder(itemsOrCount: any): number {
  const count = typeof itemsOrCount === 'number' ? itemsOrCount : effectiveBookCount(itemsOrCount);
  return Math.max(0, MIN_ITEMS_PER_ORDER - count);
}

export function minOrderCheckoutMessage(items: any[] | null | undefined): string | null {
  const needed = booksUntilMinOrder(items);
  if (needed <= 0) return null;
  return `Please add at least ${needed} more item to checkout.`;
}

export function isMoqSatisfied(itemsOrCount: any): boolean {
  if (Array.isArray(itemsOrCount)) {
    if (itemsOrCount.length === 0) return false;
    if (cartHasCombo(itemsOrCount)) return true;
    return effectiveBookCount(itemsOrCount) >= MIN_ITEMS_PER_ORDER;
  }
  const num = Number(itemsOrCount || 0);
  return num >= MIN_ITEMS_PER_ORDER;
}

export function deliveryFeeForQty(qty: number, hasCombo = false): number {
  if (hasCombo) return 0;
  if (qty >= FREE_DELIVERY_AT_QTY) return 0;
  return STANDARD_DELIVERY_FEE;
}

export function deliveryFeeForCart(items: any[] | null | undefined, totalAmount?: number): number {
  if (!Array.isArray(items) || items.length === 0) return 0;
  if (cartHasCombo(items)) return 0;
  if (typeof totalAmount === 'number' && totalAmount >= FREE_DELIVERY_AT_AMOUNT) return 0;
  const count = effectiveBookCount(items);
  return deliveryFeeForQty(count, false);
}

export function booksUntilFreeDelivery(itemsOrCount: any): number {
  if (cartHasCombo(Array.isArray(itemsOrCount) ? itemsOrCount : [])) return 0;
  const count = typeof itemsOrCount === 'number' ? itemsOrCount : effectiveBookCount(itemsOrCount);
  return Math.max(0, FREE_DELIVERY_AT_QTY - count);
}


