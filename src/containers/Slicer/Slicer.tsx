import { FC, useState } from 'react'
import SlicerTable, { Container, Header } from '@shared/SimpleTable'

import useTableDataBySlice from './hooks/useTableDataBySlice'
import SlicerSearch from './SlicerSearch'
import clsx from 'clsx'
import { useSlicerContext } from '@context/SlicerContext'
import { SliceType } from '@shared/Slicer'
import { SimpleTableProvider } from '@shared/SimpleTable'

interface SlicerProps {
  sliceFields: SliceType[]
  persistFieldId?: SliceType // when changing slice type, leavePersistentSlice the selected field
}

const Slicer: FC<SlicerProps> = ({ sliceFields = [], persistFieldId }) => {
  const [globalFilter, setGlobalFilter] = useState('')
  const {
    SlicerDropdown,
    rowSelection,
    setRowSelection,
    onRowSelectionChange,
    expanded,
    setExpanded,
    onExpandedChange,
  } = useSlicerContext()

  const {
    sliceOptions,
    sliceType,
    handleSliceTypeChange,
    table: { data: sliceTableData, isExpandable },
    isLoading: isLoadingSliceTableData,
  } = useTableDataBySlice({ sliceFields })

  return (
    <Container>
      <Header>
        <SlicerDropdown
          options={sliceOptions || []}
          value={[sliceType]}
          sliceTypes={sliceFields}
          onChange={(value) =>
            handleSliceTypeChange(
              value[0] as SliceType,
              persistFieldId === sliceType,
              persistFieldId === value[0],
            )
          }
          className={clsx('slicer-dropdown', { 'single-option': sliceOptions.length === 1 })}
          disableOpen={sliceOptions.length === 1}
        />
        <SlicerSearch value={globalFilter} onChange={setGlobalFilter} />
      </Header>
      <SimpleTableProvider
        {...{
          rowSelection,
          setRowSelection,
          onRowSelectionChange,
          expanded,
          setExpanded,
          onExpandedChange,
        }}
      >
        <SlicerTable
          data={sliceTableData}
          isExpandable={isExpandable}
          isLoading={isLoadingSliceTableData}
          forceUpdateTable={sliceType}
          globalFilter={globalFilter}
        />
      </SimpleTableProvider>
    </Container>
  )
}

export default Slicer
