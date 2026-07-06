import { useState, useMemo } from 'react';

/**
 * Custom hook for managing thumbnail filmstrip state.
 * @param {Array} items - array of data items (e.g., { src, id })
 * @param {number} initialIndex - initially selected index
 * @returns {Object} { thumbnails, selectedIndex, selectThumbnail }
 */
const useThumbnailFilmstrip = (items, initialIndex = 0) => {
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);

  const thumbnails = useMemo(() => {
    if (!items || !items.length) return [];
    return items.map(item => {
      // Extract image URL; adapt as needed based on data structure
      if (typeof item === 'string') return item;
      if (item.thumbnail) return item.thumbnail;
      if (item.src) return item.src;
      return '';
    }).filter(Boolean);
  }, [items]);

  const selectThumbnail = (index) => {
    if (index >= 0 && index < thumbnails.length) {
      setSelectedIndex(index);
    }
  };

  return { thumbnails, selectedIndex, selectThumbnail };
};

export default useThumbnailFilmstrip;
