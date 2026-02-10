import {
  CellWidget,
  COLUMN_MIN_SIZE,
  getValueIdType,
  NEXT_PAGE_ID,
  ProjectTreeTable,
} from '@shared/containers'
import { FC } from 'react'
import { useVersionsDataContext } from '../../context/VPDataContext'
import { useVPViewsContext } from '@pages/VersionsProductsPage/context/VPViewsContext'
import { VPContextMenuItems } from '../../hooks/useVPContextMenu'
import clsx from 'clsx'

interface VPTableProps {
  readOnly?: string[]
  contextMenuItems: VPContextMenuItems
}

const VPTable: FC<VPTableProps> = ({ readOnly = [], contextMenuItems }) => {
  const { fetchNextPage, isLoading } = useVersionsDataContext()
  const { showProducts } = useVPViewsContext()
  const {
    uploadVersionItem,
    deleteVersionItem,
    deleteProductItem,
    addToListItem,
    productDetailItem,
    versionDetailItem,
  } = contextMenuItems

  return (
    <ProjectTreeTable
      scope={'versions-and-products'}
      sliceId={''}
      // pagination
      onScrollBottom={() => fetchNextPage()}
      onScrollBottomGroupBy={(groupValue: string) => fetchNextPage(groupValue)}
      readOnly={readOnly}
      excludedColumns={['assignees']}
      isExpandable={showProducts}
      isLoading={isLoading}
      includeLinks={false}
      columnsConfig={{
        name: {
          display: { path_compact: false, path_full: true },
        },
      }}
      extraColumns={[
        {
          position: 10,
          column: {
            id: 'taskType',
            accessorKey: 'taskType',
            header: 'Task type',
            minSize: COLUMN_MIN_SIZE,
            enableResizing: true,
            enablePinning: true,
            enableHiding: true,

            cell: ({ row, column, table }) => {
              const { value, id, type } = getValueIdType(row, column.id)
              if (['group', NEXT_PAGE_ID].includes(type) || row.original.metaType) return null
              const meta = table.options.meta as any
              return (
                <CellWidget
                  rowId={id}
                  className={clsx('taskType', { loading: row.original.isLoading })}
                  columnId={column.id}
                  value={value}
                  options={meta?.options?.taskType}
                  attributeData={{ type: 'string' }}
                  isReadOnly={true}
                />
              )
            },
          },
        },
        {
          position: 11,
          column: {
            id: 'taskLabel',
            accessorKey: 'taskLabel',
            header: 'Task',
            minSize: COLUMN_MIN_SIZE,
            enableResizing: true,
            enablePinning: true,
            enableHiding: true,
            cell: ({ row, column }) => {
              const { value, id, type } = getValueIdType(row, column.id)
              if (['group', NEXT_PAGE_ID].includes(type) || row.original.metaType) return null
              return (
                <CellWidget
                  rowId={id}
                  className={clsx('taskLabel', { loading: row.original.isLoading })}
                  columnId={column.id}
                  value={value}
                  attributeData={{ type: 'string' }}
                  isReadOnly={true}
                />
              )
            },
          },
        },
      ]}
      contextMenuItems={[
        'copy-paste',
        'show-details',
        'open-viewer',
        uploadVersionItem,
        addToListItem,
        productDetailItem,
        versionDetailItem,
        deleteVersionItem,
        deleteProductItem,
      ]}
    />
  )
}

export default VPTable
