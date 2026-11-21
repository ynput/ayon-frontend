import { useEffect, useState } from 'react'

// True while the parent of the marker element (the toolbar a control sits in) is narrower
// than `width`. Returns the ref for the marker, which should be a hidden element.
export const useParentNarrowerThan = (width: number) => {
  const [marker, setMarker] = useState<HTMLElement | null>(null)
  const [isNarrow, setIsNarrow] = useState(false)

  useEffect(() => {
    const parent = marker?.parentElement
    if (!parent) return
    const update = () => setIsNarrow(parent.clientWidth < width)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(parent)
    return () => observer.disconnect()
  }, [marker, width])

  return [setMarker, isNarrow] as const
}
