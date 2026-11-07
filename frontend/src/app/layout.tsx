import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CGS Attendance | Teacher Portal',
  description: 'Digital school attendance tracking system for CGS',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#F4F2F7] min-h-screen text-gray-900 selection:bg-purple-200">
        {children}
      </body>
    </html>
  );
}

