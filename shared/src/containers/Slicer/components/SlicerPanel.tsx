import { FC, useCallback, useMemo } from 'react'
import SimpleTable from '@shared/containers/SimpleTable/SimpleTable'
import { Container, Header, HeaderButton } from '@shared/containers/SimpleTable/SimpleTable.styled'
import { ExpandedState, Row, RowSelectionState } from '@tanstack/react-table'
import type { SimpleTableRow } from '@shared/containers/SimpleTable/SimpleTable.types'

import useTableDataBySlice from '../hooks/useTableDataBySlice'
import {
  useSlicerCounts,
  type GetSlicerCountsSource,
  type SlicerCountsSource,
} from '../hooks/useSlicerCounts'
import { Icon } from '@ynput/ayon-react-components'
import SlicerSearch from './SlicerSearch'
import clsx from 'clsx'
import { useHierarchyContextMenuItems } from '../hooks/useHierarchyContextMenuItems'
import type { OnAddToList } from '../hooks/useHierarchyContextMenuItems'
import type { SlicePanel as SlicePanelData, SliceType, SliceTypeField } from '../types'
import { SimpleTableProvider } from '@shared/containers/SimpleTable/context/SimpleTableContext'
import { OnSliceTypeChange, useSlicerContext } from '../context/SlicerContext'
import styled from 'styled-components'
import { SyncButton } from '@shared/components/SyncButton/SyncButton'
import { useProjectFoldersContext } from '@shared/context/ProjectFoldersContext'
import { usePowerpack } from '@shared/context/PowerpackContext'
import type { OpenMoveDialog } from '@shared/containers/MoveEntityDialog/types'
import SlicerPanelSummary from './SlicerPanelSummary'

const DropdownSkeleton = styled.div`
  height: 28px;
  border-radius: 4px;
  background: var(--md-sys-color-surface-container);
  width: 100px;
`

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
  margin-left: auto;
  flex-shrink: 0;

  // the open search box takes the whole header rather than sitting on top of the buttons
  &.searching {
    flex: 1;
    min-width: 0;
  }
`

// the column is narrow: the dimension name shrinks rather than being pushed out
const PanelHeader = styled(Header)`
  .slicer-dropdown {
    flex: 0 1 auto;
    min-width: 48px;
  }

  &.collapsed {
    cursor: pointer;
  }

  .collapse-toggle .icon {
    transition: transform 0.15s;
  }

  .collapse-toggle.collapsed .icon {
    transform: rotate(-90deg);
  }

  .power-feature .icon {
    color: var(--md-sys-color-tertiary);
  }
`

const SliceLabel = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
  min-width: 0;
  flex: 0 1 auto;
  padding: 0 4px;

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .icon {
    flex-shrink: 0;
  }
`

export const SPLIT_SLICER_OPTION = '__splitSlicer__'

type SlicerDropdownOption = SliceTypeField & { disabled?: boolean; disabledMessage?: string }

export interface SlicerPanelProps {
  panel: SlicePanelData
  // panels actually rendered; without a license the rest stay stored but must not
  // reserve slice types or ride along on counts
  visibleSlices: SlicePanelData[]
  sliceFields: SliceTypeField[]
  entityTypes?: string[]
  pinnedSliceType?: SliceType
  countsSource?: SlicerCountsSource | GetSlicerCountsSource
  onAddToList?: OnAddToList
  openMoveDialog: OpenMoveDialog
  splitEnabled?: boolean
  canCollapse?: boolean
  isPrimary?: boolean
  showRemove?: boolean
  // undefined while the search box is closed
  search: string | undefined
  onSearchChange: (value: string | undefined) => void
}

