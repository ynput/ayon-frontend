// filters the tasks and folder rows by the slice type and slice value

import { useSlicerContext } from '@context/slicerContext'
import { FilterBySliceData } from '@shared/Slicer'
import { createFilterFromSlicer } from '@shared/Slicer/createFilterFromSlicer'

const useFilterBySlice = (): FilterBySliceData => {
  const { sliceType, rowSelectionData } = useSlicerContext()

  const filter = createFilterFromSlicer({ type: sliceType, selection: rowSelectionData })

  return {
    filter,
  }
}

export default useFilterBySlice
