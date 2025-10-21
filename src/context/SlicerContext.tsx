import {
  createContext,
  useContext,
  useState,
  ReactNode,
  ForwardRefExoticComponent,
  RefAttributes,
} from 'react'
import { ExpandedState, RowSelectionState } from '@tanstack/react-table'
import useSlicerReduxSync from '@containers/Slicer/hooks/useSlicerReduxSync'
import { SelectionData, SliceDataItem, SliceType } from '@shared/containers/Slicer'
import { SimpleTableRow } from '@shared/containers/SimpleTable'
import { useLoadModule } from '@shared/hooks'
import type { ProjectModel, Assignees, AttributeModel } from '@shared/api'
import SlicerDropdownFallback, { SlicerDropdownProps } from '@containers/Slicer/SlicerDropdown'
import { DropdownRef } from '@ynput/ayon-react-components'
import { SliceMap } from '@containers/Slicer/types'
import { usePowerpack } from '@shared/context'

export type OnSliceTypeChange = (
  sliceType: SliceType,
  leavePersistentSlice: boolean,
  returnToPersistentSlice: boolean,
) => void

export type SlicerConfig = {
  [page: string]: {
    fields: SliceType[]
  }
}

type ExtraSlices = {
  formatStatuses: (project?: ProjectModel) => SimpleTableRow[]
  formatTaskTypes: (project?: ProjectModel) => SimpleTableRow[]
  formatTypes: (project?: ProjectModel) => SimpleTableRow[]
  formatAssignees: (assignees: Assignees) => SimpleTableRow[]
  formatAttribute: (attribute: AttributeModel) => SimpleTableRow[]
}

export type UseExtraSlices = () => ExtraSlices

type OnRowSelectionChange = (selection: RowSelectionState, data: SliceMap) => void

interface SlicerContextValue {
  rowSelection: RowSelectionState
  setRowSelection: React.Dispatch<React.SetStateAction<RowSelectionState>>
  onRowSelectionChange?: OnRowSelectionChange
  expanded: ExpandedState
  setExpanded: React.Dispatch<React.SetStateAction<ExpandedState>>
  onExpandedChange?: (expanded: ExpandedState) => void
  sliceType: SliceType
  onSliceTypeChange: OnSliceTypeChange
  rowSelectionData: SelectionData
  setRowSelectionData: React.Dispatch<React.SetStateAction<SelectionData>>
  persistentRowSelectionData: SelectionData
  setPersistentRowSelectionData: React.Dispatch<React.SetStateAction<SelectionData>>
  config: SlicerConfig
  useExtraSlices: UseExtraSlices
  SlicerDropdown: ForwardRefExoticComponent<SlicerDropdownProps & RefAttributes<DropdownRef>>
}

const SlicerContext = createContext<SlicerContextValue | undefined>(undefined)

interface SlicerProviderProps {
  children: ReactNode
}

export const SlicerProvider = ({ children }: SlicerProviderProps) => {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [rowSelectionData, setRowSelectionData] = useState<SelectionData>({})
  // if there is a need to leavePersistentSlice row selection data between slice changes (like the hierarchy)
  const [persistentRowSelectionData, setPersistentRowSelectionData] = useState<SelectionData>({})
  const [expanded, setExpanded] = useState<ExpandedState>({})
  const [sliceType, setSliceType] = useState<SliceType>('hierarchy')
  const config: SlicerConfig = {
    progress: {
      fields: ['hierarchy', 'assignees', 'status', 'taskType'],
    },
    overview: {
      fields: ['hierarchy', 'assignees', 'status', 'type', 'taskType', 'attributes'],
    },
    versions: {
      fields: ['hierarchy', 'author', 'status', 'productType', 'taskType', 'assignees'],
    },
  }

  const { useExtraSlices, SlicerDropdown } = useSlicerRemotes()

  const { onRowSelectionChange, onExpandedChange } = useSlicerReduxSync({
    setExpanded,
    sliceType,
  })

  const getSelectionData = (selection: RowSelectionState, data: SliceMap) => {
    // for each selected row, get the data
    const selectedRows = Object.keys(selection)
      .filter((id) => selection[id]) // only include selected rows
      .reduce<Record<string, SliceDataItem>>((acc, id) => {
        const rowData = data.get(id)

        if (!rowData) {
          console.warn(`Row with id ${id} not found in data`)
          return acc
        }

        acc[id] = rowData
        return acc
      }, {})

    return selectedRows
  }

  //   do something with selection change
  const handleRowSelectionChange: OnRowSelectionChange = (selection, data) => {
    if (sliceType === 'hierarchy') {
      // update redux focused folders
      onRowSelectionChange(selection)
    }

    // get selection data
    const selectionData = getSelectionData(selection, data)
    setRowSelectionData(selectionData)
  }

  const handleExpandedChange = (expanded: ExpandedState) => {
    if (sliceType === 'hierarchy') {
      // update redux expanded folders
      onExpandedChange(expanded)
    }
  }

  const handleSliceTypeChange: OnSliceTypeChange = (
    sliceType,
    leavePersistentSlice,
    returnToPersistentSlice,
  ) => {
    // reset selection
    setRowSelection({})
    // set slice type
    setSliceType(sliceType)
    // reset selection data
    setRowSelectionData({})
    // set persistent selection data
    if (leavePersistentSlice) setPersistentRowSelectionData(rowSelectionData)
    // we returned to the persisted slice type

    if (returnToPersistentSlice) {
      // clear the persisted selection data
      setPersistentRowSelectionData({})
      // restore the selection data and selection
      setRowSelectionData(persistentRowSelectionData)
      setRowSelection(
        Object.keys(persistentRowSelectionData).reduce((acc, id) => {
          acc[id] = true
          return acc
        }, {} as RowSelectionState),
      )
    }
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
        rowSelectionData,
        setRowSelectionData,
        persistentRowSelectionData,
        setPersistentRowSelectionData,
        config,
        useExtraSlices,
        SlicerDropdown,
      }}
    >
      {children}
    </SlicerContext.Provider>
  )
}

const useSlicerRemotes = () => {
  const useExtraSlicesDefault: UseExtraSlices = () => {
    return {
      formatStatuses: () => [],
      formatTaskTypes: () => [],
      formatTypes: () => [],
      formatAssignees: () => [],
      formatAttribute: () => [],
      formatProductTypes: () => [],
      formatAuthors: () => [],
    }
  }

  const { powerLicense } = usePowerpack()

  // slicer transformers
  const [useExtraSlices] = useLoadModule({
    addon: 'powerpack',
    remote: 'slicer',
    module: 'useExtraSlices',
    fallback: useExtraSlicesDefault,
    skip: !powerLicense, // skip loading if powerpack license is not available
  })

  const [SlicerDropdown] = useLoadModule({
    addon: 'powerpack',
    remote: 'slicer',
    module: 'SlicerDropdown',
    fallback: SlicerDropdownFallback,
    skip: !powerLicense, // skip loading if powerpack license is not available
  })

  return { useExtraSlices, SlicerDropdown: SlicerDropdown }
}

export const useSlicerContext = () => {
  const context = useContext(SlicerContext)
  if (context === undefined) {
    throw new Error('useSlicerContext must be used within a SlicerProvider')
  }
  return context
}

export default SlicerContext
