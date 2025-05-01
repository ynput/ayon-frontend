import { FC, useState } from 'react'
import * as Styled from './Slicer.styled'
import SlicerTable from './SlicerTable'

import useTableDataBySlice from './hooks/useTableDataBySlice'
import SlicerSearch from './SlicerSearch'
import clsx from 'clsx'
import { SliceType, useSlicerContext } from '@context/SlicerContext'

interface SlicerProps {
  sliceFields: SliceType[]
  persistFieldId?: SliceType // when changing slice type, leavePersistentSlice the selected field
}

const Slicer: FC<SlicerProps> = ({ sliceFields = [], persistFieldId }) => {
  const [globalFilter, setGlobalFilter] = useState('')
  const { SlicerDropdown } = useSlicerContext()

  const {
    sliceOptions,
    sliceType,
    handleSliceTypeChange,
    table: { data: sliceTableData, isExpandable },
    isLoading: isLoadingSliceTableData,
  } = useTableDataBySlice({ sliceFields })

  return (
    <Styled.Container>
      <Styled.Header>
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
      </Styled.Header>
      <SlicerTable
        data={sliceTableData}
        isExpandable={isExpandable}
        isLoading={isLoadingSliceTableData}
        sliceId={sliceType}
        globalFilter={globalFilter}
      />
    </Styled.Container>
  )
}

export default Slicer
