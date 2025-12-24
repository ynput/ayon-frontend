import {
  createContext,
  useContext,
  useState,
  ReactNode,
  ForwardRefExoticComponent,
  RefAttributes,
} from 'react'
import { ExpandedState, RowSelectionState } from '@tanstack/react-table'
import { SelectionData, SliceDataItem, SliceType } from '@shared/containers/Slicer'
import { SimpleTableRow } from '@shared/containers/SimpleTable'
import { useLoadModule } from '@shared/hooks'
import type { ProjectModel, Assignees, AttributeModel, ProductType } from '@shared/api'
import SlicerDropdownFallback, {
  SlicerDropdownFallbackProps,
} from '../components/SlicerDropdownFallback'
import { DropdownRef } from '@ynput/ayon-react-components'
import { SliceMap, SliceTypeField } from '../types'
import { usePowerpack } from '@shared/context'

export type OnSliceTypeChange = (
  sliceType: SliceType,
  leavePersistentSlice: boolean,
  returnToPersistentSlice: boolean,
) => void

export type SlicerConfig = {
  [page: string]: {
    fields: SliceTypeField[]
  }
}

type ExtraSlices = {
  formatStatuses: (project?: ProjectModel, scopes?: string[]) => SimpleTableRow[]
  formatTaskTypes: (project?: ProjectModel) => SimpleTableRow[]
  formatProductTypes: (productTypes: ProductType[]) => SimpleTableRow[]
  formatTypes: (project?: ProjectModel) => SimpleTableRow[]
  formatAssignees: (assignees: Assignees) => SimpleTableRow[]
  formatAttribute: (attribute: AttributeModel) => SimpleTableRow[]
}

export type UseExtraSlices = () => ExtraSlices

type OnRowSelectionChange = (selection: RowSelectionState, data: SliceMap) => void

export interface SlicerContextValue {
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
  SlicerDropdown: ForwardRefExoticComponent<
    SlicerDropdownFallbackProps & RefAttributes<DropdownRef>
  >
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
      fields: [
        { value: 'hierarchy' },
        { value: 'assignees' },
        { value: 'status' },
        { value: 'taskType' },
      ],
    },
    overview: {
      fields: [
        { value: 'hierarchy' },
        { value: 'assignees' },
        { value: 'status' },
        { value: 'type' },
        { value: 'taskType' },
        { value: 'attributes' },
      ],
    },
    versions: {
      fields: [
        { value: 'hierarchy' },
        { value: 'assignees', label: 'Task assignee' },
        { value: 'status', label: 'Version status' },
        { value: 'author', label: 'Version author' },
        { value: 'productType' },
        { value: 'taskType' },
      ],
    },
  }

  const { useExtraSlices, SlicerDropdown } = useSlicerRemotes()

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
    // get selection data
    const selectionData = getSelectionData(selection, data)
    setRowSelectionData(selectionData)
  }

  const handleExpandedChange = (_expanded: ExpandedState) => {}

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
