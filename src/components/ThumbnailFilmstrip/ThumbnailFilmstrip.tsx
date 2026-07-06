import React, { useState, useRef, useCallback, useEffect } from 'react';
import './ThumbnailFilmstrip.css';

interface Thumbnail {
  id: string;
  src: string;
  alt?: string;
}

interface ThumbnailFilmstripProps {
  thumbnails: Thumbnail[];
  onSelect?: (id: string) => void;
  selectedId?: string;
  visibleCount?: number;
}

const ThumbnailFilmstrip: React.FC<ThumbnailFilmstripProps> = ({
  thumbnails,
  onSelect,
  selectedId,
  visibleCount = 5
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const maxIndex = Math.max(0, thumbnails.length - visibleCount);

  useEffect(() => {
    if (currentIndex > maxIndex) {
      setCurrentIndex(maxIndex);
    }
  }, [thumbnails.length, visibleCount, currentIndex, maxIndex]);

  const scrollLeft = useCallback(() => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
  }, []);

  const scrollRight = useCallback(() => {
    setCurrentIndex(prev => Math.min(maxIndex, prev + 1));
  }, [maxIndex]);

  const visibleThumbnails = thumbnails.slice(currentIndex, currentIndex + visibleCount);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      scrollLeft();
    } else if (e.key === 'ArrowRight') {
      scrollRight();
    }
  }, [scrollLeft, scrollRight]);

  return (
    <div
      className="thumbnail-filmstrip"
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="listbox"
      aria-label="Thumbnail filmstrip"
    >
      <button
        className="filmstrip-arrow filmstrip-arrow-left"
        onClick={scrollLeft}
        disabled={currentIndex === 0}
        aria-label="Scroll left"
      >
        ◀
      </button>
      <div className="filmstrip-viewport">
        <div className="filmstrip-track" style={{ transform: `translateX(-${currentIndex * 110}px)` }}>
          {thumbnails.map((thumb) => (
            <div
              key={thumb.id}
              className={`filmstrip-thumbnail ${thumb.id === selectedId ? 'selected' : ''}`}
              onClick={() => onSelect?.(thumb.id)}
              role="option"
              aria-selected={thumb.id === selectedId}
              tabIndex={-1}
            >
              <img src={thumb.src} alt={thumb.alt || thumb.id} />
            </div>
          ))}
        </div>
      </div>
      <button
        className="filmstrip-arrow filmstrip-arrow-right"
        onClick={scrollRight}
        disabled={currentIndex >= maxIndex}
        aria-label="Scroll right"
      >
        ▶
      </button>
    </div>
  );
};

export default ThumbnailFilmstrip;
