import {
  buildMetricTargets,
  isSummaryActive,
  mergeFieldStats,
  shouldSkipColumnStats,
  totalRowsFromStats,
  useGetProductsColumnStatsQuery,
  useGetVersionsColumnStatsQuery,
} from '@shared/api'
import type { FieldStats } from '@shared/api'
import {
  checkColumnVisibility,
  useColumnSettingsContext,
  useProjectDataContext,
  useViewsContext,
} from '@shared/containers'
import { usePowerpack, useProjectContext } from '@shared/context'
import { useMemo } from 'react'

type Params = {
  productFilter?: string
  versionFilter?: string
  taskFilter?: string
  folderIds?: string[]
  versionIds?: string[]
  productIds?: string[]
}

export const useVPColumnStats = ({
  productFilter,
  versionFilter,
  taskFilter,
  folderIds,
  versionIds,
  productIds,
}: Params) => {
  const { projectName } = useProjectContext()
  const { attribFields } = useProjectDataContext()
  const { powerLicense } = usePowerpack()
  const { isLoadingViews } = useViewsContext()
  const { columnVisibility, defaultColumnVisibility, columnSummaries, columnSummaryScopes } =
    useColumnSettingsContext()

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

  const columnStatsBaseArgs = {
    projectName,
    productFilter,
    versionFilter,
    taskFilter,
    folderIds,
    versionIds,
    productIds,
  }
  const productStatsArgs = { ...columnStatsBaseArgs, targets: productTargets }
  const versionStatsArgs = { ...columnStatsBaseArgs, targets: versionTargets }
  const skip = !projectName || isLoadingViews || !powerLicense || noSummaries

  const productQuery = useGetProductsColumnStatsQuery(productStatsArgs, { skip })
  const versionQuery = useGetVersionsColumnStatsQuery(versionStatsArgs, { skip })

  const fieldStats = useMemo(() => {
    const products = productQuery.data ?? []
    const versions = versionQuery.data ?? []
    const mainCount: FieldStats = {
      columnName: 'name',
      primaryCount: productQuery.data ? totalRowsFromStats(products) : undefined,
      secondaryCount: versionQuery.data ? totalRowsFromStats(versions) : undefined,
    }
    return mergeFieldStats([...versions, mainCount])
  }, [productQuery.data, versionQuery.data])

  return {
    fieldStats,
    groupFieldStats: productQuery.data ?? [],
    fieldStatsLoading:
      isLoadingViews ||
      productQuery.isLoading ||
      versionQuery.isLoading ||
      productQuery.isFetching ||
      versionQuery.isFetching,
    fieldStatsError: productQuery.error || versionQuery.error,
    productStatsArgs,
    versionStatsArgs,
    isProductStatsUninitialized: productQuery.isUninitialized,
    isVersionStatsUninitialized: versionQuery.isUninitialized,
  }
}
