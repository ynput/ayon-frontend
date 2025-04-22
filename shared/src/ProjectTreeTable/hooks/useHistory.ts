import { useState, useCallback } from 'react'
import { EntityUpdate, InheritFromParentEntity } from './useUpdateOverview'

export interface HistoryEntityUpdate extends EntityUpdate {
  ownAttrib: string[]
  folderId?: string
  wasInherited?: boolean
}

interface HistoryEntry {
  undo: HistoryEntityUpdate[]
  redo: HistoryEntityUpdate[]
  timestamp: number
}

type SplitEntitiesByInherited = [EntityUpdate[], InheritFromParentEntity[]]

export interface UseHistoryReturn {
  pushHistory: (undo: HistoryEntityUpdate[], redo: HistoryEntityUpdate[]) => void
  undo: () => SplitEntitiesByInherited | null
  redo: () => SplitEntitiesByInherited | null
  canUndo: boolean
  canRedo: boolean
  clearHistory: () => void
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

  // undoing back to inherited uses a different update function
  const splitActionsByInherited = (entities: HistoryEntityUpdate[]): SplitEntitiesByInherited => {
    return entities.reduce(
      (acc, entity) => {
        if (entity.wasInherited && entity.folderId) {
          acc[1].push({
            entityId: entity.id,
            entityType: entity.type,
            folderId: entity.folderId,
            attribs: [entity.field],
            ownAttrib: entity.ownAttrib,
          })
        } else {
          acc[0].push(entity)
        }
        return acc
      },
      [[], []] as SplitEntitiesByInherited,
    )
  }

  const undo = useCallback(() => {
    if (past.length === 0) return null
    const newPast = [...past]
    const last = newPast.pop()!
    setPast(newPast)
    setFuture((f) => [...f, last])

    return splitActionsByInherited(last.undo)
  }, [past])

  const redo = useCallback(() => {
    if (future.length === 0) return null
    const newFuture = [...future]
    const next = newFuture.pop()!
    setFuture(newFuture)
    setPast((p) => [...p, next])
    return splitActionsByInherited(next.redo)
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
