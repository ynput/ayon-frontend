import { FC } from 'react'
import * as Styled from './Slicer.styled'
import SlicerTable from './SlicerTable'

import useTableDataBySlice, { SliceType } from './hooks/useTableDataBySlice'

interface SlicerProps {}

const Slicer: FC<SlicerProps> = ({}) => {
  const {
    sliceOptions,
    sliceType,
    handleSliceChange,
    table: { data: sliceTableData, isExpandable },
    isLoading: isLoadingSliceTableData,
  } = useTableDataBySlice({})

  return (
    <Styled.Container>
      <Styled.Header>
        <Styled.SlicerDropdown
          options={sliceOptions}
          value={[sliceType]}
          onChange={(value) => handleSliceChange(value[0] as SliceType)}
        />
      </Styled.Header>
      <SlicerTable
        data={sliceTableData}
        isExpandable={isExpandable}
        isLoading={isLoadingSliceTableData}
        sliceId={sliceType}
      />
    </Styled.Container>
  )
}

export default Slicer
