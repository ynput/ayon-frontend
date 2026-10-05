import { useState, useCallback, ReactNode } from 'react'
import { DetailsPanelEntityContext } from './DetailsPanelEntityContextInstance'

export interface DetailsPanelEntity {
  entityId: string
  entityType: 'folder' | 'task' | 'version'
}

export interface DetailsPanelEntityContextType {
  selectedEntity: DetailsPanelEntity | null
  setSelectedEntity: (entity: DetailsPanelEntity | null) => void
  clearSelectedEntity: () => void
}

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

  return (
    <DetailsPanelEntityContext.Provider
      value={{
        selectedEntity,
        setSelectedEntity,
        clearSelectedEntity,
      }}
    >
      {children}
    </DetailsPanelEntityContext.Provider>
  )
}
