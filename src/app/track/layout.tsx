import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Track Order | VR Men's Wear",
  description: "Track your VR Men's Wear clothing shipment live via ST Courier Express.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function TrackLayout({ children }: { children: React.ReactNode }) {
  return children;
}
