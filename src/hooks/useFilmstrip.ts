import { useState, useEffect } from 'react';

interface UseFilmstripResult {
  thumbnails: string[];
  loading: boolean;
  error: Error | null;
}

/**
 * Custom hook to fetch thumbnail URLs for a video asset.
 * Assumes backend provides an endpoint /api/thumbnails/:source?count=N
 * that returns an array of thumbnail URLs.
 */
export function useFilmstrip(
  source: string,
  count: number
): UseFilmstripResult {
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchThumbnails = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/thumbnails/${encodeURIComponent(source)}?count=${count}`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch thumbnails: ${response.statusText}`);
        }

        const data: string[] = await response.json();

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

    if (source) {
      fetchThumbnails();
    } else {
      setThumbnails([]);
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [source, count]);

  return { thumbnails, loading, error };
}
