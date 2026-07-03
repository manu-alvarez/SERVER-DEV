
export function getApiBase(): string {
  if (typeof window !== "undefined") {
    // Autodetectar servidor de desarrollo local de Next.js (puerto 3000)
    // y redirigir las peticiones directamente al backend FastAPI (puerto 8007)
    if (window.location.port === "3000") {
      return `http://${window.location.hostname}:8007`;
    }
  }
  return process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== "undefined" ? `http://${window.location.hostname}:8007` : "http://localhost:8007");
}

export interface StoryListItem {
  id: string;
  title: string;
  child_name: string;
  status: string;
  chapter_count: number;
  created_at: string;
}

export interface StoryListResponse {
  stories: StoryListItem[];
  total: number;
  page: number;
  page_size: number;
}

export async function listStories(
  page = 1,
  pageSize = 50
): Promise<StoryListResponse | null> {
  const apiBase = getApiBase();
  try {
    const res = await fetch(
      `${apiBase}/api/stories/?page=${page}&page_size=${pageSize}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function fetchStory(storyId: string) {
  const apiBase = getApiBase();

  const res = await fetch(`${apiBase}/api/stories/${storyId}`, {
    cache: "no-store",
  });

  if (!res.ok) return null;
  return res.json();
}

export async function fetchStoryProgress(storyId: string) {
  const apiBase = getApiBase();

  const res = await fetch(`${apiBase}/api/stories/${storyId}/progress`, {
    cache: "no-store",
  });

  if (!res.ok) return null;
  return res.json();
}

export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${getApiBase()}${url}`;
}
