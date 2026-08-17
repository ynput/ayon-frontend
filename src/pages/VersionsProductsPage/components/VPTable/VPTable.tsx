import { ProjectTreeTable } from '@shared/containers'
import { FC } from 'react'
import { useVersionsDataContext } from '../../context/VPDataContext'
import { useVPViewsContext } from '@pages/VersionsProductsPage/context/VPViewsContext'
import { VPContextMenuItems } from '../../hooks/useVPContextMenu'
import { AddColumnButton } from '@shared/components'
import styled from 'styled-components'
import { VP_EXTRA_COLUMNS, VP_PARENT_COLUMNS } from '../VPTableSettings/VPTableSettings'

const VP_EXCLUDED_COLUMNS = ['assignees']

const TableWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`

interface VPTableProps {
  readOnly?: string[]
  contextMenuItems: VPContextMenuItems
}

const VPTable: FC<VPTableProps> = ({ readOnly = [], contextMenuItems }) => {
  const {
    fetchNextPage,
    isLoading,
    fieldStats,
    groupFieldStats,
    fieldStatsLoading,
    fieldStatsError,
  } = useVersionsDataContext()
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
    <TableWrapper>
      <ProjectTreeTable
        scope={'versions-and-products'}
        sliceId={''}
        // pagination
        onScrollBottom={() => fetchNextPage()}
        onScrollBottomGroupBy={(groupValue: string) => fetchNextPage(groupValue)}
        readOnly={readOnly}
        excludedColumns={VP_EXCLUDED_COLUMNS}
        isExpandable={showProducts}
        isLoading={isLoading}
        includeLinks={false}
        includeParents={['folder', 'product', 'task']}
        parentColumns={VP_PARENT_COLUMNS}
        showColumnSummaries
        fieldStats={fieldStats}
        groupFieldStats={groupFieldStats}
        fieldStatsLoading={fieldStatsLoading}
        fieldStatsError={fieldStatsError}
        mainCountLabels={{ primary: 'products', secondary: 'versions' }}
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
      <AddColumnButton
        extraColumns={VP_EXTRA_COLUMNS}
        parentColumns={VP_PARENT_COLUMNS}
        includeLinks={false}
      />
    </TableWrapper>
  )
}

export default VPTable
