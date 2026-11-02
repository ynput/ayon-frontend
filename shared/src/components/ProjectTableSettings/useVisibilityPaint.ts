import { useCallback, useEffect, useRef, useState } from 'react'
import type { VisibilityState } from '@tanstack/react-table'
import { checkColumnVisibility } from '@shared/containers/ProjectTreeTable/utils'

const SKIP_TOGGLE_MS = 300

// base keeps rows in place for the whole drag, next is the previewed result
type PaintState = { action: 'show' | 'hide'; base: VisibilityState; next: VisibilityState }

interface UseVisibilityPaintProps {
  columnVisibility: VisibilityState
  defaultColumnVisibility?: VisibilityState
  updateColumnVisibility: (visibility: VisibilityState) => void
  isLocked?: (columnId: string) => boolean
}

export interface VisibilityPaint {
  // rows keep their pre-drag section membership so the list doesn't reflow under the cursor
  baseVisibility: VisibilityState
  // what the rows/menu items should render as while dragging
  displayVisibility: VisibilityState
  isVisible: (columnId: string) => boolean
  onPaintStart: (columnId: string) => void
  onPaintEnter: (columnId: string, pressed: boolean) => void
  toggle: (columnId: string) => void
  cancelPaint: () => void
  isPainting: boolean
}

// press a column then drag across others to apply the same show/hide to all of them
export const useVisibilityPaint = ({
  columnVisibility,
  defaultColumnVisibility,
  updateColumnVisibility,
  isLocked,
}: UseVisibilityPaintProps): VisibilityPaint => {
  const [paint, setPaint] = useState<PaintState | null>(null)
  const paintRef = useRef<PaintState | null>(null)
  paintRef.current = paint
  const armedRef = useRef<{ columnId: string; action: 'show' | 'hide' } | null>(null)
  // a drag ending back on the pressed row fires a click that would undo what was painted;
  // a drag ending anywhere else fires no click at all, so the guard has to expire on its own
  const skipToggleUntilRef = useRef(0)

  // an open sub-menu keeps the items it was opened with, so toggling must read the latest state
  const latestRef = useRef({ columnVisibility, defaultColumnVisibility, updateColumnVisibility })
  latestRef.current = { columnVisibility, defaultColumnVisibility, updateColumnVisibility }

  const lockedRef = useRef(isLocked)
  lockedRef.current = isLocked

  const applyPaint = (state: PaintState, columnId: string): PaintState => {
    const visible = state.action === 'show'
    if (
      checkColumnVisibility(state.next, columnId, latestRef.current.defaultColumnVisibility) ===
      visible
    )
      return state
    return { ...state, next: { ...state.next, [columnId]: visible } }
  }

  // one update for the whole drag: each column would otherwise PATCH the view settings on its own
  const commit = useCallback(() => {
    armedRef.current = null
    const painted = paintRef.current
    if (!painted) return
    skipToggleUntilRef.current = performance.now() + SKIP_TOGGLE_MS
    latestRef.current.updateColumnVisibility(painted.next)
    setPaint(null)
  }, [])

  const cancel = useCallback(() => {
    armedRef.current = null
    if (paintRef.current) setPaint(null)
  }, [])

  // the pointer can be released anywhere, including outside the list or the menu portal
  useEffect(() => {
    window.addEventListener('pointerup', commit)
    window.addEventListener('pointercancel', cancel)
    return () => {
      window.removeEventListener('pointerup', commit)
      window.removeEventListener('pointercancel', cancel)
    }
  }, [commit, cancel])

  // pressing only arms the drag, a plain click still toggles through onClick
  const onPaintStart = useCallback((columnId: string) => {
    if (lockedRef.current?.(columnId)) return
    skipToggleUntilRef.current = 0
    const { columnVisibility, defaultColumnVisibility } = latestRef.current
    const isVisible = checkColumnVisibility(columnVisibility, columnId, defaultColumnVisibility)
    armedRef.current = { columnId, action: isVisible ? 'hide' : 'show' }
  }, [])

  const onPaintEnter = useCallback((columnId: string, pressed: boolean) => {
    const armed = armedRef.current
    if (!armed) return
    // the release could have happened anywhere, an unpressed pointer is never a drag
    if (!pressed) {
      cancel()
      return
    }
    if (lockedRef.current?.(columnId)) return
    setPaint((current) => {
      const { columnVisibility } = latestRef.current
      const started =
        current ??
        applyPaint(
          { action: armed.action, base: columnVisibility, next: columnVisibility },
          armed.columnId,
        )
      return applyPaint(started, columnId)
    })
  }, [])

  const toggle = useCallback((columnId: string) => {
    if (performance.now() < skipToggleUntilRef.current) {
      skipToggleUntilRef.current = 0
      return
    }
    const { columnVisibility, defaultColumnVisibility, updateColumnVisibility } = latestRef.current
    const isVisible = checkColumnVisibility(columnVisibility, columnId, defaultColumnVisibility)
    updateColumnVisibility({ ...columnVisibility, [columnId]: !isVisible })
  }, [])

  const displayVisibility = paint?.next ?? columnVisibility

  return {
    baseVisibility: paint?.base ?? columnVisibility,
    displayVisibility,
    isVisible: (columnId) =>
      checkColumnVisibility(displayVisibility, columnId, defaultColumnVisibility),
    onPaintStart,
    onPaintEnter,
    toggle,
    cancelPaint: cancel,
    isPainting: !!paint,
  }
}
