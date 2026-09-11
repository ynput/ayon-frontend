import { useCallback, useEffect, useRef, useState } from 'react'
import { ENTITY_TOOLTIP_TYPES } from '@shared/components/EntityTooltip'
import type { SimpleTableRow } from '@shared/containers/SimpleTable/SimpleTable.types'

export type RowTooltipTarget = {
  entityType: string
  entityId: string
}

type HoveredRow = RowTooltipTarget & {
  rowId: string
  pos: { left: number; top: number }
}

// how long the tooltip survives after leaving the row, so it can be hovered itself
const CLOSE_DELAY = 150

// opens the entity tooltip when hovering a row's thumbnail
export const useRowTooltip = (entityType: string, rows?: SimpleTableRow[]) => {
  // products have no tooltip data of their own, their rows point at the featured version
  const isEnabled = ENTITY_TOOLTIP_TYPES.includes(entityType) || entityType === 'product'
  const [hovered, setHovered] = useState<HoveredRow | null>(null)
  const closeTimeout = useRef<ReturnType<typeof setTimeout>>()

  const cancelClose = useCallback(() => clearTimeout(closeTimeout.current), [])

  const close = useCallback(() => {
    cancelClose()
    setHovered(null)
  }, [cancelClose])

  const closeDelayed = useCallback(() => {
    cancelClose()
    closeTimeout.current = setTimeout(() => setHovered(null), CLOSE_DELAY)
  }, [cancelClose])

  useEffect(() => close, [close, entityType])

  useEffect(() => {
    if (!hovered) return
    window.addEventListener('scroll', close, true)
    return () => window.removeEventListener('scroll', close, true)
  }, [hovered, close])

  const resolveTarget = useCallback(
    (rowId: string): RowTooltipTarget | null => {
      const override = rows?.find((row) => row.id === rowId)?.data?.tooltip as
        | RowTooltipTarget
        | undefined
      const target = override || { entityType, entityId: rowId }
      return ENTITY_TOOLTIP_TYPES.includes(target.entityType) && target.entityId ? target : null
    },
    [rows, entityType],
  )

  const onMouseOver = useCallback(
    (event: React.MouseEvent<HTMLTableRowElement>) => {
      if (!isEnabled) return
      const rowId = event.currentTarget.id
      const anchor = (event.target as HTMLElement).closest('.image') as HTMLElement | null

      if (!rowId || !anchor) return close()
      if (hovered?.rowId === rowId) return cancelClose()

      const target = resolveTarget(rowId)
      if (!target) return close()

      const { left, top, width } = anchor.getBoundingClientRect()
      cancelClose()
      setHovered({ ...target, rowId, pos: { left: left + width / 2, top } })
    },
    [isEnabled, hovered, close, cancelClose, resolveTarget],
  )

  return {
    hovered: isEnabled ? hovered : null,
    onMouseOver,
    onMouseLeave: closeDelayed,
    tooltipProps: { onMouseEnter: cancelClose, onMouseLeave: close },
  }
}
