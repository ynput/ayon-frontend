import {
  useContext,
  ReactNode,
  ForwardRefExoticComponent,
  RefAttributes,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react'
import { ExpandedState, RowSelectionState } from '@tanstack/react-table'
import type { SliceType } from '../types'
import type { SimpleTableRow } from '@shared/containers/SimpleTable/SimpleTable.types'
import { readSessionStorage, useSessionStorage } from '@shared/hooks/useSessionStorage'
import type { ProjectModel, Assignees, AttributeModel, ProductType } from '@shared/api'
import { SlicerDropdownFallbackProps } from '../components/SlicerDropdownFallback'
import { DropdownRef } from '@ynput/ayon-react-components'
import { PinnedSlice, SlicePanel, SlicerViewSettings, SliceTypeField } from '../types'
import type { ViewSettings } from '@shared/containers/Views/context/ViewsContext'
import type { UpdateViewSettingsFn } from '@shared/containers/Views/utils/viewUpdateHelper'
import { SlicerContext } from './SlicerContextInstance'
import { useSlicerRemotes } from '../hooks/useSlicerRemotes'
import { useSlicerRowSelection } from '../hooks/useSlicerRowSelection'
import type { OnAddToList, OnOpenViewer } from '../hooks/useHierarchyContextMenuItems'
import { usePowerpack } from '@shared/context/PowerpackContext'

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

// pages where every panel contributes to data fetching (pinnedSlice is retired there);
// these are SlicerProvider `page` values — the versions/products page is 'products'
const MIGRATED_PAGES = ['overview', 'products']

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
  page: string
  rowSelection: RowSelectionState
  onRowSelectionChange: OnRowSelectionChange
  expanded: ExpandedState
  onExpandedChange: (expanded: ExpandedState) => void
  sliceType: SliceType
  onSliceTypeChange: OnSliceTypeChange
  slices: SlicePanel[]
  addSlicePanel: (sliceType?: SliceType) => void
  removeSlicePanel: (panelId: string) => void
  setPanelSliceType: (panelId: string, sliceType: SliceType) => void
  getPanelSelection: (panelId: string) => RowSelectionState
  setPanelSelection: (panelId: string, selection: React.SetStateAction<RowSelectionState>) => void
  getPanelExpanded: (panelId: string) => ExpandedState
  setPanelExpanded: (panelId: string, expanded: React.SetStateAction<ExpandedState>) => void
  collapsedPanels: string[]
  togglePanelCollapsed: (panelId: string) => void
  isViewSyncPending: boolean
  pinnedSlice: PinnedSlice | null
  setPinnedSlice: React.Dispatch<React.SetStateAction<PinnedSlice | null>>
  useExtraSlices: UseExtraSlices
  isLoadingExtraSlices: boolean
  SlicerDropdown: ForwardRefExoticComponent<
    SlicerDropdownFallbackProps & RefAttributes<DropdownRef>
  >
  onOpenViewer?: OnOpenViewer
  onAddToList?: OnAddToList
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
  viewSettings: ViewSettings | undefined
  isLoadingViews: boolean
  updateViewSettings: UpdateViewSettingsFn
  onOpenViewer?: OnOpenViewer
  onAddToList?: OnAddToList
}

