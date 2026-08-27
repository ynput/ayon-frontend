import { useCallback, useEffect, useState } from 'react'
import { ENTITY_TOOLTIP_TYPES } from '@shared/components/EntityTooltip'

type HoveredRow = {
  id: string
  pos: { left: number; top: number }
}

// opens the entity tooltip when hovering a row's thumbnail or label
export const useRowTooltip = (entityType: string) => {
  const isEnabled = ENTITY_TOOLTIP_TYPES.includes(entityType)
  const [hovered, setHovered] = useState<HoveredRow | null>(null)

  const close = useCallback(() => setHovered(null), [])

  useEffect(() => close, [close, entityType])

  useEffect(() => {
    if (!hovered) return
    window.addEventListener('scroll', close, true)
    return () => window.removeEventListener('scroll', close, true)
  }, [hovered, close])

  const onMouseOver = useCallback(
    (event: React.MouseEvent<HTMLTableRowElement>) => {
      if (!isEnabled) return
      const id = event.currentTarget.id
      const anchor = (event.target as HTMLElement).closest(
        '.image, .value, .path',
      ) as HTMLElement | null

      if (!id || !anchor) return close()
      if (hovered?.id === id) return

      const { left, top, width } = anchor.getBoundingClientRect()
      setHovered({ id, pos: { left: left + width / 2, top } })
    },
    [isEnabled, hovered, close],
  )

  return {
    hovered: isEnabled ? hovered : null,
    onMouseOver,
    onMouseLeave: close,
  }
}
