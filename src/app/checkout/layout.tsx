import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Secure Checkout | VR Men's Wear",
  description: 'Complete your order securely via Razorpay UPI and cards.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
