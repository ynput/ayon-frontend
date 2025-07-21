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
  entityType: PickerEntityType
  tableData: SimpleTableRow[] // Folder data if this is a folder table
  isLoading?: boolean // Whether folders are loading
  error?: string // Error message if any
  search?: string // The search term to filter the entities
  onSearch: (search: string | undefined) => void // Callback to handle search changes
  isFolderHierarchy?: boolean // Whether this is a folder hierarchy table
  isMultiSelect?: boolean // Whether to allow multiple selection
  onRowSubmit?: (id: string) => void // Callback when a row is submitted (e.g., double-clicked)
}

const EntityTypeTable: FC<EntityTypeTableProps> = ({
  entityType,
  tableData,
  isLoading = false,
  error,
  search,
  onSearch,
  isFolderHierarchy,
  isMultiSelect,
  onRowSubmit,
}) => {
  const handleDoubleClick = (e: React.MouseEvent<HTMLTableRowElement>) => {
    e.preventDefault()
    const id = e.currentTarget.id
    if (id) {
      onRowSubmit?.(id)
    }
  }

  return (
    <Container>
      <EntityTypeTableHeader
        search={search}
        onSearch={onSearch}
        title={upperFirst(entityType) + 's'}
      />
      {!isLoading && !tableData?.length && (
        <EmptyPlaceholder message={`No ${entityType}s found.`} error={error} />
      )}
      <SimpleTable
        data={tableData}
        isLoading={isLoading}
        isExpandable={isFolderHierarchy}
        rowHeight={34}
        isMultiSelect={isMultiSelect}
        pt={{
          row: {
            onDoubleClick: handleDoubleClick,
          },
        }}
      />
    </Container>
  )
}

export default EntityTypeTable
