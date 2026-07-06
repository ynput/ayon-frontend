import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';

const ThumbnailFilmstrip = ({
  videoId,
  baseUrl = '/api/thumbnails',
  interval = 10, // seconds between thumbnails
  width = 160,
  height = 90,
  onFrameSelect,
}) => {
  const [thumbnails, setThumbnails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const containerRef = useRef(null);

  const fetchThumbnails = useCallback(async () => {
    if (!videoId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${baseUrl}?videoId=${videoId}&interval=${interval}`);
      if (!response.ok) throw new Error('Failed to fetch thumbnails');
      const data = await response.json();
      setThumbnails(data.thumbnails || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [videoId, baseUrl, interval]);

  useEffect(() => {
    fetchThumbnails();
  }, [fetchThumbnails]);

  const handleClick = (index) => {
    setSelectedIndex(index);
    if (onFrameSelect) {
      onFrameSelect(index * interval);
    }
  };

  if (loading) {
    return <div className="filmstrip-loading">Loading thumbnails...</div>;
  }

  if (error) {
    return <div className="filmstrip-error">Error: {error}</div>;
  }

  if (thumbnails.length === 0) {
    return <div className="filmstrip-empty">No thumbnails available.</div>;
  }

  return (
    <div className="filmstrip-container" ref={containerRef}>
      <div className="filmstrip-scroll">
        {thumbnails.map((src, index) => (
          <img
            key={index}
            src={src}
            alt={`Thumbnail at ${index * interval}s`}
            width={width}
            height={height}
            className={`filmstrip-thumb ${selectedIndex === index ? 'selected' : ''}`}
            onClick={() => handleClick(index)}
            style={{
              cursor: 'pointer',
              border: selectedIndex === index ? '2px solid #007bff' : '2px solid transparent',
              marginRight: '4px',
              borderRadius: '4px',
              transition: 'border 0.2s',
            }}
          />
        ))}
      </div>
    </div>
  );
};

ThumbnailFilmstrip.propTypes = {
  videoId: PropTypes.string.isRequired,
  baseUrl: PropTypes.string,
  interval: PropTypes.number,
  width: PropTypes.number,
  height: PropTypes.number,
  onFrameSelect: PropTypes.func,
};

export default ThumbnailFilmstrip;
