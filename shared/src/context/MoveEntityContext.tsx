import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'

export type NewEntityType = 'folder' | 'task'

export interface EntityMoveData {
  entityId: string
  entityType: NewEntityType
  name?: string
  currentParentId?: string
}

export interface MultiEntityMoveData {
  entities: EntityMoveData[]
}

export interface MoveEntityState {
  movingEntities: MultiEntityMoveData | null
  isEntityPickerOpen: boolean
}

interface MoveEntityActions {
  openMoveDialog: (data: EntityMoveData | MultiEntityMoveData) => void
  closeMoveDialog: () => void
  setEntityPickerOpen: (open: boolean) => void
  clearMovingEntities: () => void
}

type MoveEntityContextType = MoveEntityState & MoveEntityActions

const MoveEntityContext = createContext<MoveEntityContextType | null>(null)

interface MoveEntityProviderProps {
  children: ReactNode
}

export const MoveEntityProvider: React.FC<MoveEntityProviderProps> = ({ children }) => {
  const [movingEntities, setMovingEntities] = useState<MultiEntityMoveData | null>(null)
  const [isEntityPickerOpen, setIsEntityPickerOpen] = useState<boolean>(false)

  const openMoveDialog = useCallback((data: EntityMoveData | MultiEntityMoveData) => {
    // Convert single entity to multi-entity format
    const multiEntityData: MultiEntityMoveData = 'entities' in data ? data : { entities: [data] }
    setMovingEntities(multiEntityData)
    setIsEntityPickerOpen(true)
  }, [])

  const closeMoveDialog = useCallback(() => {
    setMovingEntities(null)
    setIsEntityPickerOpen(false)
  }, [])

  const setEntityPickerOpen = useCallback((open: boolean) => {
    setIsEntityPickerOpen(open)
  }, [])

  const clearMovingEntities = useCallback(() => {
    setMovingEntities(null)
  }, [])

  const value: MoveEntityContextType = {
    // State
    movingEntities,
    isEntityPickerOpen,
    // Actions
    openMoveDialog,
    closeMoveDialog,
    setEntityPickerOpen,
    clearMovingEntities,
  }

  return <MoveEntityContext.Provider value={value}>{children}</MoveEntityContext.Provider>
}

export const useMoveEntityContext = (): MoveEntityContextType => {
  const context = useContext(MoveEntityContext)
  if (!context) {
    throw new Error('useMoveEntityContext must be used within a MoveEntityProvider')
  }
  return context
}
