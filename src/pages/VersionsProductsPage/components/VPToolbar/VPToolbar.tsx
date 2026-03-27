import { SortingDropdown, Toolbar } from '@ynput/ayon-react-components'
import { FC, useMemo } from 'react'
import VPSearchFilter from './VPSearchFilter'
import { CustomizeButton, TableGridSwitch } from '@shared/components'
import { useVPViewsContext } from '@pages/VersionsProductsPage/context/VPViewsContext'
import { useGetGroupedFields } from '@shared/containers/ProjectTreeTable'
import styled from 'styled-components'

const GroupByDropdown = styled(SortingDropdown)<{
  $hideRemove?: boolean
  $hideSortOrder?: boolean
}>`
  flex-shrink: 0;

  /* hide the empty placeholder container (flex:1) so chip gets full space */
  .template-value > div:has(.placeholder) {
    display: none;
  }

  .sort-chip {
    min-width: fit-content;

    ${({ $hideRemove }) => $hideRemove && `.remove { display: none; }`}
    ${({ $hideSortOrder }) => $hideSortOrder && `.sort-order { display: none; }`}
  }
`

const VPToolbar: FC = () => {
  const { showGrid, onUpdateShowGrid, viewGroupBy, onUpdateViewGroupBy } = useVPViewsContext()

  const groupedFields = useGetGroupedFields({ scope: 'version' })

  const viewGroupByOptions = useMemo(
    () => [
      { id: 'product', label: 'Product', sortOrder: true },
      ...groupedFields.map((field) => ({
        id: field.value,
        label: field.label,
        sortOrder: true,
      })),
    ],
    [groupedFields],
  )

  // Derive current value from viewGroupBy state
  const viewGroupByValue = useMemo(() => {
    if (!viewGroupBy) return [] // flat list - nothing selected
    const id = viewGroupBy === 'hierarchy' ? 'product' : viewGroupBy
    return viewGroupByOptions.filter((o) => o.id === id)
  }, [viewGroupBy, viewGroupByOptions])

  const handleViewGroupByChange = (values: { id: string; sortOrder?: boolean }[]) => {
    const value = values[0]
    if (!value) {
      // X clicked — flat list (no grouping, no products)
      onUpdateViewGroupBy(undefined)
    } else if (value.id === 'product') {
      onUpdateViewGroupBy('hierarchy')
    } else {
      onUpdateViewGroupBy(value.id)
    }
  }

  const isNoneSelected = !viewGroupBy

  return (
    <Toolbar>
      <VPSearchFilter />
      <GroupByDropdown
        $hideRemove={isNoneSelected}
        $hideSortOrder
        title="Group by"
        options={viewGroupByOptions}
        value={viewGroupByValue}
        onChange={handleViewGroupByChange}
        multiSelect={false}
      />
      <TableGridSwitch showGrid={showGrid} onChange={(value) => onUpdateShowGrid(value)} />
      <CustomizeButton />
    </Toolbar>
  )
}

export default VPToolbar
