import type { Metadata } from 'next';
import { Saira } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';

const saira = Saira({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Geowise',
  description: '',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="overflow-hidden">
      <body className={saira.className}>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}