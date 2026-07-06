import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ThumbnailFilmstrip from './ThumbnailFilmstrip';

// Mock the hook
jest.mock('../../hooks/useThumbnails', () => ({
  useThumbnails: jest.fn(),
}));

import { useThumbnails } from '../../hooks/useThumbnails';

const mockUseThumbnails = useThumbnails as jest.Mock;

describe('ThumbnailFilmstrip', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state', () => {
    mockUseThumbnails.mockReturnValue({ thumbnails: [], loading: true, error: null });
    render(<ThumbnailFilmstrip representationId="rep1" totalDuration={60} />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders error state', () => {
    mockUseThumbnails.mockReturnValue({ thumbnails: [], loading: false, error: new Error('Fail') });
    render(<ThumbnailFilmstrip representationId="rep1" totalDuration={60} />);
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });

  it('renders thumbnails and calls onThumbnailClick', async () => {
    const thumbnails = [
      { time: 0, url: 'url0' },
      { time: 5, url: 'url5' },
      { time: 10, url: 'url10' },
    ];
    mockUseThumbnails.mockReturnValue({ thumbnails, loading: false, error: null });

    const onThumbnailClick = jest.fn();
    render(
      <ThumbnailFilmstrip
        representationId="rep1"
        totalDuration={15}
        interval={5}
        onThumbnailClick={onThumbnailClick}
      />
    );

    // Check all thumbnails are rendered
    thumbnails.forEach((thumb) => {
      expect(screen.getByAltText(`Thumbnail at ${thumb.time}s`)).toBeInTheDocument();
      expect(screen.getByText(`${thumb.time}s`)).toBeInTheDocument();
    });

    // Click first thumbnail
    const firstThumb = screen.getByAltText('Thumbnail at 0s');
    userEvent.click(firstThumb.closest('div')!);
    expect(onThumbnailClick).toHaveBeenCalledWith(0);
  });

  it('generates correct time intervals', () => {
    const thumbnails = Array.from({ length: 12 }, (_, i) => ({
      time: i * 5,
      url: `url${i}`,
    }));
    mockUseThumbnails.mockReturnValue({ thumbnails, loading: false, error: null });

    render(<ThumbnailFilmstrip representationId="rep1" totalDuration={60} interval={5} />);

    expect(screen.getAllByRole('img')).toHaveLength(12);
    expect(screen.getByText('0s')).toBeInTheDocument();
    expect(screen.getByText('55s')).toBeInTheDocument();
  });
});
