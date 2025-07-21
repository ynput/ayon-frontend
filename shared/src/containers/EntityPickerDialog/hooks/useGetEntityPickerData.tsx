import {
  FolderListItem,
  SearchEntityLink,
  useGetProjectQuery,
  useGetSearchedEntitiesLinksInfiniteQuery,
} from '@shared/api'
import { useHierarchyTable } from '@shared/hooks'
import { FC, useMemo } from 'react'
import { PickerEntityType, PickerSearch, PickerSelection } from '../EntityPickerDialog'
import { buildEntityPickerTableData, buildFolderPickerTableData, entityHierarchies } from '../util'
import { SimpleTableRow } from '@shared/SimpleTable'
import { matchSorter } from 'match-sorter'

type EntityQueryResult = {
  data: (SearchEntityLink | FolderListItem)[]
  table: SimpleTableRow[]
  isLoading: boolean
  fetchNextPage?: () => void
  error?: string
}

type EntityPickerDataReturn = {
  folder: EntityQueryResult
  task: EntityQueryResult
  product: EntityQueryResult
  version: EntityQueryResult
  representation: EntityQueryResult
  workfile: EntityQueryResult
}

interface useGetEntityPickerDataProps {
  projectName: string
  entityType: PickerEntityType // which entity type we are picking for
  search: PickerSearch
  selection: PickerSelection
}

export const useGetEntityPickerData = ({
  projectName,
  entityType,
  search,
  selection,
}: useGetEntityPickerDataProps): EntityPickerDataReturn => {
  const entityDependencies = entityHierarchies[entityType] || []
  // convert row selection into a list of ids for each entity type to make it easier to work with
  const idSelection = Object.fromEntries(
    Object.entries(selection).map(([key, value]) => [
      key,
      Object.keys(value).filter((id) => value[id]),
    ]),
  )

  // Get project data
  const { data: project } = useGetProjectQuery({ projectName })
  // convert flat list to table rows for the table
  const {
    data: hierarchTable,
    folders: foldersData,
    isFetching: isLoadingFolders,
  } = useHierarchyTable({
    projectName,
    folderTypes: project?.folderTypes || [],
  })

  //   create flat filtered data when searching on folders
  const foldersTable = useMemo(
    () =>
      search.folder
        ? buildFolderPickerTableData(
            matchSorter(foldersData, search.folder, {
              keys: ['name', 'label', 'path', 'folderType'],
            }),
          )
        : hierarchTable,
    [foldersData, hierarchTable, search.folder],
  )

  const folder: EntityQueryResult = {
    data: foldersData,
    table: foldersTable,
    isLoading: isLoadingFolders,
  }

  //   if there is a selection on the parent we user that, otherwise we use all parent ids of parent data
  const getParentIds = (parentType: PickerEntityType, parentData: { id: string }[] = []) => {
    if (parentType === 'product') {
    }
    const parentSelection = idSelection[parentType]
    if (parentSelection?.length > 0) {
      return parentSelection
    } else if (parentData) {
      return parentData.map((entity) => entity.id)
    } else {
      return undefined
    }
  }

  const task = useGetEntityTypeData(
    projectName,
    'task',
    search.task,
    !entityDependencies.includes('task'),
    idSelection.folder,
  )
  const product = useGetEntityTypeData(
    projectName,
    'product',
    search.product,
    !entityDependencies.includes('product'),
    getParentIds(
      entityHierarchies['product'][entityHierarchies['product'].length - 2],
      folder.data,
    ),
  )
  const version = useGetEntityTypeData(
    projectName,
    'version',
    search.version,
    !entityDependencies.includes('version'),
    getParentIds(
      entityHierarchies['version'][entityHierarchies['version'].length - 2],
      product.data,
    ),
  )
  const representation = useGetEntityTypeData(
    projectName,
    'representation',
    search.representation,
    !entityDependencies.includes('representation'),
    getParentIds(
      entityHierarchies['representation'][entityHierarchies['representation'].length - 2],
      version.data,
    ),
  )
  const workfile = useGetEntityTypeData(
    projectName,
    'workfile',
    search.workfile,
    !entityDependencies.includes('workfile'),
    getParentIds(
      entityHierarchies['workfile'][entityHierarchies['workfile'].length - 2],
      task.data,
    ),
  )

  return {
    folder,
    task,
    product,
    version,
    representation,
    workfile,
  }
}

const useGetEntityTypeData = (
  projectName: string,
  entityType: PickerEntityType,
  search: string | undefined,
  skip: boolean,
  parentIds?: string[],
) => {
  const { data, isFetching, fetchNextPage, error } = useGetSearchedEntitiesLinksInfiniteQuery(
    {
      projectName,
      entityType,
      search,
      parentIds,
    },
    // skip if this is folder hierarchy (we already have the folders) or if we're waiting for parent selection
    {
      skip: skip,
    },
  )

  // Flatten all entities from all pages
  const entities = useMemo(() => {
    return data?.pages.flatMap((page) => page.entities) || []
  }, [data])

  //   convert to table rows
  const table = useMemo(() => buildEntityPickerTableData(entities), [entities])

  return {
    data: entities,
    table: table,
    isLoading: isFetching,
    fetchNextPage,
    error: error as string,
  }
}
