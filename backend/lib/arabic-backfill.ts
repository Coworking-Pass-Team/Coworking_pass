import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ALL_STANDARD_SPACES, CITY_AR, standardDescriptions, type StandardSpaceSeed } from "@/lib/seed-data";

/** Arabic for the room suffixes the standard seed gives each venue ("<venue> - Hall"). */
const SECTION_SUFFIX_AR: Record<string, string> = {
  Auditorium: "المسرح",
  Hall: "القاعة",
  "Open Desks Area": "منطقة المكاتب المفتوحة",
  "Meeting Room": "غرفة الاجتماعات",
};

/** Halls from the original static catalogue that also exist in deployed databases but are not in the standard seed. */
const EXTRA_VENUES: Array<Pick<StandardSpaceSeed, 'name' | 'nameAr' | 'city' | 'category' | 'type'>> = [
  { name: 'Al Khobar Multi-Purpose Event Hall', nameAr: 'قاعة الفعاليات متعددة الأغراض بالخبر', city: 'Al Khobar', category: 'hall', type: 'event-hall' },
  { name: 'Diriyah Heritage Business Event Hall', nameAr: 'قاعة الدرعية التراثية لفعاليات الأعمال', city: 'Riyadh', category: 'hall', type: 'event-hall' },
  { name: 'King Abdulaziz Academic Lecture Hall', nameAr: 'قاعة الملك عبدالعزيز للمحاضرات الأكاديمية', city: 'Jeddah', category: 'hall', type: 'lecture-hall' },
];

/**
 * Fills the Arabic name, description and city of the standard (seeded) venues and the Arabic names of their rooms.
 * Only empty fields are filled, so anything a partner or admin typed is never overwritten; safe to run repeatedly.
 */
export async function backfillStandardArabic(): Promise<{ workspaces: number; sections: number }> {
  const venueRows = [...ALL_STANDARD_SPACES, ...EXTRA_VENUES].map((s) => {
    const { description, descriptionAr } = standardDescriptions(s);
    return Prisma.sql`(${s.name}, ${s.nameAr ?? null}, ${description}, ${descriptionAr}, ${CITY_AR[s.city] ?? null})`;
  });
  const workspaces = await prisma.$executeRaw`
    UPDATE "Workspace" AS w SET
      "nameAr" = COALESCE(NULLIF(w."nameAr", ''), v.name_ar),
      "description" = COALESCE(NULLIF(w."description", ''), v.description),
      "descriptionAr" = COALESCE(NULLIF(w."descriptionAr", ''), v.description_ar),
      "cityAr" = COALESCE(NULLIF(w."cityAr", ''), v.city_ar)
    FROM (VALUES ${Prisma.join(venueRows)}) AS v(name, name_ar, description, description_ar, city_ar)
    WHERE lower(w."name") = lower(v.name)
      AND (NULLIF(w."nameAr", '') IS NULL OR NULLIF(w."description", '') IS NULL
        OR NULLIF(w."descriptionAr", '') IS NULL OR NULLIF(w."cityAr", '') IS NULL)`;

  const sectionRows = [...ALL_STANDARD_SPACES, ...EXTRA_VENUES].filter((s) => s.nameAr).flatMap((s) =>
    Object.entries(SECTION_SUFFIX_AR).map(([suffix, suffixAr]) => Prisma.sql`(${`${s.name} - ${suffix}`}, ${`${s.nameAr} - ${suffixAr}`})`)
  );
  const sections = await prisma.$executeRaw`
    UPDATE "WorkspaceSection" AS sec SET "nameAr" = v.name_ar
    FROM (VALUES ${Prisma.join(sectionRows)}) AS v(name, name_ar)
    WHERE NULLIF(sec."nameAr", '') IS NULL AND lower(sec."name") = lower(v.name)`;

  return { workspaces, sections };
}
