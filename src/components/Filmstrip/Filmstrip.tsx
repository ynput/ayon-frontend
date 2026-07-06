import React, { useRef, useEffect, useState, useCallback } from 'react';
import './Filmstrip.css';

interface FilmstripProps {
  src: string;
  count?: number;
  width?: number;
  height?: number;
  interval?: number; // seconds between thumbnails
}

interface Thumbnail {
  src: string;
  time: number;
}

const Filmstrip: React.FC<FilmstripProps> = ({
  src,
  count = 10,
  width = 150,
  height = 100,
  interval,
}) => {
  const [thumbnails, setThumbnails] = useState<Thumbnail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const captureFrame = useCallback(
    (video: HTMLVideoElement, canvas: HTMLCanvasElement, time: number): string => {
      video.currentTime = time;
      const ctx = canvas.getContext('2d');
      if (!ctx) return '';
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(video, 0, 0, width, height);
      return canvas.toDataURL();
    },
    [width, height]
  );

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    setLoading(true);
    setError(null);

    const handleLoadedMetadata = () => {
      const duration = video.duration;
      if (!duration || !isFinite(duration)) {
        setError('Invalid video duration');
        setLoading(false);
        return;
      }

      const times: number[] = [];
      if (interval && interval > 0) {
        for (let t = 0; t < duration; t += interval) {
          times.push(t);
        }
      } else {
        const step = duration / (count + 1);
        for (let i = 1; i <= count; i++) {
          times.push(step * i);
        }
      }

      const captured: Thumbnail[] = [];
      let index = 0;

      const captureNext = () => {
        if (index >= times.length) {
          setThumbnails(captured);
          setLoading(false);
          return;
        }

        const time = times[index];
        video.currentTime = time;
        video.onseeked = () => {
          const dataUrl = captureFrame(video, canvas, time);
          if (dataUrl) {
            captured.push({ src: dataUrl, time });
          }
          index++;
          captureNext();
        };
      };

      video.onseeked = null;
      captureNext();
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.src = src;
    video.load();

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.src = '';
    };
  }, [src, count, width, height, interval, captureFrame]);

  return (
    <div className="filmstrip-container">
      {loading && <div className="filmstrip-loading">Loading filmstrip...</div>}
      {error && <div className="filmstrip-error">{error}</div>}
      {!loading && !error && thumbnails.length === 0 && (
        <div className="filmstrip-empty">No thumbnails generated</div>
      )}
      {thumbnails.length > 0 && (
        <div className="filmstrip-strip">
          {thumbnails.map((thumb, idx) => (
            <div key={idx} className="filmstrip-item">
              <img src={thumb.src} alt={`Frame at ${thumb.time.toFixed(1)}s`} />
              <span className="filmstrip-time">{thumb.time.toFixed(1)}s</span>
            </div>
          ))}
        </div>
      )}
      <video ref={videoRef} style={{ display: 'none' }} preload="auto" />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default Filmstrip;
