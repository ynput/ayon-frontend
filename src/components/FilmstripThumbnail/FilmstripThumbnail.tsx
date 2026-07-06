import React, { useRef, useEffect } from 'react';
import './FilmstripThumbnail.css';

interface FilmstripThumbnailProps {
  thumbs: string[];
  currentIndex: number;
  onSelect: (index: number) => void;
  fps?: number;
  time?: number;
  width?: number;
  height?: number;
}

const FilmstripThumbnail: React.FC<FilmstripThumbnailProps> = ({
  thumbs,
  currentIndex,
  onSelect,
  fps = 24,
  time,
  width = 120,
  height = 80,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      const selected = containerRef.current.children[currentIndex] as HTMLElement;
      if (selected) {
        selected.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentIndex]);

  const formatTime = (index: number): string => {
    const totalSeconds = index / fps;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const frames = index % fps;
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${frames.toString().padStart(2, '0')}`;
  };

  return (
    <div className="filmstrip-container" ref={containerRef}>
      {thumbs.map((thumb, index) => (
        <div
          key={index}
          className={`filmstrip-thumb ${index === currentIndex ? 'selected' : ''}`}
          onClick={() => onSelect(index)}
          style={{ width, height }}
          title={`Frame ${index} - ${formatTime(index)}`}
        >
          <img src={thumb} alt={`Frame ${index}`} width={width} height={height} />
          {index === currentIndex && <div className="playhead" />}
        </div>
      ))}
    </div>
  );
};

export default FilmstripThumbnail;
