import React, { useCallback, useRef } from 'react';
import { ThumbnailFilmstripContainer, FilmstripTrack, ThumbnailImage, ThumbnailTime } from './ThumbnailFilmstrip.styles';
import { useThumbnails } from '../../hooks/useThumbnails';

interface ThumbnailData {
  time: number;
  url: string;
}

interface ThumbnailFilmstripProps {
  representationId: string;
  totalDuration: number;
  interval?: number; // seconds between thumbnails, default 5
  onThumbnailClick?: (time: number) => void;
}

const ThumbnailFilmstrip: React.FC<ThumbnailFilmstripProps> = ({
  representationId,
  totalDuration,
  interval = 5,
  onThumbnailClick,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const times = Array.from(
    { length: Math.floor(totalDuration / interval) },
    (_, i) => i * interval
  );

  const { thumbnails, loading, error } = useThumbnails(representationId, times);

  const handleScroll = useCallback(() => {
    // You can add scroll-based lazy loading logic here if needed
  }, []);

  const handleThumbnailClick = useCallback(
    (time: number) => {
      onThumbnailClick?.(time);
    },
    [onThumbnailClick]
  );

  if (loading) {
    return <ThumbnailFilmstripContainer>Loading thumbnails...</ThumbnailFilmstripContainer>;
  }

  if (error) {
    return <ThumbnailFilmstripContainer>Error loading thumbnails: {error.message}</ThumbnailFilmstripContainer>;
  }

  return (
    <ThumbnailFilmstripContainer>
      <FilmstripTrack ref={trackRef} onScroll={handleScroll}>
        {thumbnails.map((thumb) => (
          <div key={thumb.time} onClick={() => handleThumbnailClick(thumb.time)}>
            <ThumbnailImage
              src={thumb.url}
              alt={`Thumbnail at ${thumb.time}s`}
            />
            <ThumbnailTime>{thumb.time}s</ThumbnailTime>
          </div>
        ))}
      </FilmstripTrack>
    </ThumbnailFilmstripContainer>
  );
};

export default ThumbnailFilmstrip;
