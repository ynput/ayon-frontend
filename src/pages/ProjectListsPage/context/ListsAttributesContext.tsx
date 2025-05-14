import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react'
import { useListsContext } from './ListsContext'
import {
  useGetEntityListAttributesDefinitionQuery,
  useSetEntityListAttributesDefinitionMutation,
} from '@shared/api'
import type { EntityListAttributeDefinition } from '@shared/api'
import { useProjectDataContext } from '@pages/ProjectOverviewPage/context/ProjectDataContext'
import { toast } from 'react-toastify'
import { confirmDelete } from '@shared/util'
import { ListEntityType } from '../components/NewListDialog/NewListDialog'

export interface ListsAttributesContextValue {
  listAttributes: EntityListAttributeDefinition[]
  entityAttribFields: string[]
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
  const { projectName, attribFields } = useProjectDataContext()
  const { selectedList } = useListsContext()

  const [isLoadingNewList, setIsLoadingNewList] = useState(false)
  const previousListIdRef = useRef<string | null>(null)

  const { data: listAttributesData = [], isFetching } = useGetEntityListAttributesDefinitionQuery(
    {
      listId: selectedList?.id || '',
      projectName,
    },
    { skip: !selectedList?.id },
  )
  // filter out attributes that are "overrides" (i.e. in attributes fields based on scope)
  const scopedAttribFields = attribFields
    .filter((field) => field.scope?.includes(selectedList?.entityType as ListEntityType))
    .map((field) => field.name)
  const highLevelAttribs = [
    'name',
    'label',
    'status',
    'tags',
    'assignees',
    'subType',
    'folderType',
    'productType',
    'taskType',
  ]
  const entityAttribFields = [...scopedAttribFields, ...highLevelAttribs]

  const listAttributes = useMemo(
    () => listAttributesData.filter((attribute) => !entityAttribFields.includes(attribute.name)),
    [listAttributesData, entityAttribFields],
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

  const handleUpdateAttribute = useCallback(
    async (attribute: EntityListAttributeDefinition) => {
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
    },
    [listAttributes, selectedList?.id, projectName],
  )

  const deleteAttribute = useCallback(
    async (name: string) => {
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
    },
    [listAttributes, selectedList?.id, projectName],
  )

  const handleDeleteAttribute = useCallback(async (name: string, force?: boolean) => {
    if (force) {
      return await deleteAttribute(name)
    } else {
      confirmDelete({
        title: 'attribute',
        message: `Are you sure you want to delete the attribute "${name}"?`,
        accept: async () => {
          return await deleteAttribute(name)
        },
        showToasts: false,
      })
    }
  }, [])

  // Create a stable reference for the context value that only changes when the actual data changes
  const contextValue = useMemo<ListsAttributesContextValue>(
    () => ({
      listAttributes,
      entityAttribFields,
      isLoading: isFetching,
      isUpdating,
      isLoadingNewList,
      updateAttribute: handleUpdateAttribute,
      deleteAttribute: handleDeleteAttribute,
    }),
    [
      listAttributes,
      entityAttribFields,
      isFetching,
      isUpdating,
      isLoadingNewList,
      handleUpdateAttribute,
      handleDeleteAttribute,
    ],
  )

  return (
    <ListsAttributesContext.Provider value={contextValue}>
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
