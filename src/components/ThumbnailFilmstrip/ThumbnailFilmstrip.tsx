import React, { useCallback, useRef, useMemo } from 'react';

interface Thumbnail {
  url: string;
  index: number;
  tooltip?: string;
}

interface ThumbnailFilmstripProps {
  thumbnails: Thumbnail[];
  currentIndex: number;
  onSelect: (index: number) => void;
  width?: number;
  height?: number;
  className?: string;
}

const ThumbnailFilmstrip: React.FC<ThumbnailFilmstripProps> = ({
  thumbnails,
  currentIndex,
  onSelect,
  width = 120,
  height = 68,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll to current index on mount/change
  useMemo(() => {
    const container = containerRef.current;
    if (!container) return;
    const thumbnailEl = container.querySelector(`[data-index="${currentIndex}"]`) as HTMLElement;
    if (thumbnailEl) {
      thumbnailEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [currentIndex, thumbnails]);

  const handleClick = useCallback(
    (index: number) => {
      onSelect(index);
    },
    [onSelect]
  );

  return (
    <div
      ref={containerRef}
      className={`thumbnail-filmstrip ${className || ''}`}
      style={{
        display: 'flex',
        overflowX: 'auto',
        overflowY: 'hidden',
        gap: '4px',
        padding: '4px 0',
        background: '#1a1a1a',
        borderRadius: '4px',
        whiteSpace: 'nowrap',
      }}
    >
      {thumbnails.map((thumb) => (
        <div
          key={thumb.index}
          data-index={thumb.index}
          onClick={() => handleClick(thumb.index)}
          title={thumb.tooltip ?? `Frame ${thumb.index}`}
          style={{
            flex: '0 0 auto',
            width: `${width}px`,
            height: `${height}px`,
            border: thumb.index === currentIndex ? '2px solid #4CAF50' : '2px solid transparent',
            borderRadius: '2px',
            cursor: 'pointer',
            transition: 'border 0.2s',
            overflow: 'hidden',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = '#888';
          }}
          onMouseLeave={(e) => {
            if (thumb.index !== currentIndex) {
              (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
            }
          }}
        >
          <img
            src={thumb.url}
            alt={`Thumbnail ${thumb.index}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
            loading="lazy"
            onError={(e) => {
              // Fallback placeholder
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.style.background = '#333';
                parent.style.display = 'flex';
                parent.style.alignItems = 'center';
                parent.style.justifyContent = 'center';
                parent.style.color = '#666';
                parent.style.fontSize = '10px';
                parent.textContent = 'N/A';
              }
            }}
          />
        </div>
      ))}
    </div>
  );
};

export default ThumbnailFilmstrip;
