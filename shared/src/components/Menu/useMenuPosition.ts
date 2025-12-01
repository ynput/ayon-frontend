import { useEffect, useRef, useState, useCallback, useLayoutEffect } from 'react'

interface MenuPosition {
  top: number
  left?: number
  right?: number
  bottom?: number
}

function calculateMenuPosition(
  targetElement: HTMLElement | null,
  menuElement: HTMLElement | null,
  align: 'left' | 'right' = 'right',
): MenuPosition | null {
  if (!targetElement) return null

  const targetRect = targetElement.getBoundingClientRect()
  const menuRect = menuElement?.getBoundingClientRect()
  const menuWidth = menuRect?.width || 200
  const menuHeight = menuRect?.height || 300
  const padding = 8 // Minimum distance from screen edges
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  // Default position (below the target)
  let top = targetRect.bottom + 8 - 42
  let left: number | undefined
  let right: number | undefined
  let bottom: number | undefined

  // Check if menu fits below, otherwise flip to above
  if (top + menuHeight > viewportHeight - padding) {
    // If it doesn't fit below, check if it fits above
    const topAbove = targetRect.top - 8 - menuHeight
    if (topAbove >= padding) {
      top = topAbove
    } else {
      // If it fits neither, prefer the side with more space or clamp
      // For now, let's clamp to bottom of viewport
      top = Math.min(top, viewportHeight - menuHeight - padding)
      // Or if we want to stick to bottom edge:
      // bottom = padding
      // top = undefined
    }
  }

  // Horizontal positioning
  if (align === 'right') {
    // Align right edge of menu with right edge of target
    // left position would be: targetRect.right - menuWidth
    const potentialLeft = targetRect.right - menuWidth

    if (potentialLeft >= padding) {
      // Fits on the left side
      left = potentialLeft
    } else {
      // Doesn't fit, try aligning left edge with target left
      left = targetRect.left
    }
  } else {
    // Align left edge of menu with left edge of target
    const potentialLeft = targetRect.left
    if (potentialLeft + menuWidth <= viewportWidth - padding) {
      left = potentialLeft
    } else {
      // Doesn't fit, try aligning right edge with target right
      left = targetRect.right - menuWidth
    }
  }

  // Final clamp for horizontal to ensure it doesn't overflow viewport
  if (left !== undefined) {
    left = Math.max(padding, Math.min(left, viewportWidth - menuWidth - padding))
  }

  // Convert to CSS properties.
  // Note: We are using fixed positioning relative to viewport usually,
  // but if the dialog is in a portal, top/left are relative to the window.
  // If we want to support 'right' CSS property for better resizing behavior:
  if (align === 'right' && left !== undefined) {
    // If we aligned to right, maybe we want to set 'right' property instead of 'left'?
    // But 'left' is easier to clamp. Let's stick to 'left' and 'top' for simplicity unless 'right' is explicitly needed.
  }

  return { top, left }
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
      // Only warn if we expected a target but didn't find one
      if (targetId) console.warn(`Target element with id '${targetId}' not found`)
      return
    }

    // We need the menu element to calculate its dimensions
    if (!menuRef.current) return

    const newPosition = calculateMenuPosition(targetElement, menuRef.current, align)
    if (newPosition) {
      setPosition(newPosition)
    }
  }, [target, targetId, align])

  // Initial position update
  useLayoutEffect(() => {
    updatePosition()
  }, [updatePosition])

  // Update on resize and scroll
  useEffect(() => {
    const handleEvent = () => requestAnimationFrame(updatePosition)

    window.addEventListener('resize', handleEvent, { passive: true })
    window.addEventListener('scroll', handleEvent, { passive: true })

    return () => {
      window.removeEventListener('resize', handleEvent)
      window.removeEventListener('scroll', handleEvent)
    }
  }, [updatePosition])

  // Observe menu size changes
  useEffect(() => {
    if (!menuRef.current) return

    const resizeObserver = new ResizeObserver(() => {
      updatePosition()
    })

    resizeObserver.observe(menuRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [updatePosition])

  return { position, menuRef }
}
