// filters the tasks and folder rows by the slice type and slice value

import { useSlicerContext } from '@context/slicerContext'
import { FilterBySliceData } from '@shared/containers/Slicer'
import { createFilterFromSlicer } from '@shared/containers/Slicer'

const useFilterBySlice = (): FilterBySliceData => {
  const { sliceType, rowSelectionData } = useSlicerContext()

  const filter = createFilterFromSlicer({ type: sliceType, selection: rowSelectionData })

  return {
    filter,
  }
}

export default useFilterBySlice
