import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ThumbnailFilmstrip from './ThumbnailFilmstrip';

const mockThumbnails = Array.from({ length: 10 }, (_, i) => ({
  id: `thumb-${i}`,
  src: `https://via.placeholder.com/100x70?text=${i}`,
  alt: `Thumbnail ${i}`
}));

describe('ThumbnailFilmstrip', () => {
  test('renders visible thumbnails', () => {
    render(<ThumbnailFilmstrip thumbnails={mockThumbnails} visibleCount={5} />);
    const thumbnails = screen.getAllByRole('option');
    expect(thumbnails).toHaveLength(5);
  });

  test('scrolls right on arrow click', () => {
    render(<ThumbnailFilmstrip thumbnails={mockThumbnails} visibleCount={5} />);
    const rightButton = screen.getByLabelText('Scroll right');
    fireEvent.click(rightButton);
    const thumbnails = screen.getAllByRole('option');
    expect(thumbnails[0]).toHaveAttribute('aria-selected', 'false');
    // Should show next 5 thumbnails: indices 1-5
    expect(thumbnails[0].querySelector('img')).toHaveAttribute('alt', 'Thumbnail 1');
  });

  test('disables left arrow at start', () => {
    render(<ThumbnailFilmstrip thumbnails={mockThumbnails} visibleCount={5} />);
    const leftButton = screen.getByLabelText('Scroll left');
    expect(leftButton).toBeDisabled();
  });

  test('calls onSelect when thumbnail clicked', () => {
    const onSelect = jest.fn();
    render(<ThumbnailFilmstrip thumbnails={mockThumbnails} onSelect={onSelect} visibleCount={5} />);
    const firstThumb = screen.getAllByRole('option')[0];
    fireEvent.click(firstThumb);
    expect(onSelect).toHaveBeenCalledWith('thumb-0');
  });

  test('keyboard navigation', () => {
    render(<ThumbnailFilmstrip thumbnails={mockThumbnails} visibleCount={5} />);
    const container = screen.getByRole('listbox');
    container.focus();
    fireEvent.keyDown(container, { key: 'ArrowRight' });
    const thumbnails = screen.getAllByRole('option');
    expect(thumbnails[0].querySelector('img')).toHaveAttribute('alt', 'Thumbnail 1');
  });
});
