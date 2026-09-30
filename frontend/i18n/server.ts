// Server-safe i18n helpers (the main i18n module is a client module, so its non-component exports are unusable in server components)
import en from './en.json';
import ar from './ar.json';
import type { Lang, TranslationKey } from './index';

export const DEFAULT_LANG_SERVER: Lang = 'ar';
export const LANG_COOKIE_NAME = 'cp_lang';

const dictionaries = { en, ar } as Record<Lang, unknown>;

/** Resolves the language from the raw cookie value. */
export function resolveLang(cookieValue?: string | null): Lang {
  return cookieValue === 'en' || cookieValue === 'ar' ? cookieValue : DEFAULT_LANG_SERVER;
}

/** Translate a dictionary key on the server, falling back to English. */
export function translateServer(lang: Lang, key: TranslationKey): string {
  const find = (dict: unknown) => {
    let node = dict;
    for (const part of key.split('.')) {
      if (node && typeof node === 'object' && part in (node as Record<string, unknown>)) node = (node as Record<string, unknown>)[part];
      else return undefined;
    }
    return typeof node === 'string' ? node : undefined;
  };
  return find(dictionaries[lang]) ?? find(dictionaries.en) ?? key;
}
