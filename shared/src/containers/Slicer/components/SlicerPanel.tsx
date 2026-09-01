import { FC, useCallback, useMemo, useState } from 'react'
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
import type { OpenMoveDialog } from '@shared/containers/MoveEntityDialog/types'

const DropdownSkeleton = styled.div`
  height: 28px;
  border-radius: 4px;
  background: var(--md-sys-color-surface-container);
  width: 100px;
`

export const SPLIT_SLICER_OPTION = '__splitSlicer__'

export interface SlicerPanelProps {
  panel: SlicePanelData
  sliceFields: SliceTypeField[]
  entityTypes?: string[]
  pinnedSliceType?: SliceType
  countsSource?: SlicerCountsSource | GetSlicerCountsSource
  onAddToList?: OnAddToList
  openMoveDialog: OpenMoveDialog
  splitEnabled?: boolean
  isPrimary?: boolean
  showRemove?: boolean
}

export const SlicerPanel: FC<SlicerPanelProps> = ({
  panel,
  sliceFields,
  entityTypes = ['task'],
  pinnedSliceType,
  countsSource,
  onAddToList,
  openMoveDialog,
  splitEnabled,
  isPrimary,
  showRemove,
}) => {
  const [globalFilter, setGlobalFilter] = useState('')
  const {
    SlicerDropdown,
    slices,
    addSlicePanel,
    removeSlicePanel,
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
    const all = slices.map((s) => s.sliceType)
    if (typeof countsSource !== 'function') return all
    const key = (source?: SlicerCountsSource) => JSON.stringify([source?.entity, source?.args])
    const own = key(resolvedCountsSource)
    return all.filter((t) => t === panel.sliceType || key(countsSource(t)) === own)
  }, [countsSource, resolvedCountsSource, slices, panel.sliceType])
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

  const {
    sliceOptions,
    sliceType,
    handleSliceTypeChange,
    table: { data: sliceTableData, isExpandable },
    sliceMap,
    isLoading: isLoadingSliceTableData,
  } = useTableDataBySlice({
    sliceFields,
    entityTypes,
    counts,
    filled,
    countsComplete: complete,
    sliceType: panel.sliceType,
    onSliceTypeChange: handlePanelSliceTypeChange,
  })

  const isHierarchy = sliceType === 'hierarchy'

  const hierarchyContextMenu = useHierarchyContextMenuItems(
    onAddToList || contextOnAddToList,
    sliceMap,
    onOpenViewer,
    openMoveDialog,
  )
  const rowContextMenuBuilders = isHierarchy ? hierarchyContextMenu.rowContextMenuBuilders : []

  const usedSliceTypes = useMemo(
    () => slices.filter((s) => s.id !== panel.id).map((s) => s.sliceType),
    [slices, panel.id],
  )
  const unusedSliceTypes = useMemo(
    () =>
      sliceOptions
        .map((o) => o.value)
        .filter((value) => !slices.some((s) => s.sliceType === value)),
    [sliceOptions, slices],
  )
  const canSplit = !!splitEnabled && unusedSliceTypes.length > 0

  const dropdownOptions = useMemo(() => {
    const options: any[] = sliceOptions.map((option) =>
      usedSliceTypes.includes(option.value)
        ? { ...option, disabled: true, disabledMessage: 'Already used by another panel' }
        : option,
    )
    if (canSplit) {
      options.push({ label: 'Split slicer', value: SPLIT_SLICER_OPTION, icon: 'splitscreen' })
    }
    return options
  }, [sliceOptions, usedSliceTypes, canSplit])

  const handleSplit = () => addSlicePanel(unusedSliceTypes[0])

  const handleDropdownChange = (value: string[]) => {
    const selected = value[0] as SliceType
    if (selected === SPLIT_SLICER_OPTION) {
      handleSplit()
      return
    }
    handleSliceTypeChange(selected, !!isPrimary && pinnedSliceType === sliceType)
  }

  return (
    <Container>
      <Header>
        {isViewSyncPending ? (
          <DropdownSkeleton />
        ) : (
          <SlicerDropdown
            options={dropdownOptions}
            value={[sliceType]}
            sliceTypes={sliceFields.map((field) => field.value)}
            onChange={(value: any) => handleDropdownChange(value)}
            className={clsx('slicer-dropdown', { 'single-option': dropdownOptions.length === 1 })}
            disableOpen={dropdownOptions.length === 1}
          />
        )}
        <SlicerSearch value={globalFilter} onChange={setGlobalFilter} />
        {isHierarchy && (
          <SyncButton
            topics={['entity.folder.created']}
            onSync={async () => {
              await refetch()
            }}
            hideWhenNoUpdates
          />
        )}
        {canSplit && (
          <HeaderButton
            icon="add"
            data-tooltip="Split slicer"
            data-tooltip-delay={0}
            onClick={handleSplit}
          />
        )}
        {showRemove && (
          <HeaderButton
            icon="close"
            data-tooltip="Remove panel"
            data-tooltip-delay={0}
            onClick={() => removeSlicePanel(panel.id)}
          />
        )}
      </Header>
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
    </Container>
  )
}

export default SlicerPanel