export const SlicerProvider = ({
  children,
  page,
  projectName,
  viewSettings,
  isLoadingViews,
  updateViewSettings,
  onOpenViewer,
  onAddToList,
  ...props
}: SlicerProviderProps) => {
  // this is used to store another slice type whilst the user is viewing a different slice type
  // mostly used for preserving the hierarchy selection when switching to another slice type
  const [pinnedSlice, setPinnedSlice] = useSessionStorage<PinnedSlice | null>(
    `slicer-pinned-slice-${page}`,
    null,
  )

  const { powerLicense } = usePowerpack()

  const slicerViewSettings = viewSettings as SlicerViewSettings | undefined
  const storedSliceTypes = slicerViewSettings?.sliceTypes
  const legacySliceType = slicerViewSettings?.sliceType
  // an older client updates only sliceType, so let it win over a now stale sliceTypes[0]
  const viewSliceTypes = storedSliceTypes?.length
    ? legacySliceType && legacySliceType !== storedSliceTypes[0]
      ? [legacySliceType, ...storedSliceTypes.slice(1)]
      : storedSliceTypes
    : [legacySliceType ?? 'hierarchy']

  // pre-upgrade views kept the folder selection alive through an invisible pinned
  // hierarchy slice; surface it as a real second panel so the result set survives
  const migratePinnedHierarchy =
    MIGRATED_PAGES.includes(page) &&
    !props.sliceType &&
    !storedSliceTypes?.length &&
    viewSliceTypes[0] !== 'hierarchy' &&
    pinnedSlice?.sliceType === 'hierarchy' &&
    Object.values(pinnedSlice.rowSelection || {}).some(Boolean)

  const sliceTypes = useMemo(
    () => [
      ...new Set(
        props.sliceType
          ? [props.sliceType]
          : migratePinnedHierarchy
          ? [...viewSliceTypes, 'hierarchy']
          : viewSliceTypes,
      ),
    ],
    [props.sliceType, viewSliceTypes.join('|'), migratePinnedHierarchy],
  )
  const collapsedSliceTypes = slicerViewSettings?.collapsedSliceTypes
  const collapsedPanels = useMemo(
    () => collapsedSliceTypes ?? [],
    [collapsedSliceTypes?.join('|')],
  )

  const slices = useMemo<SlicePanel[]>(
    () => sliceTypes.map((t) => ({ id: t, sliceType: t })),
    [sliceTypes],
  )
  const sliceType = slices[0].sliceType

  const {
    rowSelection,
    setRowSelection,
    expanded,
    setExpanded,
    getPanelSelection,
    setPanelSelection,
    getPanelExpanded,
    setPanelExpanded,
  } = useSlicerRowSelection({
    sliceTypes,
    page,
    projectName,
    ...props,
  })

  const onRowSelectionChange = useCallback<OnRowSelectionChange>(
    (selection) => {
      setRowSelection(selection) // updates either hierarchy or other selection based on slice type
    },
    [setRowSelection],
  )

  const persistSliceTypes = useCallback(
    (next: SliceType[], collapsed?: SliceType[]) => {
      const noOp = () => {}
      // sliceType mirrors sliceTypes[0] so older clients keep a valid single dimension
      updateViewSettings(
        {
          sliceTypes: next,
          sliceType: next[0],
          collapsedSliceTypes: (collapsed ?? collapsedPanels).filter((t) => next.includes(t)),
        },
        noOp,
        noOp,
        {},
      )
    },
    [updateViewSettings, collapsedPanels],
  )

  const togglePanelCollapsed = useCallback(
    (panelId: string) => {
      const next = collapsedPanels.includes(panelId)
        ? collapsedPanels.filter((t) => t !== panelId)
        : [...collapsedPanels, panelId]
      persistSliceTypes(sliceTypes, next)
    },
    [collapsedPanels, persistSliceTypes, sliceTypes],
  )

  // persist the migrated arrangement; the pinned selection is copied into the
  // hierarchy bucket so the new panel starts with the same folder scope
  // the provider instance is reused across pages and projects, so the guards track
  // which target has already been migrated rather than whether one ever ran
  const migrationKey = `${projectName}-${page}`
  const migratedPinned = useRef(new Set<string>())
  useEffect(() => {
    if (!migratePinnedHierarchy || isLoadingViews || migratedPinned.current.has(migrationKey)) return
    migratedPinned.current.add(migrationKey)
    // the hierarchy bucket is shared across pages, so never replace a live selection
    if (!Object.keys(getPanelSelection('hierarchy')).length) {
      setPanelSelection('hierarchy', pinnedSlice!.rowSelection)
      setPanelExpanded('hierarchy', pinnedSlice!.expanded)
    }
    persistSliceTypes(sliceTypes)
  }, [migratePinnedHierarchy, isLoadingViews, migrationKey])

  // pre-upgrade views stored the active value slice's selection in one shared
  // per-page bucket (no sliceType suffix); move it into that slice's own bucket
  const migratedLegacyBucket = useRef(new Set<string>())
  useEffect(() => {
    if (
      migratedLegacyBucket.current.has(migrationKey) ||
      isLoadingViews ||
      props.sliceType ||
      props.rowSelection ||
      props.setRowSelection ||
      storedSliceTypes?.length
    )
      return
    migratedLegacyBucket.current.add(migrationKey)
    const legacySelectionKey = `slicer-selection-${projectName}-${page}`
    const legacyExpandedKey = `slicer-expanded-${projectName}-${page}`
    const activeType = viewSliceTypes[0]
    if (activeType !== 'hierarchy') {
      const legacySelection = readSessionStorage<RowSelectionState | null>(legacySelectionKey, null)
      if (legacySelection && Object.keys(legacySelection).length) {
        setPanelSelection(activeType, (current) =>
          Object.keys(current).length ? current : legacySelection,
        )
        const legacyExpanded = readSessionStorage<ExpandedState | null>(legacyExpandedKey, null)
        if (legacyExpanded) setPanelExpanded(activeType, legacyExpanded)
      }
    }
    sessionStorage.removeItem(legacySelectionKey)
    sessionStorage.removeItem(legacyExpandedKey)
  }, [isLoadingViews, storedSliceTypes, migrationKey])

  // migrated pages no longer read pinnedSlice for data fetching — drop any pin
  // not awaiting migration so the filter bar stops advertising a dead filter.
  // Waiting for storedSliceTypes keeps the migration source alive while the
  // settings write is in flight.
  useEffect(() => {
    if (MIGRATED_PAGES.includes(page) && !props.sliceType && !isLoadingViews) {
      if (pinnedSlice && !migratePinnedHierarchy) setPinnedSlice(null)
    }
  }, [page, props.sliceType, isLoadingViews, pinnedSlice, migratePinnedHierarchy, setPinnedSlice])

  const onSliceTypeChange = useCallback<OnSliceTypeChange>(
    (newSliceType, pinCurrent) => {
      // a dimension may only appear in one panel; without a license the extra panels are
      // stored but not rendered, so they give up the dimension instead of blocking it
      if (powerLicense && sliceTypes.slice(1).includes(newSliceType)) return
      if (props.onSliceTypeChange) {
        props.onSliceTypeChange(newSliceType, pinCurrent)
      } else {
        persistSliceTypes([newSliceType, ...sliceTypes.slice(1).filter((t) => t !== newSliceType)])
      }

      // remove current row selection as it is no longer relevant to the new slice type

      // if going to pinned slice type, restore the pinned slice selection and expanded state
      // and remove the pinned slice
      if (pinnedSlice && newSliceType === pinnedSlice.sliceType) {
        setRowSelection(pinnedSlice.rowSelection, newSliceType)
        setExpanded(pinnedSlice.expanded, newSliceType)
        setPinnedSlice(null)
      } else if (newSliceType !== 'hierarchy') {
        // hierarchy keeps its project-wide selection
        setRowSelection({}, newSliceType)
        setExpanded({}, newSliceType)
      }

      // if pinCurrent is true, store the current slice type and selection data in local storage
      if (pinCurrent) {
        setPinnedSlice({
          sliceType,
          rowSelection,
          expanded,
        })
      }
    },
    [
      persistSliceTypes,
      sliceTypes,
      rowSelection,
      setRowSelection,
      pinnedSlice,
      setPinnedSlice,
      expanded,
      setExpanded,
      powerLicense,
    ],
  )

  const clearPanelState = useCallback(
    (newSliceType: SliceType) => {
      if (newSliceType === 'hierarchy') return
      setPanelSelection(newSliceType, {})
      setPanelExpanded(newSliceType, {})
    },
    [setPanelSelection, setPanelExpanded],
  )

  const addSlicePanel = useCallback(
    (newSliceType?: SliceType) => {
      if (!newSliceType || sliceTypes.includes(newSliceType)) return
      persistSliceTypes([...sliceTypes, newSliceType])
      clearPanelState(newSliceType)
    },
    [sliceTypes, persistSliceTypes, clearPanelState],
  )

  const removeSlicePanel = useCallback(
    (panelId: string) => {
      if (sliceTypes.length <= 1 || !sliceTypes.includes(panelId)) return
      persistSliceTypes(sliceTypes.filter((t) => t !== panelId))
    },
    [sliceTypes, persistSliceTypes],
  )

  const setPanelSliceType = useCallback(
    (panelId: string, newSliceType: SliceType) => {
      if (!sliceTypes.includes(panelId) || sliceTypes.includes(newSliceType)) return
      // the slice type doubles as the panel id, so collapsed follows the rename
      persistSliceTypes(
        sliceTypes.map((t) => (t === panelId ? newSliceType : t)),
        collapsedPanels.map((t) => (t === panelId ? newSliceType : t)),
      )
      clearPanelState(newSliceType)
    },
    [sliceTypes, persistSliceTypes, clearPanelState, collapsedPanels],
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
      page,
      useExtraSlices,
      isLoadingExtraSlices,
      SlicerDropdown,
      // SLICE TYPE
      sliceType,
      onSliceTypeChange,
      // SLICE PANELS
      slices,
      addSlicePanel,
      removeSlicePanel,
      setPanelSliceType,
      getPanelSelection,
      setPanelSelection,
      getPanelExpanded,
      setPanelExpanded,
      collapsedPanels,
      togglePanelCollapsed,
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
      onOpenViewer,
      onAddToList,
    }),
    [
      page,
      useExtraSlices,
      isLoadingExtraSlices,
      SlicerDropdown,
      sliceType,
      onSliceTypeChange,
      slices,
      collapsedPanels,
      togglePanelCollapsed,
      addSlicePanel,
      removeSlicePanel,
      setPanelSliceType,
      getPanelSelection,
      setPanelSelection,
      getPanelExpanded,
      setPanelExpanded,
      rowSelection,
      onRowSelectionChange,
      pinnedSlice,
      setPinnedSlice,
      expanded,
      onExpandedChange,
      isLoadingViews,
      onOpenViewer,
      onAddToList,
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

export const useOptionalSlicerContext = () => useContext(SlicerContext)

export default SlicerContext
