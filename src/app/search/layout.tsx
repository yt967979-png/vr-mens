import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vrmenswear.in';

export const metadata: Metadata = {
  title: "Search Men's Fashion Catalog | VR Men's Wear",
  description:
    "Explore premium shirts, t-shirts, denim jeans, tailored trousers, ethnic kurtas, and 3-in-1 combo packs at VR Men's Wear.",
  alternates: {
    canonical: `${siteUrl}/search`,
  },
  openGraph: {
    title: "Search Men's Fashion Catalog | VR Men's Wear",
    description:
      "Explore premium shirts, t-shirts, denim jeans, tailored trousers, ethnic kurtas, and 3-in-1 combo packs at VR Men's Wear.",
    url: `${siteUrl}/search`,
    siteName: "VR Men's Wear",
    type: 'website',
  },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
