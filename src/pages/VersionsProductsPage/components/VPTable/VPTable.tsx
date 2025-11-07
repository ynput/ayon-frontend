import { ProjectTreeTable } from '@shared/containers'
import { FC } from 'react'
import { useVersionsDataContext } from '../../context/VPDataContext'
import { useVPViewsContext } from '@pages/VersionsProductsPage/context/VPViewsContext'
import { VPContextMenuItems } from '../../hooks/useVPContextMenu'

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
