// Show's all data for a specific entity type with parent ids and optional search
// When entity type is folder, the data defaults to a tree table when not searching and a flat table when searching

import { FC, useMemo } from 'react'
import { PickerEntityType } from '../EntityPickerDialog'
import SimpleTable, { Container, SimpleTableRow } from '@shared/SimpleTable'
import EntityTypeTableHeader from './EntityTypeTableHeader'
import { upperFirst } from 'lodash'
import { useGetSearchedEntitiesLinksInfiniteQuery } from '@shared/api'
import { buildEntityPickerTableData } from '../util'
import { EmptyPlaceholder } from '@shared/components'

interface EntityTypeTableProps {
  projectName: string // The name of the project
  entityType: PickerEntityType
  foldersTableData: SimpleTableRow[] // we always need the folder to display
  isLoadingFolders?: boolean // Whether the folders data is loading
  parentIds: string[] | undefined // The parent ids to filter the entities by. When undefined we skip the query (not ready yet)
  search?: string // The search term to filter the entities
  onSearch: (search: string | undefined) => void // Callback to handle search changes
}

const EntityTypeTable: FC<EntityTypeTableProps> = ({
  projectName,
  entityType,
  foldersTableData,
  isLoadingFolders = true,
  parentIds,
  search,
  onSearch,
}) => {
  const isFolderHierarchy = entityType === 'folder' && !search

  const {
    data: searchData,
    error,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useGetSearchedEntitiesLinksInfiniteQuery(
    {
      projectName,
      entityType,
      search,
      parentIds,
    },
    // skip entity type is folder and we are not searching (we already have the folders)
    { skip: isFolderHierarchy },
  )

  // Flatten all entities from all pages
  const entities = useMemo(() => {
    return searchData?.pages.flatMap((page) => page.entities) || []
  }, [searchData])

  const tableData = useMemo(() => buildEntityPickerTableData(entities), [entities])

  return (
    <Container>
      <EntityTypeTableHeader search={search} onSearch={onSearch} title={upperFirst(entityType)} />
      {!isLoading && !isFolderHierarchy && !tableData?.length && (
        <EmptyPlaceholder message={`No ${entityType}s found.`} error={error} />
      )}
      <SimpleTable
        data={isFolderHierarchy ? foldersTableData : tableData}
        isLoading={isLoadingFolders || isLoading}
        isExpandable={isFolderHierarchy}
        rowHeight={34}
      />
    </Container>
  )
}

export default EntityTypeTable
