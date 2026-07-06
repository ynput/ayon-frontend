import React, { useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import './ThumbnailFilmstrip.css';

const ThumbnailFilmstrip = ({ thumbnails, onSelect, selectedIndex }) => {
  const stripRef = useRef(null);

  const scroll = useCallback((direction) => {
    if (stripRef.current) {
      const scrollAmount = 200;
      stripRef.current.scrollBy({
        left: direction * scrollAmount,
        behavior: 'smooth',
      });
    }
  }, []);

  return (
    <div className="thumbnail-filmstrip-container">
      <button className="filmstrip-arrow filmstrip-arrow-left" onClick={() => scroll(-1)} aria-label="Scroll left">
        &#8249;
      </button>
      <div className="thumbnail-filmstrip" ref={stripRef}>
        {thumbnails.map((thumb, index) => (
          <div
            key={thumb.id || index}
            className={`thumbnail-filmstrip__item ${index === selectedIndex ? 'thumbnail-filmstrip__item--selected' : ''}`}
            onClick={() => onSelect && onSelect(index, thumb)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect && onSelect(index, thumb);
              }
            }}
            aria-label={`Thumbnail ${index + 1}`}
          >
            <img src={thumb.src} alt={thumb.alt || `Thumbnail ${index + 1}`} />
          </div>
        ))}
      </div>
      <button className="filmstrip-arrow filmstrip-arrow-right" onClick={() => scroll(1)} aria-label="Scroll right">
        &#8250;
      </button>
    </div>
  );
};

ThumbnailFilmstrip.propTypes = {
  thumbnails: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      src: PropTypes.string.isRequired,
      alt: PropTypes.string,
    })
  ).isRequired,
  onSelect: PropTypes.func,
  selectedIndex: PropTypes.number,
};

ThumbnailFilmstrip.defaultProps = {
  onSelect: null,
  selectedIndex: -1,
};

export default ThumbnailFilmstrip;
