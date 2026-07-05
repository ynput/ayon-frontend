import { useState, useRef, useCallback, useEffect } from 'react';

interface UseThumbnailFilmstripOptions {
  totalItems: number;
  visibleCount: number;
  currentIndex: number;
  hasMore: boolean;
  onLoadMore?: () => void;
}

interface UseThumbnailFilmstripReturn {
  scrollRef: React.RefObject<HTMLDivElement>;
  startIndex: number;
  handlePrev: () => void;
  handleNext: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
}

export const useThumbnailFilmstrip = ({
  totalItems,
  visibleCount,
  currentIndex,
  hasMore,
  onLoadMore,
}: UseThumbnailFilmstripOptions): UseThumbnailFilmstripReturn => {
  const [startIndex, setStartIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Ensure startIndex stays within valid range and center on currentIndex
  useEffect(() => {
    const half = Math.floor(visibleCount / 2);
    let newStart = currentIndex - half;
    newStart = Math.max(0, Math.min(newStart, totalItems - visibleCount));
    // If newStart forces startIndex to exceed if near end
    if (newStart < 0) newStart = 0;
    if (newStart > totalItems - visibleCount) newStart = totalItems - visibleCount;
    setStartIndex(newStart);
  }, [currentIndex, totalItems, visibleCount]);

  const canScrollPrev = startIndex > 0;
  const canScrollNext = startIndex + visibleCount < totalItems || hasMore;

  const handlePrev = useCallback(() => {
    setStartIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNext = useCallback(() => {
    const nextStart = startIndex + 1;
    // If we are at the end and there are more items to load
    if (nextStart + visibleCount > totalItems && hasMore && onLoadMore) {
      onLoadMore();
    }
    const maxStart = Math.max(0, totalItems - visibleCount);
    setStartIndex(Math.min(maxStart, nextStart));
  }, [startIndex, totalItems, visibleCount, hasMore, onLoadMore]);

  return {
    scrollRef,
    startIndex,
    handlePrev,
    handleNext,
    canScrollPrev,
    canScrollNext,
  };
};
