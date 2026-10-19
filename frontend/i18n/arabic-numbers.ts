/**
 * Arabic number–noun agreement for counted units in finished Arabic text.
 * Translations are written as "{count} ساعات" or "{count} مقعد"; this picks the grammatical form for the actual number:
 * 1 → "ساعة واحدة", 2 → "ساعتان", 3–10 → plural ("5 ساعات"), 11 and above → singular ("12 ساعة", "15 مقعدًا").
 * Text that already uses the right form is left unchanged, so applying it twice is harmless.
 */
type Unit = {
  /** Every written form the unit may appear in after a number */
  forms: string[];
  one: string;
  two: string;
  /** 3–10 */
  few: string;
  /** 11 and above */
  many: string;
};

const UNITS: Unit[] = [
  { forms: ['ساعات', 'ساعة'], one: 'ساعة واحدة', two: 'ساعتان', few: 'ساعات', many: 'ساعة' },
  { forms: ['أيام', 'يوم'], one: 'يوم واحد', two: 'يومان', few: 'أيام', many: 'يومًا' },
  { forms: ['أشهر', 'شهور', 'شهر'], one: 'شهر واحد', two: 'شهران', few: 'أشهر', many: 'شهرًا' },
  { forms: ['مقاعد', 'مقعد'], one: 'مقعد واحد', two: 'مقعدان', few: 'مقاعد', many: 'مقعدًا' },
  { forms: ['نقاط', 'نقطة'], one: 'نقطة واحدة', two: 'نقطتان', few: 'نقاط', many: 'نقطة' },
  { forms: ['زيارات', 'زيارة'], one: 'زيارة واحدة', two: 'زيارتان', few: 'زيارات', many: 'زيارة' },
];

// A standalone whole number (not part of a decimal, date or larger figure), a space, then the unit as a whole word
const ARABIC_LETTER = '\\u0600-\\u06FF';
const patterns = UNITS.map((unit) => ({
  unit,
  regex: new RegExp(`(?<![\\d.,:/\\-])(\\d+) (${unit.forms.join('|')})(?![${ARABIC_LETTER}])`, 'g'),
}));

export function applyArabicNumberAgreement(text: string): string {
  if (!text || !/\d/.test(text)) return text;
  let out = text;
  for (const { unit, regex } of patterns) {
    out = out.replace(regex, (_match, digits: string) => {
      const n = Number(digits);
      if (n === 1) return unit.one;
      if (n === 2) return unit.two;
      // Hundreds and thousands with a zero remainder take the singular, like 11+
      return `${digits} ${n >= 3 && n <= 10 ? unit.few : unit.many}`;
    });
  }
  return out;
}
