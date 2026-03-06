import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Gun.js CRUD Demo',
  description: 'Real-time, cross-browser notes app built with Next.js and Gun.js — create, read, update, and delete notes that sync instantly across browsers.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
