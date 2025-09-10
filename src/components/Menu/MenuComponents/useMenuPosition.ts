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
  const menuRect = { width: 200, height: 300, bottom: targetRect.bottom }
  
  const padding = 8
  const viewportWidth = window.innerWidth
  
  let left = targetRect.right - menuRect.width // Default: align to right edge of target

  if (left < padding) {
    left = targetRect.left
  }
  
  if (left + menuRect.width > viewportWidth - padding) {
    left = viewportWidth - menuRect.width - padding
  }
  
  return {
    top: targetRect.top - 8,
    left: left + targetRect.width / 2,
  }
}

interface UseMenuPositionReturn {
  position: MenuPosition | null
  menuRef: React.RefObject<HTMLDivElement>
}

function useMenuPosition(
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
  }, [updatePosition])
  
  return { position, menuRef }
}

export default useMenuPosition
