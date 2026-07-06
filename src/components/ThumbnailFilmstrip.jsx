import React, { useRef, useEffect, useState, useCallback } from 'react';
import './ThumbnailFilmstrip.css';

/**
 * ThumbnailFilmstrip component
 * Displays a horizontal scrollable filmstrip of thumbnails from a video.
 * 
 * Props:
 * - videoUrl: string (required) - URL of the video file
 * - frameCount: number (optional, default 20) - number of thumbnails to generate
 * - onSeek: (time: number) => void (optional) - callback when a thumbnail is clicked, provides time in seconds
 * - selectedTime: number (optional) - currently selected time to highlight
 */
const ThumbnailFilmstrip = ({
  videoUrl,
  frameCount = 20,
  onSeek,
  selectedTime
}) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [thumbnails, setThumbnails] = useState([]);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load video and extract thumbnails
  useEffect(() => {
    if (!videoUrl) return;

    const video = document.createElement('video');
    video.src = videoUrl;
    video.crossOrigin = 'anonymous';
    video.preload = 'auto';

    const onLoadedMetadata = () => {
      const dur = video.duration;
      setDuration(dur);
      video.currentTime = 0;
    };

    const onSeeked = () => {
      if (video.readyState >= 2) {
        captureFrame();
      }
    };

    let framesCaptured = 0;
    const captureFrame = () => {
      if (framesCaptured >= frameCount || video.currentTime >= duration) {
        video.removeEventListener('loadedmetadata', onLoadedMetadata);
        video.removeEventListener('seeked', onSeeked);
        video.src = '';
        setLoading(false);
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = 160;
      canvas.height = 90;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const time = video.currentTime;
      setThumbnails(prev => [...prev, { time, dataUrl: canvas.toDataURL('image/jpeg', 0.7) }]);

      framesCaptured++;
      const nextTime = (framesCaptured / frameCount) * duration;
      video.currentTime = nextTime;
    };

    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('seeked', onSeeked);
    video.load();

    return () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('seeked', onSeeked);
      video.src = '';
    };
  }, [videoUrl, frameCount]);

  const handleThumbnailClick = useCallback((time) => {
    if (onSeek) onSeek(time);
  }, [onSeek]);

  if (error) {
    return <div className="filmstrip-error">{error}</div>;
  }

  if (loading) {
    return <div className="filmstrip-loading">Loading filmstrip...</div>;
  }

  return (
    <div className="filmstrip-container">
      <div className="filmstrip-timeline">
        {thumbnails.map((thumb, index) => (
          <div
            key={index}
            className={`filmstrip-frame ${selectedTime !== undefined && Math.abs(thumb.time - selectedTime) < 0.1 ? 'selected' : ''}`}
            onClick={() => handleThumbnailClick(thumb.time)}
            title={`Time: ${thumb.time.toFixed(1)}s`}
          >
            <img src={thumb.dataUrl} alt={`Thumbnail at ${thumb.time.toFixed(1)}s`} />
            <span className="filmstrip-time">{formatTime(thumb.time)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export default ThumbnailFilmstrip;
