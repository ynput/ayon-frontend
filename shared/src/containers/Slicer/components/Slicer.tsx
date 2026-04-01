import { FC, useEffect, useMemo, useState } from 'react'
import SimpleTable, { Container, Header } from '@shared/containers/SimpleTable'

import useTableDataBySlice from '../hooks/useTableDataBySlice'
import SlicerSearch from './SlicerSearch'
import clsx from 'clsx'
import { SliceType } from '@shared/containers/Slicer'
import { SimpleTableProvider } from '@shared/containers/SimpleTable'
import { RowSelectionState } from '@tanstack/react-table'
import { SliceTypeField } from '../types'
import { useSlicerContext } from '../context/SlicerContext'
import styled from 'styled-components'

const DropdownSkeleton = styled.div`
  height: 28px;
  border-radius: 4px;
  background: var(--md-sys-color-surface-container);
  width: 100px;
`

export interface SlicerProps {
  sliceFields: SliceTypeField[]
  entityTypes?: string[] // entity types
  persistFieldId?: SliceType // when changing slice type, leavePersistentSlice the selected field
}

export const Slicer: FC<SlicerProps> = ({
  sliceFields = [],
  entityTypes = ['task'],
  persistFieldId,
}) => {
  const [globalFilter, setGlobalFilter] = useState('')
  const {
    SlicerDropdown,
    rowSelection,
    setRowSelection,
    onRowSelectionChange,
    expanded,
    setExpanded,
    onExpandedChange,
    isViewSyncPending,
  } = useSlicerContext()

  // Memoize props to prevent recreating dependency arrays on every render
  const memoizedSliceFields = useMemo(() => sliceFields, [sliceFields])
  const memoizedEntityTypes = useMemo(() => entityTypes, [entityTypes])

  const {
    sliceOptions,
    sliceType,
    handleSliceTypeChange,
    table: { data: sliceTableData, isExpandable },
    sliceMap,
    isLoading: isLoadingSliceTableData,
  } = useTableDataBySlice({ sliceFields: memoizedSliceFields, entityTypes: memoizedEntityTypes })

  const handleSelectionChange = (s: RowSelectionState) => {
    setRowSelection(s)
    onRowSelectionChange?.(s, sliceMap)
  }

  // on first mount, check that current sliceType is in sliceFields, if not, change to first option
  // Skip if view sync is pending — the view will set the correct type once loaded
  useEffect(() => {
    if (isViewSyncPending) return
    const isAttribute = sliceType.startsWith('attrib.')
    if (
      !sliceFields.some((field) => field.value === sliceType) &&
      !(isAttribute && sliceFields.some((field) => field.value === 'attributes'))
    ) {
      handleSliceTypeChange(sliceFields[0].value, false, false)
    }
  }, [isViewSyncPending])

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
              handleSliceTypeChange(
                value[0] as SliceType,
                persistFieldId === sliceType,
                persistFieldId === value[0],
              )
            }
            className={clsx('slicer-dropdown', { 'single-option': sliceOptions.length === 1 })}
            disableOpen={sliceOptions.length === 1}
          />
        )}
        <SlicerSearch value={globalFilter} onChange={setGlobalFilter} />
      </Header>
      <SimpleTableProvider
        {...{
          rowSelection,
          onRowSelectionChange: handleSelectionChange,
          expanded,
          setExpanded,
          onExpandedChange,
          data: sliceMap,
        }}
      >
        <SimpleTable
          data={sliceTableData}
          isExpandable={isExpandable}
          isLoading={isLoadingSliceTableData || isViewSyncPending}
          forceUpdateTable={sliceType}
          globalFilter={globalFilter}
        />
      </SimpleTableProvider>
    </Container>
  )
}
