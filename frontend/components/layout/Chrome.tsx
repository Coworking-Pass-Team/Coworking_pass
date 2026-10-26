'use client';

import { createContext, useContext } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

/** True while a screen is drawn inside the app shell, which already shows the header and footer. */
export const ChromeContext = createContext(false);

/**
 * Pages that Next serves as their own route (/spaces, /spaces/[id]) are also rendered inside the app shell.
 * Inside the shell they render as they are; on their own they get the header and footer here.
 */
export function WithChrome({ children }: { children: React.ReactNode }) {
  const insideShell = useContext(ChromeContext);
  if (insideShell) return <>{children}</>;
  return (
    <ChromeContext.Provider value={true}>
      <div className="min-h-screen flex flex-col bg-plaster">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </ChromeContext.Provider>
  );
}
