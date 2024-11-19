import { createContext, useContext, useState, ReactNode } from 'react'
import { ExpandedState, RowSelectionState } from '@tanstack/react-table'
import useSlicerReduxSync from '@containers/Slicer/hooks/useSlicerReduxSync'

export type SliceType = 'hierarchy' | 'users' | 'status' | 'type'
const sliceTypes: SliceType[] = ['hierarchy', 'users', 'status', 'type']

interface SlicerContextValue {
  rowSelection: RowSelectionState
  setRowSelection: React.Dispatch<React.SetStateAction<RowSelectionState>>
  onRowSelectionChange?: (selection: RowSelectionState) => void
  expanded: ExpandedState
  setExpanded: React.Dispatch<React.SetStateAction<ExpandedState>>
  onExpandedChange?: (expanded: ExpandedState) => void
  sliceType: SliceType
  onSliceTypeChange: (sliceType: SliceType) => void
}

const SlicerContext = createContext<SlicerContextValue | undefined>(undefined)

interface SlicerProviderProps {
  children: ReactNode
}

export const SlicerProvider = ({ children }: SlicerProviderProps) => {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [expanded, setExpanded] = useState<ExpandedState>({})
  const [sliceType, setSliceType] = useState<SliceType>('hierarchy')

  const { onRowSelectionChange, onExpandedChange } = useSlicerReduxSync({
    setRowSelection,
    setExpanded,
  })

  //   do something with selection change
  const handleRowSelectionChange = (selection: RowSelectionState) => {
    // update redux focused folders
    onRowSelectionChange(selection)
  }

  const handleExpandedChange = (expanded: ExpandedState) => {
    // update redux expanded folders
    onExpandedChange(expanded)
  }

  const handleSliceTypeChange = (sliceType: SliceType) => {
    if (!sliceTypes.includes(sliceType)) return console.log('Invalid slice type')
    // reset selection
    setRowSelection({})
    // set slice type
    setSliceType(sliceType)
  }

  return (
    <SlicerContext.Provider
      value={{
        rowSelection,
        setRowSelection,
        onRowSelectionChange: handleRowSelectionChange,
        expanded,
        setExpanded,
        onExpandedChange: handleExpandedChange,
        sliceType,
        onSliceTypeChange: handleSliceTypeChange,
      }}
    >
      {children}
    </SlicerContext.Provider>
  )
}

export const useSlicerContext = () => {
  const context = useContext(SlicerContext)
  if (context === undefined) {
    throw new Error('useSlicerContext must be used within a SlicerProvider')
  }
  return context
}

export default SlicerContext
