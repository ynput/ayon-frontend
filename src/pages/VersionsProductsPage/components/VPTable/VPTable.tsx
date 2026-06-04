import {
  CellWidget,
  COLUMN_MIN_SIZE,
  getValueIdType,
  NEXT_PAGE_ID,
  ProjectTreeTable,
} from '@shared/containers'
import {
  mockFieldStats,
  mergeFieldStats,
  buildMetricTargets,
  useColumnSettingsContext,
} from '@shared/containers/ProjectTreeTable'
import type { FieldStats } from '@shared/containers/ProjectTreeTable'
import { useProjectDataContext } from '@shared/containers'
import { useGetProductsColumnStatsQuery, useGetVersionsColumnStatsQuery } from '@shared/api'
import { FC, useMemo } from 'react'
import { useVersionsDataContext } from '../../context/VPDataContext'
import { useVPViewsContext } from '@pages/VersionsProductsPage/context/VPViewsContext'
import { VPContextMenuItems } from '../../hooks/useVPContextMenu'
import clsx from 'clsx'

interface VPTableProps {
  readOnly?: string[]
  contextMenuItems: VPContextMenuItems
}

const totalRows = (stats: FieldStats[]): number =>
  stats.reduce(
    (max, s) => Math.max(max, (s.valueFilledCount ?? 0) + (s.valueNotFilledCount ?? 0)),
    0,
  )

const VPTable: FC<VPTableProps> = ({ readOnly = [], contextMenuItems }) => {
  const { fetchNextPage, isLoading, columnStatsArgs } = useVersionsDataContext()
  const { showProducts } = useVPViewsContext()
  const { attribFields } = useProjectDataContext()
  const { columnVisibility } = useColumnSettingsContext()

  const productTargets = useMemo(
    () =>
      buildMetricTargets({
        entity: 'product',
        attribs: attribFields,
        columnVisibility,
        extraFields: columnVisibility['productBaseType'] !== false ? ['product_base_type'] : [],
      }),
    [attribFields, columnVisibility],
  )
  const versionTargets = useMemo(
    () => buildMetricTargets({ entity: 'version', attribs: attribFields, columnVisibility }),
    [attribFields, columnVisibility],
  )

  // Live product/version stats over the filtered set, merged with mock for the
  // columns/fields the backend doesn't return yet (distributions, etc.).
  const { data: productStats } = useGetProductsColumnStatsQuery(
    { ...columnStatsArgs, targets: productTargets },
    { skip: !columnStatsArgs.projectName },
  )
  const { data: versionStats } = useGetVersionsColumnStatsQuery(
    { ...columnStatsArgs, targets: versionTargets },
    { skip: !columnStatsArgs.projectName },
  )

  // Primary scope = versions; product stats feed the "include groups & folders"
  // row scope via groupFieldStats.
  const fieldStats = useMemo(() => {
    const products = productStats ?? []
    const versions = versionStats ?? []
    const mainCount: FieldStats = {
      columnName: 'name',
      folderCount: totalRows(products),
      taskCount: totalRows(versions),
    }
    return mergeFieldStats([...versions, mainCount], mockFieldStats)
  }, [productStats, versionStats])
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
      showColumnSummaries
      fieldStats={fieldStats}
      groupFieldStats={productStats}
      mainCountLabels={{ primary: 'products', secondary: 'versions' }}
      columnsConfig={{
        name: {
          display: { path_compact: false, path_full: true },
        },
      }}
      extraColumns={[
        {
          position: 9,
          column: {
            id: 'productBaseType',
            accessorKey: 'productBaseType',
            header: 'Base type',
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
                  className={clsx('productBaseType', { loading: row.original.isLoading })}
                  columnId={column.id}
                  value={value}
                  options={meta?.options?.productType}
                  attributeData={{ type: 'string' }}
                  isReadOnly={true}
                />
              )
            },
          },
        },
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
