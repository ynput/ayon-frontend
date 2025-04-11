import React, { createContext, useContext, useState, ReactNode } from 'react'

// NOTE: this provide must wrap the ProjectTreeTable component somewhere outside of it
// It is not by default wrapping the ProjectTreeTable component

// Define the structure for selected items
interface SelectedItem {
  id: string
  entityType: string
}

type SelectionContextType = {
  selectedItems: SelectedItem[]
  selectItem: (id: string, entityType: string) => void
  deselectItem: (id: string) => void
  toggleSelection: (id: string, entityType: string, additive?: boolean) => void
  clearSelection: () => void
  isSelected: (id: string) => boolean
  getSelectedIds: () => string[]
  getSelectedEntityTypes: () => string[]
}

const SelectionContext = createContext<SelectionContextType | undefined>(undefined)

interface EntitySelectionProviderProps {
  children: ReactNode
}

export const EntitySelectionProvider: React.FC<EntitySelectionProviderProps> = ({ children }) => {
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([])
  const allowMixedTypes = false

  const selectItem = (id: string, entityType: string) => {
    if (!selectedItems.some((item) => item.id === id)) {
      if (!allowMixedTypes && selectedItems.length > 0) {
        const currentType = selectedItems[0].entityType
        if (currentType !== entityType) {
          // Replace all previous selections with the new type
          setSelectedItems([{ id, entityType }])
          return
        }
      }
      setSelectedItems((prev) => [...prev, { id, entityType }])
    }
  }

  const deselectItem = (id: string) => {
    setSelectedItems((prev) => prev.filter((item) => item.id !== id))
  }

  const toggleSelection = (id: string, entityType: string, additive = false) => {
    const isCurrentlySelected = selectedItems.some((item) => item.id === id)

    if (isCurrentlySelected) {
      // If already selected, just remove this item
      deselectItem(id)
    } else {
      // If not selected
      if (additive) {
        // Add to existing selection when additive is true (ctrl/meta key pressed)
        selectItem(id, entityType)
      } else {
        // Replace entire selection when not additive
        setSelectedItems([{ id, entityType }])
      }
    }
  }

  const clearSelection = () => {
    setSelectedItems([])
  }

  const isSelected = (id: string) => selectedItems.some((item) => item.id === id)

  const getSelectedIds = () => selectedItems.map((item) => item.id)

  const getSelectedEntityTypes = () => [...new Set(selectedItems.map((item) => item.entityType))]

  return (
    <SelectionContext.Provider
      value={{
        selectedItems,
        selectItem,
        deselectItem,
        toggleSelection,
        clearSelection,
        isSelected,
        getSelectedIds,
        getSelectedEntityTypes,
      }}
    >
      {children}
    </SelectionContext.Provider>
  )
}

export const useEntitySelection = (): SelectionContextType => {
  const context = useContext(SelectionContext)
  if (context === undefined) {
    throw new Error('useEntitySelection must be used within a EntitySelectionProvider')
  }
  return context
}
