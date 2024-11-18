import { FC, useState } from 'react'
import * as Styled from './Slicer.styled'
import SlicerTable from './SlicerTable'

import useTableDataBySlice, { SliceType } from './hooks/useTableDataBySlice'
import SlicerSearch from './SlicerSearch'
import clsx from 'clsx'

interface SlicerProps {
  sliceFields: SliceType[]
}

const Slicer: FC<SlicerProps> = ({ sliceFields = [] }) => {
  const [globalFilter, setGlobalFilter] = useState('')

  const {
    sliceOptions,
    sliceType,
    handleSliceChange,
    table: { data: sliceTableData, isExpandable },
    isLoading: isLoadingSliceTableData,
  } = useTableDataBySlice({ sliceFields })

  return (
    <Styled.Container>
      <Styled.Header>
        <Styled.SlicerDropdown
          options={sliceOptions || []}
          value={[sliceType]}
          onChange={(value) => handleSliceChange(value[0] as SliceType)}
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
