import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import styles from './ThumbnailFilmstrip.module.css';

/**
 * ThumbnailFilmstrip component displays a horizontal strip of thumbnail images
 * representing equidistant frames of a video asset.
 *
 * Requires an asset ID and optionally duration, interval, and count.
 * It fetches thumbnails from the backend API endpoint:
 *   /api/assets/{assetId}/thumbnails?start=0&interval={interval}&count={count}
 *
 * Props:
 *   assetId: string - unique identifier of the video asset
 *   duration: number - total duration of the video in seconds (used to calculate max interval)
 *   interval: number - time in seconds between two consecutive thumbnails (default: 5)
 *   count: number - maximum number of thumbnails to display (default: 20)
 *   onSelect: function - callback when a thumbnail is clicked, receives time in seconds
 */
const ThumbnailFilmstrip = ({ assetId, duration, interval = 5, count = 20, onSelect }) => {
  const [thumbnails, setThumbnails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!assetId) return;

    const fetchThumbnails = async () => {
      setLoading(true);
      setError(null);

      // Calculate interval based on duration if not provided
      let actualInterval = interval;
      if (duration && !interval) {
        // Adjust interval to get approximately 'count' thumbnails
        actualInterval = Math.max(1, Math.floor(duration / count));
      }

      const params = new URLSearchParams({
        start: 0,
        interval: actualInterval,
        count: count
      });

      try {
        const response = await fetch(`/api/assets/${assetId}/thumbnails?${params}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch thumbnails: ${response.statusText}`);
        }
        const data = await response.json();
        // Assume data is an array of objects with { time: number, url: string }
        setThumbnails(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchThumbnails();
  }, [assetId, duration, interval, count]);

  const handleClick = (time) => {
    if (onSelect) onSelect(time);
  };

  if (loading) {
    return <div className={styles.loading}>Loading filmstrip...</div>;
  }

  if (error) {
    return <div className={styles.error}>Error: {error}</div>;
  }

  if (thumbnails.length === 0) {
    return <div className={styles.empty}>No thumbnails available.</div>;
  }

  return (
    <div className={styles.container} ref={containerRef}>
      {thumbnails.map((thumb) => (
        <div
          key={thumb.time}
          className={styles.thumbnailWrapper}
          onClick={() => handleClick(thumb.time)}
          title={`Time: ${thumb.time}s`}
        >
          <img
            className={styles.thumbnailImage}
            src={thumb.url}
            alt={`Frame at ${thumb.time}s`}
            loading="lazy"
          />
          <span className={styles.timeLabel}>{thumb.time}s</span>
        </div>
      ))}
    </div>
  );
};

ThumbnailFilmstrip.propTypes = {
  assetId: PropTypes.string.isRequired,
  duration: PropTypes.number,
  interval: PropTypes.number,
  count: PropTypes.number,
  onSelect: PropTypes.func
};

export default ThumbnailFilmstrip;
