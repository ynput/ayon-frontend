import { useState, useEffect } from 'react';

interface ThumbnailData {
  time: number;
  url: string;
}

interface UseThumbnailsResult {
  thumbnails: ThumbnailData[];
  loading: boolean;
  error: Error | null;
}

// Mock API endpoint - replace with actual API call
export function useThumbnails(
  representationId: string,
  times: number[]
): UseThumbnailsResult {
  const [thumbnails, setThumbnails] = useState<ThumbnailData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!representationId || times.length === 0) {
      setThumbnails([]);
      return;
    }

    let cancelled = false;
    const fetchThumbnails = async () => {
      setLoading(true);
      setError(null);

      try {
        // TODO: Replace with actual API call
        // const params = new URLSearchParams({ times: times.join(',') });
        // const response = await fetch(`/api/representations/${representationId}/thumbnails?${params}`);
        // if (!response.ok) throw new Error('Failed to fetch thumbnails');
        // const data: ThumbnailData[] = await response.json();

        // Simulating API response with placeholder URLs
        await new Promise((resolve) => setTimeout(resolve, 500));
        const data: ThumbnailData[] = times.map((time) => ({
          time,
          url: `https://via.placeholder.com/120x80/333/fff?text=${time}s`,
        }));

        if (!cancelled) {
          setThumbnails(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchThumbnails();

    return () => {
      cancelled = true;
    };
  }, [representationId, times]);

  return { thumbnails, loading, error };
}
