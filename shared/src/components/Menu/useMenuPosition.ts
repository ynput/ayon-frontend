import { useEffect, useRef, useState, useCallback } from 'react'

interface MenuPosition {
  top: number
  left?: number
  right?: number
}

function calculateMenuPosition(
  targetElement: HTMLElement | null,
  align: 'left' | 'right' = 'right',
): MenuPosition | null {
  if (!targetElement) return null

  const targetRect = targetElement.getBoundingClientRect()
  const menuWidth = 200
  const menuHeight = 300
  const padding = 24
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  let position: MenuPosition = { top: 0 }

  // Vertical positioning - position below target with offset matching original MenuContainer
  const top = targetRect.bottom + 8 - 42 // -42 offset to overlap with target

  // Horizontal positioning - respect align preference, fallback if out of bounds
  if (align === 'right') {
    // Try to align menu's right edge with target's right edge
    const menuLeft = targetRect.right - menuWidth
    if (menuLeft >= padding) {
      // Enough space, use right alignment
      position.right = viewportWidth - targetRect.right
    } else if (targetRect.left + menuWidth <= viewportWidth - padding) {
      // Not enough space on right, try left alignment
      position.left = targetRect.left
    } else {
      // Clamp to viewport
      position.left = padding
    }
  } else {
    // align === 'left' - align menu's left edge with target's left edge
    if (targetRect.left + menuWidth <= viewportWidth - padding) {
      // Enough space, use left alignment
      position.left = targetRect.left
    } else if (targetRect.right - menuWidth >= padding) {
      // Not enough space on left, try right alignment
      position.right = viewportWidth - targetRect.right
    } else {
      // Clamp to viewport
      position.right = padding
    }
  }

  // Check if menu would go below viewport
  if (top + menuHeight > viewportHeight - padding) {
    // Clamp to viewport with padding
    position.top = Math.max(padding, viewportHeight - menuHeight - padding)
  } else {
    position.top = top
  }

  return position
}

interface UseMenuPositionReturn {
  position: MenuPosition | null
  menuRef: React.RefObject<HTMLDivElement>
}

export function useMenuPosition(
  target: HTMLElement | null,
  targetId: string,
  align: 'left' | 'right' = 'right',
): UseMenuPositionReturn {
  const [position, setPosition] = useState<MenuPosition | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const updatePosition = useCallback(() => {
    let targetElement: HTMLElement | null = target

    if (!targetElement && targetId) {
      targetElement = document.getElementById(targetId)
    }

    if (!targetElement) {
      console.warn('Target element not found')
      return
    }

    const newPosition = calculateMenuPosition(targetElement, align)
    if (newPosition) {
      setPosition(newPosition)
    }
  }, [target, targetId, align])

  useEffect(() => {
    updatePosition()

    const handleResize = () => updatePosition()
    const handleScroll = () => updatePosition()

    window.addEventListener('resize', handleResize, { passive: true })
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [updatePosition])

  return { position, menuRef }
}
