import { RefObject, useEffect } from 'react'

// Shared click-outside close for the footer popovers.
export const useClickOutside = (
  ref: RefObject<HTMLElement | null>,
  onClose: () => void,
  enabled = true,
) => {
  useEffect(() => {
    if (!enabled) return
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [enabled, onClose, ref])
}
