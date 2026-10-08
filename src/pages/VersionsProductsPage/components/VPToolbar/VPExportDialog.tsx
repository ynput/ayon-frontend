import { FC } from 'react'
import {
  TableExportDialogHost,
  TableExportRows,
  TableExportScope,
} from '@shared/containers/TableExport'
import { useProjectTableContext } from '@shared/containers/ProjectTreeTable'
import { useProjectContext } from '@shared/context'
import { useVersionsDataContext } from '@pages/VersionsProductsPage/context/vp-data'
import { useVPViewsContext } from '@pages/VersionsProductsPage/context/vp-views'
import type { QueryArguments } from '@pages/VersionsProductsPage/context/vp-data/VPDataContext'

const sortBy = ({ sortBy, desc }: QueryArguments) =>
  sortBy ? [`${desc ? '-' : ''}${sortBy}`] : undefined

// empty folder ids match nothing, the table sends them only when ids take over
const folderIds = (args: QueryArguments) => (args.folderIds?.length ? args.folderIds : undefined)

// The whole table is exported with the view's filters: products with all their versions
// (as if expanded), or the versions list
const VPExportDialog: FC = () => {
  const { projectName } = useProjectContext()
  const { productArguments: products, versionArguments: versions } = useVersionsDataContext()
  const { showProducts } = useVPViewsContext()
  const { getEntityById } = useProjectTableContext()

  const getRows = (scope: TableExportScope, selectedRowIds: string[]): TableExportRows => {
    if (scope === 'selection') {
      const entities = selectedRowIds.flatMap((id) => getEntityById(id) || [])
      const idsOf = (type: string) =>
        entities.filter((e) => e.entityType === type).map((e) => e.entityId || e.id)
      return { products: { ids: idsOf('product') }, versions: { ids: idsOf('version') } }
    }
    const versionRows = {
      ids: versions.versionIds,
      productIds: versions.productIds,
      folderIds: folderIds(versions),
      filter: versions.versionFilter,
      folderFilter: versions.folderFilter,
      featuredOnly: versions.featuredOnly,
      latestPerFolder: !!versions.latestPerFolder,
      hasReviewables: versions.hasReviewables,
    }
    if (!showProducts) {
      return {
        versions: {
          ...versionRows,
          productFilter: versions.productFilter,
          taskFilter: versions.taskFilter,
          sortBy: sortBy(versions),
        },
      }
    }
    return {
      products: {
        ids: products.productIds,
        folderIds: folderIds(products),
        filter: products.productFilter,
        folderFilter: products.folderFilter,
        versionFilter: products.versionFilter,
        taskFilter: products.taskFilter,
        featuredVersionOrder: products.featuredVersionOrder,
      },
      // the versions of the exported products, filtered like expanded products
      versions: { ...versionRows, ids: undefined, productIds: undefined, folderIds: undefined },
    }
  }

  return (
    <TableExportDialogHost projectName={projectName} subTypeKey="product_type" getRows={getRows} />
  )
}

export default VPExportDialog