export const SlicerPanel: FC<SlicerPanelProps> = ({
  panel,
  visibleSlices,
  sliceFields,
  entityTypes = ['task'],
  pinnedSliceType,
  countsSource,
  onAddToList,
  openMoveDialog,
  splitEnabled,
  canCollapse,
  isPrimary,
  showRemove,
  search,
  onSearchChange,
}) => {
  const {
    SlicerDropdown,
    addSlicePanel,
    removeSlicePanel,
    collapsedPanels,
    togglePanelCollapsed,
    setPanelSliceType,
    getPanelSelection,
    setPanelSelection,
    getPanelExpanded,
    setPanelExpanded,
    onSliceTypeChange,
    isViewSyncPending,
    onOpenViewer,
    onAddToList: contextOnAddToList,
  } = useSlicerContext()

  const { refetch } = useProjectFoldersContext()
  const { powerLicense, setPowerpackDialog } = usePowerpack()

  const rowSelection = getPanelSelection(panel.id)
  const expanded = getPanelExpanded(panel.id)

  const handleSelectionChange = (s: RowSelectionState) => {
    setPanelSelection(panel.id, s)
  }
  const handleExpandedChange = useCallback<React.Dispatch<React.SetStateAction<ExpandedState>>>(
    (value) => setPanelExpanded(panel.id, value),
    [setPanelExpanded, panel.id],
  )

  const resolvedCountsSource = useMemo(
    () => (typeof countsSource === 'function' ? countsSource(panel.sliceType) : countsSource),
    [countsSource, panel.sliceType],
  )
  // a sibling's field only rides along when its args match ours, i.e. same cache entry
  const sharedSliceTypes = useMemo(() => {
    const all = visibleSlices.map((s) => s.sliceType)
    if (typeof countsSource !== 'function') return all
    const key = (source?: SlicerCountsSource) => JSON.stringify([source?.entity, source?.args])
    const own = key(resolvedCountsSource)
    return all.filter((t) => t === panel.sliceType || key(countsSource(t)) === own)
  }, [countsSource, resolvedCountsSource, visibleSlices, panel.sliceType])
  const { counts, filled, complete } = useSlicerCounts(
    resolvedCountsSource,
    panel.sliceType,
    sharedSliceTypes,
  )

  const handlePanelSliceTypeChange = useCallback<OnSliceTypeChange>(
    (newSliceType, pinCurrent) => {
      if (isPrimary) onSliceTypeChange(newSliceType, pinCurrent)
      else setPanelSliceType(panel.id, newSliceType)
    },
    [isPrimary, onSliceTypeChange, setPanelSliceType, panel.id],
  )

  const usedSliceTypes = useMemo(
    () => visibleSlices.filter((s) => s.id !== panel.id).map((s) => s.sliceType),
    [visibleSlices, panel.id],
  )

  const {
    sliceOptions,
    sliceType,
    handleSliceTypeChange,
    table: { data: sliceTableData, isExpandable },
    sliceMap,
    isLoading: isLoadingSliceTableData,
  } = useTableDataBySlice({
    sliceFields,
    usedSliceTypes,
    entityTypes,
    counts,
    filled,
    countsComplete: complete,
    sliceType: panel.sliceType,
    onSliceTypeChange: handlePanelSliceTypeChange,
  })

  const isHierarchy = sliceType === 'hierarchy'
  const isCollapsed = !!canCollapse && collapsedPanels.includes(panel.id)
  const sliceOption = sliceOptions.find((option) => option.value === sliceType)
  const sliceTypeIcon = sliceOption?.icon || 'table_rows'
  const sliceTypeLabel = sliceOption?.label || sliceType

  const isSearching = search !== undefined
  const globalFilter = search ?? ''
  // the hierarchy panel is named after the tree, but what it lists is folders
  const searchSubject = isHierarchy ? 'Folders' : sliceTypeLabel

  const hierarchyContextMenu = useHierarchyContextMenuItems(
    onAddToList || contextOnAddToList,
    sliceMap,
    onOpenViewer,
    openMoveDialog,
  )
  const rowContextMenuBuilders = isHierarchy ? hierarchyContextMenu.rowContextMenuBuilders : []

  const unusedSliceTypes = useMemo(
    () =>
      sliceOptions
        .map((o) => o.value)
        .filter((value) => !visibleSlices.some((s) => s.sliceType === value)),
    [sliceOptions, visibleSlices],
  )
  const canSplit = !!splitEnabled && unusedSliceTypes.length > 0

  const dropdownOptions = useMemo(() => {
    const options: SlicerDropdownOption[] = sliceOptions.map((option) =>
      usedSliceTypes.includes(option.value)
        ? { ...option, disabled: true, disabledMessage: 'Already used by another panel' }
        : option,
    )
    if (canSplit) {
      options.push({ label: 'Split slicer', value: SPLIT_SLICER_OPTION, icon: 'splitscreen_add' })
    }
    return options
  }, [sliceOptions, usedSliceTypes, canSplit])

  const handleSplit = () => {
    if (!powerLicense) return setPowerpackDialog('slicer')
    addSlicePanel(unusedSliceTypes[0])
  }

  const handleDropdownChange = (value: (string | number)[]) => {
    const selected = String(value[0]) as SliceType
    if (selected === SPLIT_SLICER_OPTION) {
      handleSplit()
      return
    }
    handleSliceTypeChange(selected, !!isPrimary && pinnedSliceType === sliceType)
  }

  return (
    <Container>
      <PanelHeader
        className={clsx({ collapsed: isCollapsed })}
        // like vscode: the whole header of a collapsed panel opens it again
        onClick={isCollapsed ? () => togglePanelCollapsed(panel.id) : undefined}
      >
        {canCollapse && (
          <HeaderButton
            icon="expand_more"
            className={clsx('collapse-toggle', { collapsed: isCollapsed })}
            data-tooltip={isCollapsed ? 'Expand panel' : 'Collapse panel'}
            data-tooltip-delay={0}
            onClick={() => togglePanelCollapsed(panel.id)}
          />
        )}
        {isCollapsed ? (
          // the dropdown cannot be used from a collapsed panel, but the dimension it
          // shows has to read the same as the dropdown does when open
          <SliceLabel>
            <Icon icon={sliceTypeIcon} />
            <span>{sliceTypeLabel}</span>
          </SliceLabel>
        ) : isViewSyncPending ? (
          <DropdownSkeleton />
        ) : (
          !isSearching && (
            <SlicerDropdown
              options={dropdownOptions}
              value={[sliceType]}
              sliceTypes={sliceFields.map((field) => field.value)}
              onChange={(value) => handleDropdownChange(value)}
              className={clsx('slicer-dropdown', { 'single-option': dropdownOptions.length === 1 })}
              disableOpen={dropdownOptions.length === 1}
            />
          )
        )}
        {isCollapsed && <SlicerPanelSummary rowSelection={rowSelection} sliceMap={sliceMap} />}
        <HeaderActions
          className={clsx({ searching: isSearching })}
          // the buttons act on the panel, not on the collapsed header they sit in
          onClick={(event) => event.stopPropagation()}
        >
          {!isCollapsed && (
            <SlicerSearch
              open={isSearching}
              value={globalFilter}
              subject={searchSubject}
              onChange={onSearchChange}
            />
          )}
          {isHierarchy && (
            <SyncButton
              topics={['entity.folder.created']}
              onSync={async () => {
                await refetch()
              }}
              hideWhenNoUpdates
            />
          )}
          {canSplit && isPrimary && !isSearching && (
            <HeaderButton
              icon="splitscreen_add"
              className={clsx({ 'power-feature': !powerLicense })}
              data-tooltip={powerLicense ? 'Split slicer' : 'Power feature - Slicer'}
              data-tooltip-delay={0}
              onClick={handleSplit}
            />
          )}
          {showRemove && !isSearching && (
            <HeaderButton
              icon="close"
              data-tooltip="Remove panel"
              data-tooltip-delay={0}
              onClick={() => removeSlicePanel(panel.id)}
            />
          )}
        </HeaderActions>
      </PanelHeader>
      {!isCollapsed && (
        <SimpleTableProvider
          {...{
            rowSelection,
            onRowSelectionChange: handleSelectionChange,
            expanded,
            setExpanded: handleExpandedChange,
            data: sliceMap,
          }}
        >
          <SimpleTable
            data={sliceTableData}
            isExpandable={isExpandable}
            isLoading={isLoadingSliceTableData || isViewSyncPending}
            forceUpdateTable={sliceType}
            globalFilter={globalFilter}
            rowIdPrefix={`slicer-${panel.id}`}
            onRename={
              isHierarchy
                ? (_id: string, row: Row<SimpleTableRow>) =>
                    hierarchyContextMenu.onRename(row.original)
                : undefined
            }
            renamingId={isHierarchy ? hierarchyContextMenu.renamingRow?.id : null}
            renameInitialValue={isHierarchy ? hierarchyContextMenu.renameInitialValue : undefined}
            onSubmitRename={
              isHierarchy ? (_id, value) => hierarchyContextMenu.onSubmitRename(value) : undefined
            }
            onCancelRename={isHierarchy ? hierarchyContextMenu.onCancelRename : undefined}
            onRowOptionClick={isHierarchy ? hierarchyContextMenu.onOptionClick : undefined}
            rowContextMenuBuilders={rowContextMenuBuilders}
          />
        </SimpleTableProvider>
      )}
    </Container>
  )
}

export default SlicerPanel
