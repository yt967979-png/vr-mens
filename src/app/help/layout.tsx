import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Help Center & Live Chat Support — VR Men's Wear",
  description:
    'Get instant help with order tracking, size exchange, fabric details, and styling inquiries. Chat with our AI stylist or connect with store support in Chennai.',
  openGraph: {
    title: "Help Center & Live Chat — VR Men's Wear",
    description: 'Instant AI support and live chat for order tracking, sizes, and apparel styling inquiries.',
  },
};

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
