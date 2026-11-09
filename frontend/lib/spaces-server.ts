import { INITIAL_SPACES } from '@/data/demo-data';
import { apiBase, fetchWithRetry } from '@/lib/api-config';
import { Space, getSpaceCategory, getWorkspaceCategory } from '@/types';

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
    // 9 s per attempt and one retry: enough for a cold serverless start without holding the page for too long
    const res = await fetchWithRetry(`${apiBase()}/workspaces`, {
      timeoutMs: 9000,
      retries: 1,
      next: { revalidate: 60 },
      headers: { Accept: 'application/json' },
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        // The live catalogue only: static demo spaces are a fallback for when the API is unreachable, never mixed in
        // (they are not bookable). API rows carry no category, so derive it from their sections.
        spaces = data.map((w: any) => ({ ...w, category: getWorkspaceCategory(w) }));
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
