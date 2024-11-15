import { FC, useState } from 'react'
import * as Styled from './Slicer.styled'
import SlicerTable from './SlicerTable'

import useTableDataBySlice, { SliceType } from './hooks/useTableDataBySlice'
import SlicerSearch from './SlicerSearch'

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
