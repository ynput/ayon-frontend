import React, { useState, useRef, useCallback, useEffect } from 'react';
import './Filmstrip.css';

export const Filmstrip = ({ thumbnails = [], onSelect, selectedIndex }) => {
  const [currentIndex, setCurrentIndex] = useState(selectedIndex || 0);
  const scrollRef = useRef(null);
  const thumbnailRefs = useRef([]);

  const handleThumbnailClick = useCallback((index) => {
    setCurrentIndex(index);
    onSelect && onSelect(index);
  }, [onSelect]);

  const scrollToIndex = useCallback((index) => {
    if (scrollRef.current && thumbnailRefs.current[index]) {
      thumbnailRefs.current[index].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, []);

  useEffect(() => {
    if (selectedIndex !== undefined) {
      setCurrentIndex(selectedIndex);
    }
  }, [selectedIndex]);

  useEffect(() => {
    scrollToIndex(currentIndex);
  }, [currentIndex, scrollToIndex]);

  if (!thumbnails.length) {
    return <div className="filmstrip-empty">No thumbnails available.</div>;
  }

  return (
    <div className="filmstrip-container">
      <div className="filmstrip-viewport" ref={scrollRef}>
        <div className="filmstrip-track">
          {thumbnails.map((thumb, index) => (
            <div
              key={index}
              className={`filmstrip-thumbnail ${index === currentIndex ? 'active' : ''}`}
              onClick={() => handleThumbnailClick(index)}
              ref={(el) => thumbnailRefs.current[index] = el}
            >
              <img
                src={thumb.url || thumb}
                alt={`Thumbnail ${index}`}
                loading="lazy"
                onError={(e) => { e.target.src = 'placeholder.png'; }}
              />
              {thumb.label && <span className="filmstrip-label">{thumb.label}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Filmstrip;
