import { useEffect, useRef } from 'react'

// Mouse-leave close for footer popovers. A grace delay bridges the small gap
// between the trigger cell and the popover so moving onto the menu doesn't close it.
export const useHoverClose = (close: () => void, delay = 250) => {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cancelClose = () => {
    if (timer.current) {
      clearTimeout(timer.current)
      timer.current = null
    }
  }
  const scheduleClose = () => {
    cancelClose()
    timer.current = setTimeout(close, delay)
  }

  useEffect(() => cancelClose, [])

  return { cancelClose, scheduleClose }
}
