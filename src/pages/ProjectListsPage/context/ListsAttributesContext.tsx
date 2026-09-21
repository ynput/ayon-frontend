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
import { AttributeEnumsProvider, useAttributeEnums } from '@shared/hooks'
import { useProjectDataContext } from '@shared/containers/ProjectTreeTable'
import { ListEntityType } from '../components/NewListDialog/NewListDialog'
import { useProjectContext } from '@shared/context'

export interface ListsAttributesContextValue {
  listAttributes: EntityListAttributeDefinition[]
  entityAttribFields: string[]
  isLoading: boolean
  isUpdating: boolean
  isLoadingNewList: boolean
  updateAttributes: (attribute: EntityListAttributeDefinition[]) => Promise<void>
}

const ListsAttributesContext = createContext<ListsAttributesContextValue | undefined>(undefined)

interface ListsAttributesProviderProps {
  children: ReactNode
}

export const ListsAttributesProvider = ({ children }: ListsAttributesProviderProps) => {
  const { projectName } = useProjectContext()
  const { attribFields } = useProjectDataContext()
  const { selectedList } = useListsContext()

  const { data: listAttributesData = [] } = useGetEntityListAttributesDefinitionQuery(
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
  const entityAttribFields = [...scopedAttribFields, ...HIGH_LEVEL_ATTRIBS]

  const filteredListAttributes = useMemo(
    () => listAttributesData.filter((attribute) => !entityAttribFields.includes(attribute.name)),
    [listAttributesData, entityAttribFields],
  )

  // dynamic enums are merged into data.enum, fetched only once a column or filter asks
  return (
    <AttributeEnumsProvider attributes={filteredListAttributes} projectName={projectName} lazy>
      <ListsAttributes entityAttribFields={entityAttribFields}>{children}</ListsAttributes>
    </AttributeEnumsProvider>
  )
}

const HIGH_LEVEL_ATTRIBS = [
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

interface ListsAttributesProps extends ListsAttributesProviderProps {
  entityAttribFields: string[]
}

const ListsAttributes = ({ children, entityAttribFields }: ListsAttributesProps) => {
  const { projectName } = useProjectContext()
  const { selectedList } = useListsContext()

  const [isLoadingNewList, setIsLoadingNewList] = useState(false)
  const previousListIdRef = useRef<string | null>(null)

  const { isFetching } = useGetEntityListAttributesDefinitionQuery(
    {
      listId: selectedList?.id || '',
      projectName,
    },
    { skip: !selectedList?.id },
  )

  const listAttributes = useAttributeEnums<EntityListAttributeDefinition>()

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

  const [updateAttributes, { isLoading: isUpdating }] =
    useSetEntityListAttributesDefinitionMutation()

  const updateAttributesHelper = useCallback(
    async (attributes: EntityListAttributeDefinition[]) => {
      return await updateAttributes({
        listId: selectedList?.id || '',
        projectName,
        payload: attributes,
      }).unwrap()
    },
    [selectedList?.id, projectName],
  )

  // Create a stable reference for the context value that only changes when the actual data changes
  const contextValue = useMemo<ListsAttributesContextValue>(
    () => ({
      listAttributes,
      entityAttribFields,
      isLoading: isFetching,
      isUpdating,
      isLoadingNewList,
      updateAttributes: updateAttributesHelper,
    }),
    [
      listAttributes,
      entityAttribFields,
      isFetching,
      isUpdating,
      isLoadingNewList,
      updateAttributesHelper,
    ],
  )

  return (
    <ListsAttributesContext.Provider value={contextValue}>{children}</ListsAttributesContext.Provider>
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
