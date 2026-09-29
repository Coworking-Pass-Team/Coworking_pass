'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import en from './en.json';
import ar from './ar.json';
import { translateMessageToArabic } from './messages';

export type Lang = 'ar' | 'en';
export const DEFAULT_LANG: Lang = 'ar';
export const LANG_STORAGE_KEY = 'cp_lang';
export const LANG_COOKIE = 'cp_lang';

/** Nested string dictionary shape; both languages must expose exactly the same keys. */
type Shape<T> = { [K in keyof T]: T[K] extends string ? string : Shape<T[K]> };
type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>;
}[keyof T & string];

/** All valid translation keys, derived from the English dictionary (so typos fail at compile time). */
export type TranslationKey = Leaves<typeof en>;

// Compile-time guard: a key missing (or extra) in either file is a type error
const arDictionary: Shape<typeof en> = ar;
const enDictionaryCheck: Shape<typeof ar> = en;
void enDictionaryCheck;

const dictionaries: Record<Lang, Shape<typeof en>> = { en, ar: arDictionary };

function lookup(dict: Shape<typeof en>, key: string): string | undefined {
  let node: unknown = dict;
  for (const part of key.split('.')) {
    if (node && typeof node === 'object' && part in (node as Record<string, unknown>)) {
      node = (node as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return typeof node === 'string' ? node : undefined;
}

export type TranslateVars = Record<string, string | number>;

function interpolate(text: string, vars?: TranslateVars): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match));
}

/** Pure translate function (usable outside React, e.g. in tests). */
export function translate(lang: Lang, key: TranslationKey, vars?: TranslateVars): string {
  const text = lookup(dictionaries[lang], key) ?? lookup(dictionaries.en, key) ?? key;
  return interpolate(text, vars);
}

/**
 * Bilingual content authored by providers/admins: returns the Arabic value in Arabic mode when one was
 * provided, otherwise gracefully falls back to the English value.
 */
export function pickLocalized(lang: Lang, english?: string | null, arabic?: string | null): string {
  if (lang === 'ar' && arabic && arabic.trim()) return arabic;
  return english ?? '';
}

interface I18nContextValue {
  lang: Lang;
  dir: 'rtl' | 'ltr';
  isRTL: boolean;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  t: (key: TranslationKey, vars?: TranslateVars) => string;
  /** Localized field of a bilingual record, e.g. localized(space.name, space.nameAr). */
  localized: (english?: string | null, arabic?: string | null) => string;
  /** Translates fixed system messages (toasts, API errors) that are produced as English sentences. */
  translateMessage: (message: string) => string;
  /** Formats a date for the active language (Gregorian calendar, Latin digits in both languages). */
  formatDate: (value: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  /** Localizes clock text such as "08:00 AM - 10:00 PM" (AM/PM become ص/م in Arabic). */
  localizeTime: (text?: string | null) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function applyDocumentLanguage(lang: Lang) {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
}

export function I18nProvider({ children, initialLang }: { children: React.ReactNode; initialLang?: Lang }) {
  const [lang, setLangState] = useState<Lang>(initialLang ?? DEFAULT_LANG);

  // Reconcile with the stored preference (localStorage is the source of truth on the client)
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(LANG_STORAGE_KEY);
      if (stored === 'ar' || stored === 'en') {
        if (stored !== lang) setLangState(stored);
        document.cookie = `${LANG_COOKIE}=${stored}; path=/; max-age=31536000; samesite=lax`;
      } else {
        window.localStorage.setItem(LANG_STORAGE_KEY, lang);
        document.cookie = `${LANG_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`;
      }
    } catch (_) {
      // Storage unavailable (private mode): keep the server-provided language
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    applyDocumentLanguage(lang);
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, next);
    } catch (_) { /* ignore */ }
    // The cookie lets the server render the correct <html lang dir> on the next request (no flash)
    document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    applyDocumentLanguage(next);
  }, []);

  const value = useMemo<I18nContextValue>(() => ({
    lang,
    dir: lang === 'ar' ? 'rtl' : 'ltr',
    isRTL: lang === 'ar',
    setLang,
    toggleLang: () => setLang(lang === 'ar' ? 'en' : 'ar'),
    t: (key, vars) => translate(lang, key, vars),
    localized: (english, arabic) => pickLocalized(lang, english, arabic),
    translateMessage: (message) => (lang === 'ar' ? translateMessageToArabic(message).replace(/\bAM\b/g, 'ص').replace(/\bPM\b/g, 'م') : message),
    formatDate: (value, options = { month: 'short', day: 'numeric', year: 'numeric' }) => {
      const date = value instanceof Date ? value : new Date(value);
      if (isNaN(date.getTime())) return String(value ?? '');
      return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-US', options).format(date);
    },
    localizeTime: (text) => {
      const value = text ?? '';
      return lang === 'ar' ? value.replace(/\bAM\b/g, 'ص').replace(/\bPM\b/g, 'م') : value;
    },
  }), [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

/** Renders a translated string. Usable from server components because the translation happens in this client component. */
export function T({ k, vars }: { k: TranslationKey; vars?: TranslateVars }) {
  const { t } = useI18n();
  return <>{t(k, vars)}</>;
}
