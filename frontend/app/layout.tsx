import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { Tajawal } from 'next/font/google';
import '@/app/globals.css';
import { AppProvider } from '@/app/store';
import { I18nProvider } from '@/i18n';
import { LANG_COOKIE_NAME, resolveLang } from '@/i18n/server';

// Arabic UI font (the Latin display/sans fonts have no Arabic glyphs)
const arabicFont = Tajawal({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '700', '800'],
  variable: '--font-arabic',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Coworking Pass - Saudi Arabia\'s Coworking Platform',
  description: 'Access premium coworking spaces in Riyadh, Jeddah, Dammam, and beyond. Book by the day, month, or year.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The language preference is mirrored in a cookie so the server renders the right lang/dir (no flash)
  const stored = (await cookies()).get(LANG_COOKIE_NAME)?.value;
  const lang = resolveLang(stored);

  return (
    <html lang={lang} dir={lang === 'ar' ? 'rtl' : 'ltr'} className={`h-full ${arabicFont.variable}`} suppressHydrationWarning>
      <body className="h-full bg-plaster text-soot antialiased">
        <I18nProvider initialLang={lang}>
          <AppProvider>
            {children}
          </AppProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
