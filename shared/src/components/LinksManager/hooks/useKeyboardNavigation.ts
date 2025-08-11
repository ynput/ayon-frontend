import { useEffect, useRef, useState, useCallback } from 'react'

interface Entity {
  id: string
  name: string
  [key: string]: any
}

interface UseKeyboardNavigationProps {
  entities: Entity[]
  onSelect: (entity: Entity) => void
  onClose: () => void
  isActive: boolean
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  fetchNextPage?: () => void
}

const useKeyboardNavigation = ({
  entities,
  onSelect,
  onClose,
  isActive,
  hasNextPage = false,
  isFetchingNextPage = false,
  fetchNextPage,
}: UseKeyboardNavigationProps) => {
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const containerRef = useRef<HTMLUListElement>(null)

  // Reset selection when entities change
  useEffect(() => {
    setSelectedIndex(-1)
  }, [entities])

  // Check if we need to fetch more data when navigating near the end
  useEffect(() => {
    if (
      selectedIndex >= entities.length - 3 && // When within 3 items of the end
      hasNextPage &&
      !isFetchingNextPage &&
      fetchNextPage
    ) {
      fetchNextPage()
    }
  }, [selectedIndex, entities.length, hasNextPage, isFetchingNextPage, fetchNextPage])

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && containerRef.current) {
      const selectedElement = containerRef.current.querySelector(
        `[data-index="${selectedIndex}"]`,
      ) as HTMLElement
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth',
        })
      }
    }
  }, [selectedIndex])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isActive) return

      // Calculate total items including loading placeholders
      const totalItems = entities.length + (hasNextPage ? 3 : 0) // Show 3 loading placeholders

      if (totalItems === 0) return

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          setSelectedIndex((prev) => {
            const nextIndex = prev < totalItems - 1 ? prev + 1 : 0
            // Don't select loading placeholders
            if (nextIndex >= entities.length) {
              return 0 // Wrap to beginning
            }
            return nextIndex
          })
          break
        case 'ArrowUp':
          event.preventDefault()
          setSelectedIndex((prev) => {
            const nextIndex = prev > 0 ? prev - 1 : totalItems - 1
            // Don't select loading placeholders
            if (nextIndex >= entities.length) {
              return entities.length - 1 // Go to last real item
            }
            return nextIndex
          })
          break
        case 'Enter':
          event.preventDefault()
          if (selectedIndex >= 0 && selectedIndex < entities.length) {
            onSelect(entities[selectedIndex])
          }
          break
        case 'Escape':
          event.preventDefault()
          onClose()
          break
      }
    },
    [isActive, entities, selectedIndex, onSelect, onClose, hasNextPage],
  )

  useEffect(() => {
    if (isActive) {
      document.addEventListener('keydown', handleKeyDown)
      return () => {
        document.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [isActive, handleKeyDown])

  const getItemProps = useCallback(
    (index: number) => ({
      'data-index': index,
      className: selectedIndex === index ? 'selected' : '',
      onMouseEnter: () => {
        // Only update selection for real items, not loading placeholders
        if (index < entities.length) {
          setSelectedIndex(index)
        }
      },
    }),
    [selectedIndex, entities.length],
  )

  return {
    selectedIndex,
    containerRef,
    getItemProps,
  }
}

export default useKeyboardNavigation
