import { ProjectTreeTable } from '@shared/containers'
import { FC } from 'react'
import { useVersionsDataContext } from '../../context/VPDataContext'
import { useVPViewsContext } from '@pages/VersionsProductsPage/context/VPViewsContext'
import { useVPContextMenuContext } from '../../context/VPContextMenuContext'

interface VPTableProps {
  readOnly?: string[]
}

const VPTable: FC<VPTableProps> = ({ readOnly = [] }) => {
  const { fetchNextPage, isLoading } = useVersionsDataContext()
  const { showProducts } = useVPViewsContext()
  const { deleteVersionItem } = useVPContextMenuContext()

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
      contextMenuItems={['copy-paste', 'show-details', 'open-viewer', deleteVersionItem]}
    />
  )
}

export default VPTable
