import { INITIAL_SPACES } from '@/data/data';
import { Space, getSpaceCategory } from '@/types/types';

export interface SpacesServerData {
  spaces: Space[];
  visibleSpaces: Space[];
  featuredSpaces: Space[];
  categoryCounts: {
    office: number;
    hall: number;
    theater: number;
  };
}

export async function getSpacesServer(): Promise<SpacesServerData> {
  let spaces: Space[] = INITIAL_SPACES;

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'https://coworking-pass-k49w.onrender.com/api';
    const baseUrl = apiUrl.replace(/\/$/, '');
    const fullUrl = baseUrl.endsWith('/api') ? `${baseUrl}/workspaces` : `${baseUrl}/api/workspaces`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(fullUrl, {
      signal: controller.signal,
      next: { revalidate: 60 },
      headers: { Accept: 'application/json' },
    });

    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        // Merge API spaces with INITIAL_SPACES if any static ones are missing
        const seen = new Set(data.map((w: any) => (w.name || '').trim().toLowerCase()));
        const missingStatic = INITIAL_SPACES.filter(s => !seen.has(s.name.trim().toLowerCase()));
        spaces = [...data, ...missingStatic];
      }
    }
  } catch (_err) {
    // If external fetch fails or times out, safely fall back to INITIAL_SPACES
    spaces = INITIAL_SPACES;
  }

  const visibleSpaces = spaces.filter(s => s.isVisible !== false);
  const officeCount = visibleSpaces.filter(s => getSpaceCategory(s) === 'office').length;
  const hallCount = visibleSpaces.filter(s => getSpaceCategory(s) === 'hall').length;
  const theaterCount = visibleSpaces.filter(s => getSpaceCategory(s) === 'theater').length;
  const featuredSpaces = visibleSpaces.filter(s => s.isFeatured).slice(0, 3);

  // If no spaces are marked featured, fall back to the first 3 visible spaces
  const finalFeatured = featuredSpaces.length > 0 ? featuredSpaces : visibleSpaces.slice(0, 3);

  return {
    spaces,
    visibleSpaces,
    featuredSpaces: finalFeatured,
    categoryCounts: {
      office: officeCount,
      hall: hallCount,
      theater: theaterCount,
    },
  };
}
