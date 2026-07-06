import React, { useState, useRef, useCallback } from 'react';
import './ThumbnailFilmstrip.css';

const ThumbnailFilmstrip = ({ frames, onFrameSelect, width = 80, height = 60 }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const stripRef = useRef(null);

  const handleClick = useCallback((index) => {
    setSelectedIndex(index);
    if (onFrameSelect) onFrameSelect(index);
  }, [onFrameSelect]);

  const scrollToFrame = (index) => {
    if (stripRef.current) {
      const child = stripRef.current.children[index];
      if (child) {
        child.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  };

  const handleSelect = (index) => {
    handleClick(index);
    scrollToFrame(index);
  };

  return (
    <div className="thumbnail-filmstrip">
      {frames.map((src, index) => (
        <div
          key={index}
          className={`filmstrip-frame ${index === selectedIndex ? 'selected' : ''}`}
          style={{ width, height }}
          onClick={() => handleSelect(index)}
          title={`Frame ${index}`}
        >
          <img src={src} alt={`Frame ${index}`} />
        </div>
      ))}
    </div>
  );
};

export default ThumbnailFilmstrip;
