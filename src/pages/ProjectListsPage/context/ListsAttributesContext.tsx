import { createContext, useContext, ReactNode, useState, useEffect, useRef } from 'react'
import { useListsContext } from './ListsContext'
import {
  useGetEntityListAttributesDefinitionQuery,
  useSetEntityListAttributesDefinitionMutation,
} from '@shared/api'
import type { EntityListAttributeDefinition } from '@shared/api'
import { useProjectDataContext } from '@pages/ProjectOverviewPage/context/ProjectDataContext'
import { toast } from 'react-toastify'
import { confirmDelete } from '@shared/util'

export interface ListsAttributesContextValue {
  listAttributes: EntityListAttributeDefinition[]
  isLoading: boolean
  isUpdating: boolean
  isLoadingNewList: boolean
  updateAttribute: (attribute: EntityListAttributeDefinition) => Promise<void>
  deleteAttribute: (name: string, force?: boolean) => Promise<void>
}

const ListsAttributesContext = createContext<ListsAttributesContextValue | undefined>(undefined)

interface ListsAttributesProviderProps {
  children: ReactNode
}

export const ListsAttributesProvider = ({ children }: ListsAttributesProviderProps) => {
  const { projectName } = useProjectDataContext()
  const { selectedList } = useListsContext()

  const [isLoadingNewList, setIsLoadingNewList] = useState(false)
  const previousListIdRef = useRef<string | null>(null)

  const { data: listAttributes = [], isFetching } = useGetEntityListAttributesDefinitionQuery(
    {
      listId: selectedList?.id || '',
      projectName,
    },
    { skip: !selectedList?.id },
  )

  // Track loading state when list changes and reset when fetch completes
  useEffect(() => {
    const listId = selectedList?.id || null

    // Only set loading to true when the list ID actually changes
    if (listId && listId !== previousListIdRef.current) {
      setIsLoadingNewList(true)
      previousListIdRef.current = listId
    }

    // Reset loading state when fetch completes
    if (!isFetching) {
      setIsLoadingNewList(false)
    }
  }, [selectedList?.id, isFetching])

  const [updateAttribute, { isLoading: isUpdating }] =
    useSetEntityListAttributesDefinitionMutation()

  const handleUpdateAttribute = async (attribute: EntityListAttributeDefinition) => {
    try {
      if (!selectedList?.id) {
        throw new Error('No selected list')
      }

      let updatedAttributes: EntityListAttributeDefinition[]
      const existingAttributeIndex = listAttributes.findIndex(
        (attr) => attr.name === attribute.name,
      )

      if (existingAttributeIndex !== -1) {
        // Attribute exists, update it
        updatedAttributes = listAttributes.map((attr, index) => {
          if (index === existingAttributeIndex) {
            return {
              ...attr,
              ...attribute,
            }
          }
          return attr
        })
      } else {
        // Attribute does not exist, add it
        updatedAttributes = [...listAttributes, attribute]
      }

      await updateAttribute({
        listId: selectedList?.id || '',
        projectName,
        payload: updatedAttributes,
      }).unwrap()
      toast.success('Attribute updated successfully')
    } catch (error: any) {
      console.error('Error updating attribute:', error)
      toast.error(error)
      throw error
    }
  }

  const deleteAttribute = async (name: string) => {
    try {
      if (!selectedList?.id) {
        throw new Error('No selected list')
      }

      const updatedAttributes = listAttributes.filter((attr) => attr.name !== name)

      await updateAttribute({
        listId: selectedList?.id || '',
        projectName,
        payload: updatedAttributes,
      }).unwrap()
      toast.success('Attribute deleted successfully')
    } catch (error: any) {
      console.error('Error deleting attribute:', error)
      toast.error(error)
      throw error
    }
  }

  const handleDeleteAttribute = async (name: string, force?: boolean) => {
    if (force) {
      await deleteAttribute(name)
    } else {
      confirmDelete({
        title: 'attribute',
        message: `Are you sure you want to delete the attribute "${name}"?`,
        accept: async () => {
          await deleteAttribute(name)
        },
      })
    }
  }

  return (
    <ListsAttributesContext.Provider
      value={{
        listAttributes,
        isLoading: isFetching,
        isUpdating,
        isLoadingNewList,
        updateAttribute: handleUpdateAttribute,
        deleteAttribute: handleDeleteAttribute,
      }}
    >
      {children}
    </ListsAttributesContext.Provider>
  )
}

export const useListsAttributesContext = () => {
  const context = useContext(ListsAttributesContext)
  if (context === undefined) {
    throw new Error('useListsAttributesContext must be used within a ListsAttributesProvider')
  }
  return context
}

export default ListsAttributesContext
