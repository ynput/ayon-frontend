import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useFilmstrip } from '../../hooks/useFilmstrip';
import './Filmstrip.css';

interface FilmstripProps {
  /** URL or ID of the video asset */
  source: string;
  /** Total duration of the video in seconds */
  duration: number;
  /** Number of thumbnails to display */
  thumbnailCount?: number;
  /** Width of each thumbnail in pixels */
  thumbnailWidth?: number;
  /** Height of each thumbnail in pixels */
  thumbnailHeight?: number;
  /** Current playback time in seconds (controlled) */
  currentTime?: number;
  /** Callback when user clicks on a frame */
  onSeek?: (time: number) => void;
}

const Filmstrip: React.FC<FilmstripProps> = ({
  source,
  duration,
  thumbnailCount = 50,
  thumbnailWidth = 120,
  thumbnailHeight = 68,
  currentTime = 0,
  onSeek,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const { thumbnails, loading, error } = useFilmstrip(source, thumbnailCount);

  const interval = duration / thumbnailCount;

  const handleThumbnailClick = useCallback(
    (index: number) => {
      const time = index * interval;
      if (onSeek) onSeek(time);
    },
    [interval, onSeek]
  );

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollLeft(containerRef.current.scrollLeft);
    }
  }, []);

  // Scroll to keep playhead visible
  useEffect(() => {
    if (!containerRef.current) return;
    const playheadIndex = Math.round(currentTime / interval);
    const playheadLeft = playheadIndex * (thumbnailWidth + 4); // 4px gap
    const containerWidth = containerRef.current.clientWidth;
    const scrollLeft = containerRef.current.scrollLeft;
    const playheadRight = playheadLeft + thumbnailWidth;

    if (playheadLeft < scrollLeft || playheadRight > scrollLeft + containerWidth) {
      containerRef.current.scrollTo({
        left: playheadLeft - containerWidth / 2 + thumbnailWidth / 2,
        behavior: 'smooth',
      });
    }
  }, [currentTime, interval, thumbnailWidth]);

  if (loading) {
    return <div className="filmstrip-loading">Loading thumbnails...</div>;
  }

  if (error) {
    return <div className="filmstrip-error">Error: {error.message}</div>;
  }

  return (
    <div
      className="filmstrip-container"
      ref={containerRef}
      onScroll={handleScroll}
    >
      <div className="filmstrip-track" style={{ width: thumbnails.length * (thumbnailWidth + 4) }}>
        {thumbnails.map((url, index) => (
          <div
            key={index}
            className="filmstrip-thumbnail"
            style={{
              width: thumbnailWidth,
              height: thumbnailHeight,
              backgroundImage: `url(${url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
            onClick={() => handleThumbnailClick(index)}
            title={`Frame at ${(index * interval).toFixed(1)}s`}
          />
        ))}
        <div
          className="filmstrip-playhead"
          style={{
            left: (currentTime / interval) * (thumbnailWidth + 4),
          }}
        />
      </div>
    </div>
  );
};

export default Filmstrip;
