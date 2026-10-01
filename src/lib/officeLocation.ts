/** Official store / dispatch location — shared across contact, footer, maps */

export const OFFICE_COMPANY_NAME = "VR MEN'S WEAR";

export const OFFICE_ADDRESS_LINES = [
  OFFICE_COMPANY_NAME,
  '2nd Avenue, Commercial Hub, Anna Nagar, Chennai, Tamil Nadu — 600040',
] as const;

export const OFFICE_ADDRESS_TEXT = OFFICE_ADDRESS_LINES.join('\n');

/** Google Maps place query */
export const OFFICE_PLACE_NAME = "VR Men's Wear, Anna Nagar, Chennai";
export const OFFICE_PLUS_CODE = '36XR+9Q Chennai, Tamil Nadu';

const placeQuery = encodeURIComponent("VR Men's Wear, 2nd Avenue, Anna Nagar, Chennai, Tamil Nadu 600040");

export const OFFICE_MAPS_SEARCH_URL = `https://www.google.com/maps/search/?api=1&query=${placeQuery}`;

export const OFFICE_MAPS_EMBED_URL = `https://maps.google.com/maps?q=${placeQuery}&z=18&ie=UTF8&iwloc=&output=embed`;
