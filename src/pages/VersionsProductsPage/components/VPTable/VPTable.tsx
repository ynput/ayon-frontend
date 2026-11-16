import { ProjectTreeTable, useAddonTableColumns } from '@shared/containers'
import { FC, useMemo } from 'react'
import { useVersionsDataContext } from '../../context/vp-data'
import { useVPViewsContext } from '@pages/VersionsProductsPage/context/vp-views'
import { VPContextMenuItems } from '../../hooks/useVPContextMenu'
import { AddColumnButton } from '@shared/components'
import styled from 'styled-components'
import {
  VP_EXTRA_COLUMNS,
  VP_PARENT_COLUMNS,
  VP_PARENT_SCOPES,
} from '../VPTableSettings/VPTableSettingsHelpers'

const VP_EXCLUDED_COLUMNS = ['assignees']
const VP_LINK_COLUMNS = ['link_*', ...VP_PARENT_SCOPES.map((scope) => `${scope}_link_*`)]

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
    onLinkColumnsVisibleChange,
  } = useVersionsDataContext()
  const { showProducts } = useVPViewsContext()
  // columns addons contribute (tableColumn slot)
  const { columns: addonColumns, settingsColumns: addonSettingsColumns } =
    useAddonTableColumns('products')
  const addColumnItems = useMemo(
    () => [...VP_EXTRA_COLUMNS, ...addonSettingsColumns],
    [addonSettingsColumns],
  )
  const {
    uploadVersionItem,
    deleteVersionItem,
    deleteProductItem,
    addToListItem,
    productDetailItem,
    versionDetailItem,
    addonTopItems,
    addonItems,
  } = contextMenuItems

  return (
    <TableWrapper>
      <ProjectTreeTable
        addonPage="products"
        scope={'versions-and-products'}
        sliceId={''}
        // pagination
        onScrollBottom={() => fetchNextPage()}
        onScrollBottomGroupBy={(groupValue: string) => fetchNextPage(groupValue)}
        readOnly={readOnly}
        excludedColumns={VP_EXCLUDED_COLUMNS}
        extraColumns={addonColumns}
        isExpandable={showProducts}
        isLoading={isLoading}
        includeParents={VP_PARENT_SCOPES}
        parentColumns={VP_PARENT_COLUMNS}
        onColumnVisibleChangeSubscribed={VP_LINK_COLUMNS}
        onColumnVisibleChange={onLinkColumnsVisibleChange}
        showColumnSummaries
        fieldStats={fieldStats}
        groupFieldStats={groupFieldStats}
        fieldStatsLoading={fieldStatsLoading}
        fieldStatsError={fieldStatsError}
        mainCountLabels={{ primary: 'products', secondary: 'versions' }}
        // versions have no subType, so only the products side breaks down
        mainBreakdownFields={{ primary: 'productType' }}
        columnsConfig={{
          name: {
            display: { path_compact: false, path_full: true },
          },
        }}
        contextMenuItems={[
          addonTopItems,
          'copy-paste',
          'show-details',
          'open-viewer',
          'export',
          uploadVersionItem,
          addToListItem,
          productDetailItem,
          versionDetailItem,
          addonItems,
          deleteVersionItem,
          deleteProductItem,
        ]}
      />
      <AddColumnButton
        extraColumns={addColumnItems}
        parentColumns={VP_PARENT_COLUMNS}
        parentLinkScopes={VP_PARENT_SCOPES}
      />
    </TableWrapper>
  )
}

export default VPTable
