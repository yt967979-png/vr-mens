import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "My Profile | VR Men's Wear",
  description: 'Manage your delivery address and account details.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
