import { useState, useCallback } from 'react'
import { EntityUpdate, InheritFromParentEntity } from './useUpdateTableData'

export interface HistoryEntityUpdate extends EntityUpdate {
  ownAttrib: string[]
  folderId?: string
  wasInherited?: boolean
}

interface HistoryEntry {
  undo: (HistoryEntityUpdate | HistoryCustomCallback)[]
  redo: (HistoryEntityUpdate | HistoryCustomCallback)[]
  timestamp: number
}

type SplitEntitiesByInherited = [EntityUpdate[], InheritFromParentEntity[], HistoryCustomCallback[]]

type HistoryCustomCallback = () => void

export interface UseHistoryReturn {
  pushHistory: (
    undo: (HistoryEntityUpdate | HistoryCustomCallback)[],
    redo: (HistoryEntityUpdate | HistoryCustomCallback)[],
  ) => void
  undo: () => SplitEntitiesByInherited | null
  redo: () => SplitEntitiesByInherited | null
  canUndo: boolean
  canRedo: boolean
  clearHistory: () => void
  removeHistoryEntries: (count: number) => void
}

const useHistory = (maxHistorySize = 50): UseHistoryReturn => {
  const [past, setPast] = useState<HistoryEntry[]>([])
  const [future, setFuture] = useState<HistoryEntry[]>([])

  const pushHistory: UseHistoryReturn['pushHistory'] = useCallback(
    (undo, redo) => {
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

  // Process actions by type: regular updates, inheritance, and custom callbacks
  const processHistoryActions = (
    entities: (HistoryEntityUpdate | HistoryCustomCallback)[],
  ): SplitEntitiesByInherited => {
    return entities.reduce(
      (acc, entity) => {
        if (typeof entity === 'function') {
          acc[2].push(entity)
        } else if (entity.wasInherited) {
          acc[1].push({
            entityId: entity.id,
            entityType: entity.type,
            folderId: entity.folderId,
            attribs: [entity.field],
            ownAttrib: entity.ownAttrib,
            rowId: entity.rowId,
          })
        } else {
          acc[0].push(entity)
        }
        return acc
      },
      [[], [], []] as SplitEntitiesByInherited,
    )
  }

  const undo = useCallback(() => {
    if (past.length === 0) return null
    const newPast = [...past]
    const last = newPast.pop()!
    setPast(newPast)
    setFuture((f) => [...f, last])

    return processHistoryActions(last.undo)
  }, [past])

  const redo = useCallback(() => {
    if (future.length === 0) return null
    const newFuture = [...future]
    const next = newFuture.pop()!
    setFuture(newFuture)
    setPast((p) => [...p, next])
    return processHistoryActions(next.redo)
  }, [future])

  // function to remove x number of entries from the history undo/redo stacks
  const removeHistoryEntries = useCallback((count: number) => {
    setPast((prev) => prev.slice(0, Math.max(0, prev.length - count)))
    setFuture((prev) => prev.slice(0, Math.max(0, prev.length - count)))
  }, [])

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
    removeHistoryEntries,
  }
}

export default useHistory
