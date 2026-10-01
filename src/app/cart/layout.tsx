import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Shopping Cart | VR Men's Wear",
  description: 'View your selected menswear items and proceed to secure checkout.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
