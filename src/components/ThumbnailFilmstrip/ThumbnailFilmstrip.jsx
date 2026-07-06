import React, { useRef, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import './ThumbnailFilmstrip.css';

const ThumbnailFilmstrip = ({ thumbnails, onSelect, selectedIndex }) => {
  const stripRef = useRef(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  const scroll = useCallback((direction) => {
    const strip = stripRef.current;
    if (!strip) return;
    const scrollAmount = 300; // pixels
    const newPosition = direction === 'left' 
      ? Math.max(0, scrollPosition - scrollAmount)
      : Math.min(strip.scrollWidth - strip.clientWidth, scrollPosition + scrollAmount);
    strip.scrollTo({ left: newPosition, behavior: 'smooth' });
    setScrollPosition(newPosition);
  }, [scrollPosition]);

  const handleThumbnailClick = useCallback((index) => {
    if (onSelect) onSelect(index);
  }, [onSelect]);

  const canScrollLeft = scrollPosition > 0;
  const canScrollRight = stripRef.current 
    ? scrollPosition < stripRef.current.scrollWidth - stripRef.current.clientWidth
    : true;

  return (
    <div className="thumbnail-filmstrip-container">
      <button 
        className="filmstrip-arrow filmstrip-arrow-left" 
        onClick={() => scroll('left')}
        disabled={!canScrollLeft}
        aria-label="Scroll left"
      >
        &#8249;
      </button>
      <div className="thumbnail-filmstrip" ref={stripRef}>
        {thumbnails.map((src, index) => (
          <div 
            key={index}
            className={`thumbnail-item ${index === selectedIndex ? 'selected' : ''}`}
            onClick={() => handleThumbnailClick(index)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') handleThumbnailClick(index); }}
          >
            <img src={src} alt={`Thumbnail ${index}`} loading="lazy" />
            <span className="thumbnail-index">{index + 1}</span>
          </div>
        ))}
      </div>
      <button 
        className="filmstrip-arrow filmstrip-arrow-right" 
        onClick={() => scroll('right')}
        disabled={!canScrollRight}
        aria-label="Scroll right"
      >
        &#8250;
      </button>
    </div>
  );
};

ThumbnailFilmstrip.propTypes = {
  thumbnails: PropTypes.arrayOf(PropTypes.string).isRequired,
  onSelect: PropTypes.func,
  selectedIndex: PropTypes.number,
};

ThumbnailFilmstrip.defaultProps = {
  onSelect: null,
  selectedIndex: 0,
};

export default ThumbnailFilmstrip;
