import React from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { useThumbnailFilmstrip } from '../../hooks/useThumbnailFilmstrip';
import { useStyles } from './ThumbnailFilmstrip.styles';

interface ThumbnailFilmstripProps {
  thumbnails: string[];
  currentIndex: number;
  onSelect: (index: number) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  thumbWidth?: number;
  thumbHeight?: number;
  visibleCount?: number;
}

const ThumbnailFilmstrip: React.FC<ThumbnailFilmstripProps> = ({
  thumbnails,
  currentIndex,
  onSelect,
  onLoadMore,
  hasMore = false,
  thumbWidth = 120,
  thumbHeight = 70,
  visibleCount = 7,
}) => {
  const {
    scrollRef,
    startIndex,
    handlePrev,
    handleNext,
    canScrollPrev,
    canScrollNext,
  } = useThumbnailFilmstrip({
    totalItems: thumbnails.length,
    visibleCount,
    currentIndex,
    hasMore,
    onLoadMore,
  });

  const classes = useStyles();

  return (
    <Box className={classes.container}>
      <Tooltip title="Previous" arrow>
        <span>
          <IconButton
            className={classes.navButton}
            onClick={handlePrev}
            disabled={!canScrollPrev}
            size="small"
          >
            <ChevronLeft />
          </IconButton>
        </span>
      </Tooltip>
      <Box className={classes.viewport} ref={scrollRef}>
        <Box className={classes.strip}>
          {thumbnails.slice(startIndex, startIndex + visibleCount).map((src, idx) => {
            const globalIndex = startIndex + idx;
            const isActive = globalIndex === currentIndex;
            return (
              <Tooltip key={globalIndex} title={`Frame ${globalIndex}`} arrow>
                <Box
                  className={`${classes.thumb} ${isActive ? classes.activeThumb : ''}`}
                  onClick={() => onSelect(globalIndex)}
                >
                  <img
                    src={src}
                    alt={`Frame ${globalIndex}`}
                    width={thumbWidth}
                    height={thumbHeight}
                    loading="lazy"
                    className={classes.img}
                  />
                </Box>
              </Tooltip>
            );
          })}
        </Box>
      </Box>
      <Tooltip title="Next" arrow>
        <span>
          <IconButton
            className={classes.navButton}
            onClick={handleNext}
            disabled={!canScrollNext}
            size="small"
          >
            <ChevronRight />
          </IconButton>
        </span>
      </Tooltip>
    </Box>
  );
};

export default ThumbnailFilmstrip;
