import { FC, useState } from 'react'
import SimpleTable, { Container, Header } from '@shared/containers/SimpleTable'

import useTableDataBySlice from '../hooks/useTableDataBySlice'
import SlicerSearch from './SlicerSearch'
import clsx from 'clsx'
import { OnAddToList, SliceType, useHierarchyContextMenuItems } from '@shared/containers/Slicer'
import { SimpleTableProvider } from '@shared/containers/SimpleTable'
import { RowSelectionState } from '@tanstack/react-table'
import { SliceTypeField } from '../types'
import { useSlicerContext } from '../context/SlicerContext'
import styled from 'styled-components'
import { ExpandedState } from '@tanstack/react-table'
import { SyncButton } from '@shared/components'
import { useProjectFoldersContext } from '@shared/context'

const DropdownSkeleton = styled.div`
  height: 28px;
  border-radius: 4px;
  background: var(--md-sys-color-surface-container);
  width: 100px;
`

export interface SlicerProps {
  sliceFields: SliceTypeField[]
  entityTypes?: string[] // entity types
  pinnedSliceType?: SliceType // when changing slice type, pinned the current slice
  onAddToList?: OnAddToList
}

export const Slicer: FC<SlicerProps> = ({
  sliceFields = [],
  entityTypes = ['task'],
  pinnedSliceType,
  onAddToList,
}) => {
  const [globalFilter, setGlobalFilter] = useState('')
  const {
    SlicerDropdown,
    rowSelection,
    onRowSelectionChange,
    expanded,
    onExpandedChange,
    isViewSyncPending,
    onOpenViewer,
    onAddToList: contextOnAddToList,
  } = useSlicerContext()
  const { refetch } = useProjectFoldersContext()
  const handleSync = async () => refetch()

  const {
    sliceOptions,
    sliceType,
    handleSliceTypeChange,
    table: { data: sliceTableData, isExpandable },
    sliceMap,
    isLoading: isLoadingSliceTableData,
  } = useTableDataBySlice({ sliceFields, entityTypes })

  const hierarchyContextMenu = useHierarchyContextMenuItems(
    onAddToList || contextOnAddToList,
    sliceMap,
    onOpenViewer,
  )
  const rowContextMenuBuilders =
    sliceType === 'hierarchy' ? hierarchyContextMenu.rowContextMenuBuilders : []

  const handleSelectionChange = (s: RowSelectionState) => {
    onRowSelectionChange?.(s)
  }

  return (
    <Container>
      <Header>
        {isViewSyncPending ? (
          <DropdownSkeleton />
        ) : (
          <SlicerDropdown
            options={sliceOptions || []}
            value={[sliceType]}
            sliceTypes={sliceFields.map((field) => field.value)}
            onChange={(value: any) =>
              handleSliceTypeChange(value[0] as SliceType, pinnedSliceType === sliceType)
            }
            className={clsx('slicer-dropdown', { 'single-option': sliceOptions.length === 1 })}
            disableOpen={sliceOptions.length === 1}
          />
        )}
        <SlicerSearch value={globalFilter} onChange={setGlobalFilter} />
        <SyncButton
          topics={['entity.folder.created']}
          onSync={async () => {
            await handleSync()
          }}
          hideWhenNoUpdates
        />
      </Header>
      <SimpleTableProvider
        {...{
          rowSelection,
          onRowSelectionChange: handleSelectionChange,
          expanded,
          setExpanded: onExpandedChange as React.Dispatch<React.SetStateAction<ExpandedState>>,
          data: sliceMap,
        }}
      >
        <SimpleTable
          data={sliceTableData}
          isExpandable={isExpandable}
          isLoading={isLoadingSliceTableData || isViewSyncPending}
          forceUpdateTable={sliceType}
          globalFilter={globalFilter}
          renamingId={sliceType === 'hierarchy' ? hierarchyContextMenu.renamingRow?.id : null}
          renameInitialValue={sliceType === 'hierarchy' ? hierarchyContextMenu.renameInitialValue : undefined}
          onSubmitRename={
            sliceType === 'hierarchy' ? (_id, value) => hierarchyContextMenu.onSubmitRename(value) : undefined
          }
          onCancelRename={sliceType === 'hierarchy' ? hierarchyContextMenu.onCancelRename : undefined}
          onRowOptionClick={sliceType === 'hierarchy' ? hierarchyContextMenu.onOptionClick : undefined}
          rowContextMenuBuilders={rowContextMenuBuilders}
        />
      </SimpleTableProvider>
    </Container>
  )
}
