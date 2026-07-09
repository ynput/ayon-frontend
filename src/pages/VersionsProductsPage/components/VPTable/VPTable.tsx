import {
  CellWidget,
  COLUMN_MIN_SIZE,
  getValueIdType,
  NEXT_PAGE_ID,
  ProjectTreeTable,
} from '@shared/containers'
import { checkColumnVisibility, useColumnSettingsContext } from '@shared/containers/ProjectTreeTable'
import { useProjectDataContext, useViewsContext } from '@shared/containers'
import { usePowerpack } from '@shared/context'
import {
  mergeFieldStats,
  buildMetricTargets,
  isSummaryActive,
  shouldSkipColumnStats,
  totalRowsFromStats,
  useGetProductsColumnStatsQuery,
  useGetVersionsColumnStatsQuery,
} from '@shared/api'
import type { FieldStats } from '@shared/api'
import { FC, useMemo } from 'react'
import { useVersionsDataContext } from '../../context/VPDataContext'
import { useVPViewsContext } from '@pages/VersionsProductsPage/context/VPViewsContext'
import { VPContextMenuItems } from '../../hooks/useVPContextMenu'
import clsx from 'clsx'

interface VPTableProps {
  readOnly?: string[]
  contextMenuItems: VPContextMenuItems
}

const VPTable: FC<VPTableProps> = ({ readOnly = [], contextMenuItems }) => {
  const { fetchNextPage, isLoading, columnStatsArgs } = useVersionsDataContext()
  const { showProducts } = useVPViewsContext()
  const { attribFields } = useProjectDataContext()
  const { columnVisibility, defaultColumnVisibility, columnSummaries, columnSummaryScopes } =
    useColumnSettingsContext()
  // hold stats queries until views load, otherwise targets cover every column
  const { isLoadingViews } = useViewsContext()
  // column summaries are a powerpack feature — don't fetch stats without a license
  const { powerLicense } = usePowerpack()
  // skip the query only when the name count and every other summary are off
  const noSummaries = shouldSkipColumnStats(
    columnSummaries,
    columnSummaryScopes,
    columnVisibility,
    defaultColumnVisibility,
  )

  const productTargets = useMemo(
    () =>
      buildMetricTargets({
        entity: 'product',
        attribs: attribFields,
        columnVisibility,
        defaultColumnVisibility,
        columnSummaries,
        columnSummaryScopes,
        extraFields:
          checkColumnVisibility(columnVisibility, 'productBaseType', defaultColumnVisibility) &&
          isSummaryActive('productBaseType', columnSummaries, columnSummaryScopes)
            ? ['product_base_type']
            : [],
      }),
    [attribFields, columnVisibility, defaultColumnVisibility, columnSummaries, columnSummaryScopes],
  )
  const versionTargets = useMemo(
    () =>
      buildMetricTargets({
        entity: 'version',
        attribs: attribFields,
        columnVisibility,
        defaultColumnVisibility,
        columnSummaries,
        columnSummaryScopes,
      }),
    [attribFields, columnVisibility, defaultColumnVisibility, columnSummaries, columnSummaryScopes],
  )

  const {
    data: productStats,
    isLoading: productStatsLoading,
    error: productStatsError,
  } = useGetProductsColumnStatsQuery(
    { ...columnStatsArgs, targets: productTargets },
    { skip: !columnStatsArgs.projectName || isLoadingViews || !powerLicense || noSummaries },
  )
  const {
    data: versionStats,
    isLoading: versionStatsLoading,
    error: versionStatsError,
  } = useGetVersionsColumnStatsQuery(
    { ...columnStatsArgs, targets: versionTargets },
    { skip: !columnStatsArgs.projectName || isLoadingViews || !powerLicense || noSummaries },
  )

  const fieldStats = useMemo(() => {
    const products = productStats ?? []
    const versions = versionStats ?? []
    const mainCount: FieldStats = {
      columnName: 'name',
      primaryCount: productStats ? totalRowsFromStats(products) : undefined,
      secondaryCount: versionStats ? totalRowsFromStats(versions) : undefined,
    }
    return mergeFieldStats([...versions, mainCount])
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
      fieldStatsLoading={productStatsLoading || versionStatsLoading}
      fieldStatsError={productStatsError || versionStatsError}
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
            id: 'folderType',
            accessorKey: 'folderType',
            header: 'Folder type',
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
                  className={clsx('folderType', { loading: row.original.isLoading })}
                  columnId={column.id}
                  value={value}
                  options={meta?.options?.folderType}
                  attributeData={{ type: 'string' }}
                  isReadOnly={true}
                />
              )
            },
          },
        },
        {
          position: 12,
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
