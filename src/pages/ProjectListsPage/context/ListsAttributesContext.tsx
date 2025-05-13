import { createContext, useContext, ReactNode } from 'react'
import { useListsContext } from './ListsContext'
import {
  useGetEntityListAttributesDefinitionQuery,
  useSetEntityListAttributesDefinitionMutation,
} from '@shared/api'
import type { EntityListAttributeDefinition } from '@shared/api'
import { useProjectDataContext } from '@pages/ProjectOverviewPage/context/ProjectDataContext'
import { toast } from 'react-toastify'

export interface ListsAttributesContextValue {
  listAttributes: EntityListAttributeDefinition[]
  updateAttribute: (attribute: EntityListAttributeDefinition) => Promise<void>
  isLoading: boolean
  isUpdating: boolean
}

const ListsAttributesContext = createContext<ListsAttributesContextValue | undefined>(undefined)

interface ListsAttributesProviderProps {
  children: ReactNode
}

export const ListsAttributesProvider = ({ children }: ListsAttributesProviderProps) => {
  const { projectName } = useProjectDataContext()
  const { selectedList } = useListsContext()

  const { data: listAttributes = [], isLoading } = useGetEntityListAttributesDefinitionQuery(
    {
      listId: selectedList?.id || '',
      projectName,
    },
    { skip: !selectedList?.id },
  )

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

  return (
    <ListsAttributesContext.Provider
      value={{
        listAttributes,
        updateAttribute: handleUpdateAttribute,
        isLoading,
        isUpdating,
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
