import { useCallback, useMemo, useRef } from 'react'
import { useColumnSettingsContext } from '@shared/containers/ProjectTreeTable/context/ColumnSettingsContext'
import { buildAddColumnsMenu, AddColumnItem } from './addColumnsMenu'
import { useVisibilityPaint } from './useVisibilityPaint'
import { useAddColumnDrag } from './useAddColumnDrag'
import type { MenuItemType } from '../Menu'

interface UseAddColumnsMenuProps {
  columns: AddColumnItem[]
  scopes?: string[]
  extraItems?: MenuItemType[]
}

export const useAddColumnsMenu = ({ columns, scopes, extraItems }: UseAddColumnsMenuProps) => {
  const { columnVisibility, defaultColumnVisibility, updateColumnVisibility } =
    useColumnSettingsContext()

  const {
    displayVisibility,
    isVisible,
    onPaintStart,
    onPaintEnter,
    toggle,
    cancelPaint,
    isPainting,
  } = useVisibilityPaint({
    columnVisibility,
    defaultColumnVisibility,
    updateColumnVisibility,
  })

  const { armDrag, cancelDrag, isDragging, dragOverlay } = useAddColumnDrag()

  // one press, two possible gestures: painting inside the menu, dragging a column out of it
  const gestureRef = useRef({ isPainting, isDragging, cancelPaint })
  gestureRef.current = { isPainting, isDragging, cancelPaint }

  // moving onto another item means the gesture is a paint, not a drag out to the table
  const handlePaintEnter = useCallback((columnId: string, pressed: boolean) => {
    if (gestureRef.current.isDragging) return
    if (pressed) cancelDrag()
    onPaintEnter(columnId, pressed)
  }, [cancelDrag, onPaintEnter])

  const handleDragStart = useCallback((column: AddColumnItem, event: React.PointerEvent) => {
    if (gestureRef.current.isPainting) return
    armDrag(column, event)
  }, [armDrag])


  const menuItems = useMemo(
    () =>
      buildAddColumnsMenu({
        columns,
        onToggle: toggle,
        isColumnVisible: isVisible,
        onPaintStart,
        onPaintEnter: handlePaintEnter,
        onDragStart: handleDragStart,
        scopes,
        extraItems,
      }),
    // displayVisibility drives the checkmarks, including the preview while painting
    [
      columns,
      displayVisibility,
      toggle,
      onPaintStart,
      handlePaintEnter,
      handleDragStart,
      scopes,
      extraItems,
    ],
  )

  return { menuItems, hasMenuItems: !!menuItems.length, dragOverlay, onColumnDragStart: armDrag }
}
