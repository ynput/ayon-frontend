import {
  useContext,
  ReactNode,
  ForwardRefExoticComponent,
  RefAttributes,
  useCallback,
  useMemo,
} from 'react'
import { ExpandedState, RowSelectionState } from '@tanstack/react-table'
import { SliceType } from '@shared/containers/Slicer'
import { SimpleTableRow } from '@shared/containers/SimpleTable'
import { useSessionStorage } from '@shared/hooks'
import type { ProjectModel, Assignees, AttributeModel, ProductType } from '@shared/api'
import { SlicerDropdownFallbackProps } from '../components/SlicerDropdownFallback'
import { DropdownRef } from '@ynput/ayon-react-components'
import { PinnedSlice, SliceTypeField } from '../types'
import { useViewsContext, useViewUpdateHelper } from '@shared/containers/Views'
import { SlicerContext } from './SlicerContextInstance'
import { useSlicerRemotes } from '../hooks/useSlicerRemotes'
import { useSlicerRowSelection } from '../hooks/useSlicerRowSelection'

export const SLICER_PAGES_CONFIG: SlicerConfig = {
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
      { value: 'entityList' },
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
      { value: 'entityList' },
    ],
  },
}

export type OnSliceTypeChange = (sliceType: SliceType, pinCurrent?: boolean) => void

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
  formatAuthors: (project?: ProjectModel) => SimpleTableRow[]
}

export type UseExtraSlices = () => ExtraSlices

type OnRowSelectionChange = (selection: RowSelectionState) => void

export interface SlicerContextValue {
  projectName: string
  rowSelection: RowSelectionState
  onRowSelectionChange: OnRowSelectionChange
  expanded: ExpandedState
  onExpandedChange: (expanded: ExpandedState) => void
  sliceType: SliceType
  onSliceTypeChange: OnSliceTypeChange
  isViewSyncPending: boolean
  pinnedSlice: PinnedSlice | null
  setPinnedSlice: React.Dispatch<React.SetStateAction<PinnedSlice | null>>
  useExtraSlices: UseExtraSlices
  isLoadingExtraSlices: boolean
  SlicerDropdown: ForwardRefExoticComponent<
    SlicerDropdownFallbackProps & RefAttributes<DropdownRef>
  >
}

interface SlicerProviderProps {
  children: ReactNode
  rowSelection?: RowSelectionState
  setRowSelection?: React.Dispatch<React.SetStateAction<RowSelectionState>>
  expanded?: ExpandedState
  setExpanded?: React.Dispatch<React.SetStateAction<ExpandedState>>
  sliceType?: SliceType
  onSliceTypeChange?: OnSliceTypeChange
  page: string
  projectName: string
}

export const SlicerProvider = ({ children, page, projectName, ...props }: SlicerProviderProps) => {
  const { viewSettings, isLoadingViews } = useViewsContext()
  // Get view update helper
  const { updateViewSettings } = useViewUpdateHelper()

  // @ts-expect-error - sliceType can be on a view
  const sliceType = props.sliceType ?? viewSettings?.sliceType ?? 'hierarchy'

  const { rowSelection, setRowSelection, expanded, setExpanded } = useSlicerRowSelection({
    sliceType,
    page,
    projectName,
    ...props,
  })

  // this is used to store another slice type whilst the user is viewing a different slice type
  // mostly used for preserving the hierarchy selection when switching to another slice type
  const [pinnedSlice, setPinnedSlice] = useSessionStorage<PinnedSlice | null>(
    `slicer-pinned-slice-${page}`,
    null,
  )

  const onRowSelectionChange = useCallback<OnRowSelectionChange>(
    (selection) => {
      setRowSelection(selection) // updates either hierarchy or other selection based on slice type
    },
    [setRowSelection],
  )

  const onSliceTypeChange = useCallback<OnSliceTypeChange>(
    (newSliceType, pinCurrent) => {
      if (props.onSliceTypeChange) {
        props.onSliceTypeChange(newSliceType, pinCurrent)
      } else {
        const noOp = () => {}
        // update the view settings with the new slice type
        updateViewSettings({ sliceType: newSliceType }, noOp, noOp, {})
      }

      // remove current row selection as it is no longer relevant to the new slice type

      // if going to pinned slice type, restore the pinned slice selection and expanded state
      // and remove the pinned slice
      if (pinnedSlice && newSliceType === pinnedSlice.sliceType) {
        setRowSelection(pinnedSlice.rowSelection, newSliceType)
        setExpanded(pinnedSlice.expanded, newSliceType)
        setPinnedSlice(null)
      } else {
        // clear pinned slice if switching to a different slice type
        console.log('Clearing current pinned slice as switching to a different slice type')
        setRowSelection({}, newSliceType)
        setExpanded({}, newSliceType)
      }

      // if pinCurrent is true, store the current slice type and selection data in local storage
      if (pinCurrent) {
        console.log('Pinning current slice type and selection data', rowSelection)
        setPinnedSlice({
          sliceType,
          rowSelection,
          expanded,
        })
      }
    },
    [
      updateViewSettings,
      rowSelection,
      setRowSelection,
      pinnedSlice,
      setPinnedSlice,
      expanded,
      setExpanded,
    ],
  )

  const onExpandedChange = useCallback(
    (newExpanded: ExpandedState) => {
      setExpanded(newExpanded)
    },
    [setExpanded],
  )

  // extra slices are loaded from the powerpack remote module, with a fallback to default empty functions
  const { useExtraSlices, isLoadingExtraSlices, SlicerDropdown } = useSlicerRemotes()

  const value = useMemo(
    () => ({
      projectName,
      useExtraSlices,
      isLoadingExtraSlices,
      SlicerDropdown,
      // SLICE TYPE
      sliceType,
      onSliceTypeChange,
      // ROW SELECTION
      rowSelection,
      onRowSelectionChange,
      // PINNED SLICE
      pinnedSlice,
      setPinnedSlice,
      expanded,
      onExpandedChange,
      // loading state
      isViewSyncPending: isLoadingViews,
    }),
    [
      useExtraSlices,
      isLoadingExtraSlices,
      SlicerDropdown,
      sliceType,
      onSliceTypeChange,
      rowSelection,
      onRowSelectionChange,
      pinnedSlice,
      setPinnedSlice,
      expanded,
      onExpandedChange,
      isLoadingViews,
    ],
  )

  return <SlicerContext.Provider value={value}>{children}</SlicerContext.Provider>
}

export const useSlicerContext = () => {
  const context = useContext(SlicerContext)
  if (context === undefined) {
    throw new Error('useSlicerContext must be used within a SlicerProvider')
  }
  return context
}

export default SlicerContext
