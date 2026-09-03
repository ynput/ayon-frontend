// Show's all data for a specific entity type with parent ids and optional search
// When entity type is folder, the data defaults to a tree table when not searching and a flat table when searching

import { FC } from 'react'
import { createPortal } from 'react-dom'
import { PickerEntityType } from '../EntityPickerDialog'
import SimpleTable from '@shared/containers/SimpleTable/SimpleTable'
import { Container } from '@shared/containers/SimpleTable/SimpleTable.styled'
import type { SimpleTableRow } from '@shared/containers/SimpleTable/SimpleTable.types'
import EntityTypeTableHeader from './EntityTypeTableHeader'
import { upperFirst } from 'lodash'
import { EmptyPlaceholder } from '@shared/components/EmptyPlaceholder/EmptyPlaceholder'
import { EntityTooltip } from '@shared/components/EntityTooltip'
import { useRowTooltip } from '../hooks/useRowTooltip'

interface EntityTypeTableProps {
  entityType: PickerEntityType
  projectName: string
  tableData: SimpleTableRow[] // Folder data if this is a folder table
  isLoading?: boolean // Whether folders are loading
  error?: string // Error message if any
  search?: string // The search term to filter the entities
  onSearch: (search: string | undefined) => void // Callback to handle search changes
  isFolderHierarchy?: boolean // Whether this is a folder hierarchy table
  isMultiSelect?: boolean // Whether to allow multiple selection
  onRowSubmit?: (id: string) => void // Callback when a row is submitted (e.g., double-clicked)
  onScrollBottom?: () => void // Callback when scrolled to the bottom of the table
}

const EntityTypeTable: FC<EntityTypeTableProps> = ({
  entityType,
  projectName,
  tableData,
  isLoading = false,
  error,
  search,
  onSearch,
  isFolderHierarchy,
  isMultiSelect,
  onRowSubmit,
  onScrollBottom,
}) => {
  const tooltip = useRowTooltip(entityType)

  const handleDoubleClick = (e: React.MouseEvent<HTMLTableRowElement>) => {
    e.preventDefault()
    const id = e.currentTarget.id
    const row = tableData.find((r) => r.id === id)
    if (id && !row?.isDisabled) {
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
        imgRatio={16 / 9}
        isMultiSelect={isMultiSelect}
        onScrollBottom={onScrollBottom}
        pt={{
          row: {
            onDoubleClick: handleDoubleClick,
            onMouseOver: tooltip.onMouseOver,
            onMouseLeave: tooltip.onMouseLeave,
          },
        }}
      />
      {tooltip.hovered &&
        createPortal(
          <EntityTooltip
            entityType={entityType}
            entityId={tooltip.hovered.id}
            projectName={projectName}
            pos={tooltip.hovered.pos}
          />,
          document.body,
        )}
    </Container>
  )
}

export default EntityTypeTable
