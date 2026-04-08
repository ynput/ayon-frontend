import { SortingDropdown, Toolbar } from '@ynput/ayon-react-components'
import { FC, useCallback, useMemo } from 'react'
import VPSearchFilter from './VPSearchFilter'
import { CustomizeButton, TableGridSwitch } from '@shared/components'
import { useVPViewsContext } from '@pages/VersionsProductsPage/context/VPViewsContext'
import { useGetGroupedFields, useColumnSettingsContext } from '@shared/containers/ProjectTreeTable'
import styled from 'styled-components'

const GroupByDropdown = styled(SortingDropdown)<{
  $disableSortOrder?: boolean
}>`
  flex-shrink: 0;

  /* hide the empty placeholder container (flex:1) so chip gets full space */
  .template-value > div:has(.placeholder) {
    display: none;
  }

  .sort-chip {
    min-width: fit-content;

    /* Override arrow_right with arrow_upward to match GroupSettings panel */
    .sort-order .icon {
      font-size: 0;

      &::after {
        content: 'arrow_upward';
        font-family: 'Material Symbols Outlined';
        font-size: 16px;
        display: block;
        transform: rotate(90deg);
      }
    }

    ${({ $disableSortOrder }) =>
      $disableSortOrder &&
      `
      .sort-order {
        opacity: 0.5;
        cursor: not-allowed;
        pointer-events: none;
      }
    `}
  }
`

const VPToolbar: FC = () => {
  const { showGrid, onUpdateShowGrid, viewGroupBy, onUpdateViewGroupBy, columns, onUpdateColumns } =
    useVPViewsContext()
  const { sorting } = useColumnSettingsContext()

  const groupedFields = useGetGroupedFields({ scope: 'version' })

  const viewGroupByOptions = useMemo(
    () => [
      { id: 'product', label: 'Product', icon: 'inventory_2', sortOrder: true },
      ...groupedFields.map((field) => ({
        id: field.value,
        label: field.label,
        icon: field.icon,
        sortOrder: true,
      })),
    ],
    [groupedFields],
  )

  // Derive current value from viewGroupBy state, including current sort order from columns config
  const viewGroupByValue = useMemo(() => {
    if (!viewGroupBy) return [] // flat list - nothing selected
    const id = viewGroupBy === 'hierarchy' ? 'product' : viewGroupBy
    const option = viewGroupByOptions.find((o) => o.id === id)
    if (!option) return []

    // When grouping (not hierarchy), get sort order from groupBy.desc
    // When hierarchy or flat, get from sorting config
    let sortOrder = true // default to ascending

    if (viewGroupBy !== 'hierarchy' && columns.groupBy) {
      // Grouping mode: get sort order from groupBy.desc
      sortOrder = !columns.groupBy.desc // invert: desc true = sortOrder false (descending)
    } else if (sorting.length > 0) {
      // Flat or hierarchy mode: get from sorting
      sortOrder = !sorting[0].desc
    }

    return [{ ...option, sortOrder }]
  }, [viewGroupBy, viewGroupByOptions, columns.groupBy, sorting])

  const handleViewGroupByChange = useCallback(
    (values: { id: string; sortOrder?: boolean }[]) => {
      const value = values[0]

      // Get the grouping selection from the dropdown (what the user selected)
      const selectedGrouping = !value ? undefined : (value.id === 'product' ? 'hierarchy' : value.id)

      // Handle sort order changes by updating the columns config
      if (value && value.sortOrder !== undefined) {
        const newDesc = !value.sortOrder // invert sortOrder to desc

        // When grouping (not hierarchy), toggle group sorting (groupBy.desc)
        // When hierarchy or flat, toggle item sorting
        if (viewGroupBy && viewGroupBy !== 'hierarchy' && columns.groupBy) {
          // Grouping mode: update groupBy.desc
          onUpdateColumns({
            ...columns,
            groupBy: {
              ...columns.groupBy,
              desc: newDesc,
            },
          })

        } else {
          // Flat or hierarchy mode: update item sorting
          onUpdateColumns({
            ...columns,
            sorting: [{ id: value.id, desc: newDesc }],
          })
        }
      }

      // Handle grouping selection change (only if selection actually changed)
      if (selectedGrouping !== viewGroupBy) {
        if (!value) {
          // X clicked — flat list (no grouping, no products)
          onUpdateViewGroupBy(undefined)
        } else if (value.id === 'product') {
          onUpdateViewGroupBy('hierarchy')
        } else {
          onUpdateViewGroupBy(value.id)
        }
      }
    },
    [columns, onUpdateColumns, onUpdateViewGroupBy, viewGroupBy],
  )
  return (
    <Toolbar>
      <VPSearchFilter />
      <GroupByDropdown
        $disableSortOrder={!viewGroupBy || viewGroupBy === 'hierarchy'}
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
