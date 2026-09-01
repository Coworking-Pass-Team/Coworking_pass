import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from './store';

export const metadata: Metadata = {
  title: 'Coworking Pass - Saudi Arabia\'s Coworking Platform',
  description: 'Access premium coworking spaces in Riyadh, Jeddah, Dammam, and beyond. Book by the day, month, or year.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-plaster text-soot antialiased">
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}