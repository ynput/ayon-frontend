import { useState, useCallback } from 'react'
import { EntityUpdate } from './useUpdateOverview'

interface HistoryEntry {
  undo: EntityUpdate[]
  redo: EntityUpdate[]
  timestamp: number
}

export interface UseHistoryReturn {
  pushHistory: (undo: EntityUpdate[], redo: EntityUpdate[]) => void
  undo: () => EntityUpdate[] | null
  redo: () => EntityUpdate[] | null
  canUndo: boolean
  canRedo: boolean
  clearHistory: () => void
}

const useHistory = (maxHistorySize = 50): UseHistoryReturn => {
  const [past, setPast] = useState<HistoryEntry[]>([])
  const [future, setFuture] = useState<HistoryEntry[]>([])

  const pushHistory = useCallback(
    (undo: EntityUpdate[], redo: EntityUpdate[]) => {
      if (!undo.length) return
      setPast((prev) => {
        const updated = [...prev, { undo, redo, timestamp: Date.now() }]
        return updated.length > maxHistorySize
          ? updated.slice(updated.length - maxHistorySize)
          : updated
      })
      setFuture([])
    },
    [maxHistorySize],
  )

  const undo = useCallback(() => {
    if (past.length === 0) return null
    const newPast = [...past]
    const last = newPast.pop()!
    setPast(newPast)
    setFuture((f) => [...f, last])
    return last.undo
  }, [past])

  const redo = useCallback(() => {
    if (future.length === 0) return null
    const newFuture = [...future]
    const next = newFuture.pop()!
    setFuture(newFuture)
    setPast((p) => [...p, next])
    return next.redo
  }, [future])

  const clearHistory = useCallback(() => {
    setPast([])
    setFuture([])
  }, [])

  return {
    pushHistory,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    clearHistory,
  }
}

export default useHistory
