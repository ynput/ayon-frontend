import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

export interface DetailsPanelEntity {
  entityId: string
  entityType: 'folder' | 'task' | 'version'
}

export interface DetailsPanelEntityContextType {
  selectedEntity: DetailsPanelEntity | null
  setSelectedEntity: (entity: DetailsPanelEntity | null) => void
  clearSelectedEntity: () => void
}

export const DetailsPanelEntityContext = createContext<DetailsPanelEntityContextType | undefined>(
  undefined,
)

export interface DetailsPanelEntityProviderProps {
  children: ReactNode
}

export const DetailsPanelEntityProvider = ({ children }: DetailsPanelEntityProviderProps) => {
  const [selectedEntity, setSelectedEntityState] = useState<DetailsPanelEntity | null>(null)

  const setSelectedEntity = useCallback((entity: DetailsPanelEntity | null) => {
    setSelectedEntityState(entity)
  }, [])

  const clearSelectedEntity = useCallback(() => {
    setSelectedEntityState(null)
  }, [])

  const value = {
    selectedEntity,
    setSelectedEntity,
    clearSelectedEntity,
  }

  return (
    <DetailsPanelEntityContext.Provider value={value}>
      {children}
    </DetailsPanelEntityContext.Provider>
  )
}

export const useDetailsPanelEntityContext = () => {
  const context = useContext(DetailsPanelEntityContext)
  if (!context) {
    throw new Error('useDetailsPanelEntityContext must be used within a DetailsPanelEntityProvider')
  }
  return context
}
