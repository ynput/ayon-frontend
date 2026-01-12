import {
  FolderListItem,
  SearchEntityLink,
  useGetSearchedEntitiesLinksInfiniteQuery,
} from '@shared/api'
import { useProjectContext } from '@shared/context'
import { useHierarchyTable } from '@shared/hooks'
import { useMemo } from 'react'
import { PickerEntityType, PickerSearch } from '../EntityPickerDialog'
import {
  buildEntityPickerTableData,
  buildFolderPickerTableData,
  EntityAnatomy,
  entityHierarchies,
} from '../util'
import { SimpleTableRow } from '@shared/containers/SimpleTable'
import { matchSorter } from 'match-sorter'

export type EntityQueryResult = {
  data: (SearchEntityLink | FolderListItem)[]
  table: SimpleTableRow[]
  isLoading: boolean
  isFetchingNextPage?: boolean
  hasNextPage?: boolean
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
  selection: Record<PickerEntityType, string[]>
}

export const useGetEntityPickerData = ({
  projectName,
  entityType,
  search,
  selection,
}: useGetEntityPickerDataProps): EntityPickerDataReturn => {
  const entityDependencies = entityHierarchies[entityType] || []

  // Get project data
  const project = useProjectContext()
  // convert flat list to table rows for the table
  const {
    data: hierarchTable,
    folders: foldersDataRaw,
    isFetching: isLoadingFolders,
  } = useHierarchyTable({
    projectName,
    folderTypes: project?.folderTypes || [],
  })

  const foldersData = useMemo(() => {
    if (!search.folder) return foldersDataRaw
    return matchSorter(foldersDataRaw, search.folder, {
      keys: ['name', 'label', 'path'],
    })
  }, [foldersDataRaw, search.folder])

  //   create flat filtered data when searching on folders
  const foldersTable = useMemo(
    () =>
      search.folder
        ? buildFolderPickerTableData(foldersData, project?.folderTypes || [])
        : hierarchTable,

    [foldersData, hierarchTable, search.folder, project],
  )

  const folder: EntityQueryResult = {
    data: foldersData,
    table: foldersTable,
    isLoading: isLoadingFolders,
  }

  //   if there is a selection on the parent we user that, otherwise we use all parent ids of parent data
  const getParentIds = (parentType: PickerEntityType, parentData: { id: string }[] = []) => {
    const parentSelection = selection[parentType]
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
    getParentIds(entityHierarchies['task'][entityHierarchies['task'].length - 2], foldersData),
    project?.taskTypes,
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
    project?.productTypes,
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
  anatomies?: EntityAnatomy[],
) => {
  const { data, isFetching, hasNextPage, fetchNextPage, isFetchingNextPage, error } =
    useGetSearchedEntitiesLinksInfiniteQuery(
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
  const table = useMemo(
    () => buildEntityPickerTableData(entities, anatomies),
    [entities, anatomies],
  )

  return {
    data: entities,
    table: table,
    isLoading: isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error: error as string,
  }
}
