import { useEffect, useRef, useState, useCallback } from 'react'

interface MenuPosition {
  top: number
  left: number
}

function calculateMenuPosition(
  targetElement: HTMLElement | null,
): MenuPosition | null {
  if (!targetElement) return null
  
  const targetRect = targetElement.getBoundingClientRect()
  const menuWidth = 200
  const menuHeight = 300
  const topOffset = -8;
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  
  let left: number
  let top: number
  let padding: number
  
  // Check if there's enough space on the right side of the target
  const spaceOnRight = viewportWidth - targetRect.right
  const spaceOnLeft = targetRect.left
  
  if (spaceOnRight >= menuWidth + 24) {
    // Position to the right of target
    padding = -24
    left = targetRect.right + padding
  } else if (spaceOnLeft >= menuWidth + 24) {
    // Position to the left of target
    padding = -48
    left = targetRect.left - menuWidth - padding
  } else {
    // Not enough space on either side, center it with bounds checking
    padding = 24 // Default to positive padding for centering
    left = targetRect.left + (targetRect.width - menuWidth) / 2
    
    // Ensure it doesn't go off screen
    if (left < padding) {
      left = padding
    } else if (left + menuWidth > viewportWidth - padding) {
      left = viewportWidth - menuWidth - padding
    }
  }
  
  // Vertical positioning - try to align with top of target
  top = targetRect.top
  
  // Check if menu would go below viewport
  if (top + menuHeight > viewportHeight - padding) {
    // Position above the target instead
    top = targetRect.bottom - menuHeight
    
    // If still not enough space, position at bottom of viewport
    if (top < padding) {
      top = viewportHeight - menuHeight - padding
    }
  }
  
  return {
    top: top + topOffset,
    left,
  }
}

interface UseMenuPositionReturn {
  position: MenuPosition | null
  menuRef: React.RefObject<HTMLDivElement>
}

export function useMenuPosition(
  target: HTMLElement | null,
  targetId: string,
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
    
    const newPosition = calculateMenuPosition(targetElement)
    if (newPosition) {
      setPosition(newPosition)
    }
  }, [target, targetId])
  
  useEffect(() => {
    updatePosition()
    
    const handleResize = () => updatePosition()
    window.addEventListener('resize', handleResize)
    
    const handleScroll = () => updatePosition()
    window.addEventListener('scroll', handleScroll)
    
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [updatePosition])
  
  return { position, menuRef }
}
