import { useListItemsDataContext } from '@pages/ProjectListsPage/context/list-items-data'
import { useListsContext } from '@pages/ProjectListsPage/context'
import { getColumnConfigFromType } from '@pages/ProjectListsPage/util'
import { useListValuesContext } from '@pages/ProjectListsPage/context/list-values'
import ListItemsShortcuts from '@pages/ProjectListsPage/util/ListItemsShortcuts'
import { EmptyPlaceholder, FilterErrorActions } from '@shared/components'
import {
  BuildTreeTableColumnsProps,
  EntityType,
  ParentColumnDefinition,
  ProjectTreeTable,
  type ProjectTreeTableProps,
  isFilterError,
  getFilterErrorMessage,
} from '@shared/containers/ProjectTreeTable'
import { Button } from '@ynput/ayon-react-components'
import { FC, useMemo } from 'react'
import { AddColumnButton } from '@shared/components'
import { UniqueIdentifier } from '@dnd-kit/core'
import { useProjectContext, useSettingsPanel } from '@shared/context'
import ImportDialogButton from '@containers/ImportDialog/ImportDialogButton'
import { getRequestErrorString } from '@shared/util'

interface ListItemsTableProps {
  extraColumns: BuildTreeTableColumnsProps['extraColumns']
  extraColumnsSettings: { value: string; label: string }[]
  parentColumns: ParentColumnDefinition[]
  includeParents: EntityType[]
  isLoading?: boolean
  isReview?: boolean
  dndActiveId?: UniqueIdentifier | null // Added prop
  viewOnly?: boolean
  columnsConfig?: ProjectTreeTableProps['columnsConfig']
}

const ListItemsTable: FC<ListItemsTableProps> = ({
  extraColumns,
  extraColumnsSettings,
  parentColumns,
  includeParents,
  isLoading,
  isReview,
  dndActiveId, // Destructure new prop
  viewOnly,
  columnsConfig,
}) => {
  const { projectName } = useProjectContext()
  const { togglePanel } = useSettingsPanel()
  const { selectedLists, selectedList } = useListsContext()
  const {
    isError,
    error,
    fetchNextPage,
    resetFilters,
    listItemsFilters,
    setLinksVisible,
    fieldStats,
    fieldStatsLoading,
    fieldStatsError,
    mainCountLabels,
  } = useListItemsDataContext()
  const scope = `lists-${projectName}`

  // with list values, attribute edits go to the list item, so the entities' read-only
  // attributes (product and version lists) don't apply
  const { isPowerFeature } = useListValuesContext()
  const [hiddenColumns, readOnly] = useMemo(() => {
    const [hidden, readOnly] = getColumnConfigFromType(selectedList?.entityType)
    return [hidden, isPowerFeature ? readOnly.filter((id) => id !== 'attrib') : readOnly]
  }, [selectedList, isPowerFeature])

  const listAttributesMenuItems = useMemo(
    () => [
      {
        id: 'list-attributes',
        label: 'Create list attribute',
        icon: 'add',
        // the button only renders while the panel is closed, so this always opens it
        onClick: () => togglePanel('list_attributes'),
      },
    ],
    [togglePanel],
  )

  if (!selectedList)
    return (
      <EmptyPlaceholder message="Start by selecting or importing a list.">
        <ImportDialogButton importContext="entity_list_item" projectName={projectName} />
      </EmptyPlaceholder>
    )

  if (selectedLists.length > 1)
    return <EmptyPlaceholder message="Please select one list to view its items." />

  if (isError) {
    if (isFilterError(error, { filter: listItemsFilters })) {
      return (
        <EmptyPlaceholder message={getFilterErrorMessage('List items')} icon="filter_alt_off">
          <Button label="Reset filters" icon="replay" onClick={resetFilters} />
          <FilterErrorActions errorMessage={getRequestErrorString(error)} />
        </EmptyPlaceholder>
      )
    }
    const errorMessage = getRequestErrorString(error) || 'Error loading list items.'
    return (
      <EmptyPlaceholder error={errorMessage} ynputError={false}>
        <Button label="Reset" icon="replay" onClick={resetFilters} />
      </EmptyPlaceholder>
    )
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <ProjectTreeTable
        scope={scope}
        sliceId={''}
        // pagination
        onScrollBottom={fetchNextPage}
        readOnly={readOnly}
        excludedColumns={hiddenColumns}
        extraColumns={extraColumns}
        includeParents={includeParents}
        parentColumns={parentColumns}
        isLoading={isLoading}
        sortableRows={!viewOnly}
        enableSorting={!isReview}
        dndActiveId={dndActiveId} // Pass prop
        onColumnVisibleChangeSubscribed={['link_*']}
        onColumnVisibleChange={(changes) => {
          if (Object.values(changes).some((v) => v)) {
            // If any link_ column is visible, we set linksVisible to true
            setLinksVisible(true)
          } else {
            setLinksVisible(false)
          }
        }}
        // hidden while the backend doesn't support list item stats yet —
        // renders automatically once the query stops erroring
        showColumnSummaries={!fieldStatsError}
        fieldStats={fieldStats}
        fieldStatsLoading={fieldStatsLoading}
        mainCountLabels={mainCountLabels}
        columnsConfig={columnsConfig}
      />
      <ListItemsShortcuts />
      <AddColumnButton
        extraColumns={extraColumnsSettings}
        hiddenColumns={hiddenColumns}
        extraMenuItems={listAttributesMenuItems}
        parentColumns={parentColumns}
      />
    </div>
  )
}

export default ListItemsTable
