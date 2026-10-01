/**
 * Shop contact helpers for VR Men's Wear — WhatsApp customer support
 */

export const DEFAULT_CUSTOMER_SUPPORT_PHONE = '+91 94860 17820';
export const SECONDARY_CONTACT_PHONE = '+91 63829 63350';

function digitsOnly(raw: string) {
  return String(raw || '').replace(/\D/g, '');
}

/** E.164-ish digits for wa.me */
export function getShopWhatsAppDigits(): string {
  const raw =
    process.env.NEXT_PUBLIC_ADMIN_PHONE ||
    process.env.ADMIN_PHONE ||
    process.env.NEXT_PUBLIC_SHOP_PHONE ||
    '9486017820';
  const d = digitsOnly(raw);
  if (d.length === 10) return `91${d}`;
  if (d.length >= 12 && d.startsWith('91')) return d.slice(0, 12);
  if (d.length > 10) return d;
  return '919486017820';
}

/** Display form e.g. +91 94860 17820 */
export function getShopPhoneDisplay(): string {
  const d = getShopWhatsAppDigits();
  if (d.length === 12 && d.startsWith('91')) {
    const num = d.slice(2);
    return `+91 ${num.slice(0, 5)} ${num.slice(5)}`;
  }
  if (d.length === 10) return `+91 ${d.slice(0, 5)} ${d.slice(5)}`;
  return `+${d}`;
}

export function shopWhatsAppChatUrl(prefill?: string): string {
  const phone = getShopWhatsAppDigits();
  if (!prefill) return `https://wa.me/${phone}`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(prefill)}`;
}

/** Pre-filled WhatsApp URL for instant size & fabric inquiries */
export function sizeInquiryWhatsAppUrl(productTitle: string, size?: string): string {
  const sizeText = size ? ` for Size ${size}` : '';
  const text = `Hi VR Men's Wear, I have a query about "${productTitle}"${sizeText}. Could you assist with size and fabric details? Thanks!`;
  return shopWhatsAppChatUrl(text);
}

// Backward compatibility alias
export function samplePdfWhatsAppUrl(productTitle: string, standard?: string): string {
  return sizeInquiryWhatsAppUrl(productTitle, standard);
}
