'use client';

import '@/app/globals.css';
import { AppProvider } from '@/app/store';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-plaster">
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}